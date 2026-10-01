import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { getOrderForUser } from "@/lib/orders";
import { formatDate, formatPrice, shortId } from "@/lib/format";
import { OrderTracker } from "@/components/order-tracker";
import { ProductImage } from "@/components/product-image";
import { StatusBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Order details" };

export default async function OrderDetailPage(props: PageProps<"/account/orders/[id]">) {
  const { id } = await props.params;
  const user = await requireUser(`/account/orders/${id}`);
  // Scoped by user id: another buyer's order id just 404s.
  const order = await getOrderForUser(id, user.id);
  if (!order) notFound();

  return (
    <div className="space-y-5">
      <div>
        <Link href="/account/orders" className="text-xs font-semibold text-muted hover:text-ink">← All orders</Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight">Order #{shortId(order.id)}</h1>
          <StatusBadge status={order.status} />
        </div>
        <p className="mt-1 text-sm text-muted">
          Placed {formatDate(order.createdAt)} · {order.subOrders.length} {order.subOrders.length === 1 ? "package" : "packages"}
        </p>
      </div>

      {order.subOrders.map((sub, i) => (
        <section key={sub.id} className="card overflow-hidden">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
            <p className="text-sm">
              <span className="text-muted">Package {i + 1} from </span>
              <Link href={`/store/${sub.store.slug}`} className="font-bold hover:text-jade-700">{sub.store.name}</Link>
            </p>
            <span className="text-sm font-bold">{formatPrice(sub.subtotalCents)}</span>
          </header>
          <div className="px-5 py-4">
            <OrderTracker status={order.status === "pending" ? "pending" : sub.status} />
          </div>
          <ul className="divide-y divide-line border-t border-line">
            {sub.items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 px-5 py-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-paper">
                  <ProductImage src={item.imageUrlSnapshot} alt="" width={140} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium">{item.titleSnapshot}</p>
                  <p className="text-xs text-muted">Qty {item.quantity} × {formatPrice(item.priceCentsSnapshot)}</p>
                </div>
                {sub.status === "delivered" && (
                  <Link href={`/product/${item.product.slug}#reviews`} className="btn btn-outline btn-sm">
                    Write a review
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="card grid gap-6 p-5 sm:grid-cols-2">
        <div>
          <p className="eyebrow">Delivering to</p>
          <p className="mt-2 text-sm font-semibold">{order.shippingName}</p>
          <p className="text-sm text-ink-soft">
            {order.shippingAddress.line1}
            <br />
            {order.shippingAddress.city}, {order.shippingAddress.region} {order.shippingAddress.postalCode}
          </p>
          {order.shippingPhone && <p className="mt-1 text-sm text-muted">{order.shippingPhone}</p>}
        </div>
        <dl className="space-y-1.5 text-sm sm:text-right">
          <p className="eyebrow">Payment</p>
          <div className="flex justify-between sm:justify-end sm:gap-6"><dt className="text-muted">Items</dt><dd>{formatPrice(order.totalCents)}</dd></div>
          <div className="flex justify-between sm:justify-end sm:gap-6"><dt className="text-muted">Shipping</dt><dd>Free</dd></div>
          <div className="flex justify-between font-extrabold sm:justify-end sm:gap-6"><dt>Total</dt><dd>{formatPrice(order.totalCents)}</dd></div>
          {order.paidAt && <p className="text-xs text-muted">Paid by card on {formatDate(order.paidAt)}</p>}
        </dl>
      </section>
    </div>
  );
}
