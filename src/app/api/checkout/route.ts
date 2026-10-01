import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/dal";
import { db } from "@/db";
import { orders, orderItems, products } from "@/db/schema";
import { stripe } from "@/lib/stripe";

type CheckoutItem = { productId: string; quantity: number };

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const items: CheckoutItem[] = Array.isArray(body.items) ? body.items : [];
  const shippingName: string = body.shippingName ?? "";
  const shippingAddress = body.shippingAddress ?? {};

  if (items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }
  if (!shippingName.trim() || !shippingAddress.line1) {
    return NextResponse.json(
      { error: "Shipping address is required" },
      { status: 400 }
    );
  }

  // Never trust client-supplied prices — look up authoritative data from the DB.
  const dbProducts = await db.query.products.findMany({
    where: inArray(
      products.id,
      items.map((i) => i.productId)
    ),
  });
  const productMap = new Map(dbProducts.map((p) => [p.id, p]));

  const lineItems = items
    .map((item) => {
      const product = productMap.get(item.productId);
      if (!product || item.quantity < 1) return null;
      return { product, quantity: item.quantity };
    })
    .filter((i): i is { product: (typeof dbProducts)[number]; quantity: number } => i !== null);

  if (lineItems.length === 0) {
    return NextResponse.json({ error: "No valid items in cart" }, { status: 400 });
  }

  const totalCents = lineItems.reduce(
    (sum, i) => sum + i.product.priceCents * i.quantity,
    0
  );

  const [order] = await db
    .insert(orders)
    .values({
      userId: user.id,
      status: "pending",
      totalCents,
      shippingName,
      shippingAddress,
    })
    .returning();

  await db.insert(orderItems).values(
    lineItems.map((i) => ({
      orderId: order.id,
      productId: i.product.id,
      titleSnapshot: i.product.title,
      imageUrlSnapshot: i.product.imageUrl,
      priceCentsSnapshot: i.product.priceCents,
      quantity: i.quantity,
    }))
  );

  // Derive from the incoming request rather than NEXT_PUBLIC_APP_URL — a
  // request handler always knows its real origin, so this can't drift out
  // of sync with wherever the app is actually deployed.
  const appUrl = new URL(request.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email ?? undefined,
    line_items: lineItems.map((i) => ({
      quantity: i.quantity,
      price_data: {
        currency: "usd",
        unit_amount: i.product.priceCents,
        product_data: {
          name: i.product.title,
          images: [i.product.imageUrl],
        },
      },
    })),
    success_url: `${appUrl}/order/confirmed?orderId=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/checkout`,
    metadata: { orderId: order.id },
  });

  await db
    .update(orders)
    .set({ stripeSessionId: session.id })
    .where(eq(orders.id, order.id));

  return NextResponse.json({ url: session.url });
}
