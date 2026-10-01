import { NextResponse } from "next/server";
import { and, asc, eq, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/dal";
import { db } from "@/db";
import { orderItems, orders, productImages, products, subOrders } from "@/db/schema";
import { isVisible } from "@/lib/catalog";
import { CheckoutSchema } from "@/lib/definitions";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in to check out." }, { status: 401 });
  }

  const parsed = CheckoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message ?? "Invalid checkout." }, { status: 400 });
  }
  const { items, shippingName, shippingPhone, shippingAddress } = parsed.data;

  // Never trust client prices — read price, stock and owner from the DB, and
  // only for products that are currently purchasable.
  const ids = [...new Set(items.map((i) => i.productId))];
  const rows = await db.query.products.findMany({
    where: and(inArray(products.id, ids), isVisible),
    with: {
      images: { columns: { url: true }, orderBy: [asc(productImages.position)], limit: 1 },
      store: { columns: { id: true, ownerId: true } },
    },
  });
  const byId = new Map(rows.map((p) => [p.id, p]));

  const lines = [];
  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product) {
      return NextResponse.json(
        { error: "An item in your cart is no longer available. Please review your cart." },
        { status: 409 }
      );
    }
    if (product.store.ownerId === user.id) {
      return NextResponse.json({ error: `You can't buy from your own store: "${product.title}".` }, { status: 400 });
    }
    if (product.stock < item.quantity) {
      return NextResponse.json(
        { error: `Only ${product.stock} left of "${product.title}".` },
        { status: 409 }
      );
    }
    lines.push({ product, quantity: item.quantity });
  }

  // Split the cart by store: one order (one payment) with a sub-order per
  // store, which is what each seller sees and fulfils.
  const byStore = new Map<string, typeof lines>();
  for (const line of lines) {
    const group = byStore.get(line.product.storeId) ?? [];
    group.push(line);
    byStore.set(line.product.storeId, group);
  }

  const orderId = crypto.randomUUID();
  const totalCents = lines.reduce((s, l) => s + l.product.priceCents * l.quantity, 0);
  const subRows = [...byStore].map(([storeId, group]) => ({
    id: crypto.randomUUID(),
    orderId,
    storeId,
    subtotalCents: group.reduce((s, l) => s + l.product.priceCents * l.quantity, 0),
    group,
  }));

  // neon-http has no interactive transactions; batch() runs these atomically.
  await db.batch([
    db.insert(orders).values({
      id: orderId,
      userId: user.id,
      totalCents,
      shippingName,
      shippingPhone,
      shippingAddress,
    }),
    db.insert(subOrders).values(
      subRows.map((s) => ({ id: s.id, orderId: s.orderId, storeId: s.storeId, subtotalCents: s.subtotalCents }))
    ),
    db.insert(orderItems).values(
      subRows.flatMap((sub) =>
        sub.group.map((l) => ({
          subOrderId: sub.id,
          productId: l.product.id,
          titleSnapshot: l.product.title,
          imageUrlSnapshot: l.product.images[0]?.url ?? "",
          priceCentsSnapshot: l.product.priceCents,
          quantity: l.quantity,
        }))
      )
    ),
  ]);

  // A request handler always knows its real origin, so this can't drift from
  // wherever the app is deployed.
  const appUrl = new URL(request.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    line_items: lines.map((l) => ({
      quantity: l.quantity,
      price_data: {
        currency: "usd",
        unit_amount: l.product.priceCents,
        product_data: {
          name: l.product.title,
          images: l.product.images[0]?.url ? [l.product.images[0].url] : undefined,
        },
      },
    })),
    success_url: `${appUrl}/order/confirmed?orderId=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/checkout`,
    metadata: { orderId },
  });

  await db.update(orders).set({ stripeSessionId: session.id }).where(eq(orders.id, orderId));

  return NextResponse.json({ url: session.url });
}
