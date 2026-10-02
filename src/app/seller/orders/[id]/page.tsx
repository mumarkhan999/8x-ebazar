import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSeller } from "@/lib/dal";
import { getSubOrderForStore, SELLER_TRANSITIONS } from "@/lib/orders";
import { updateSubOrderStatus } from "@/lib/actions/orders";
import { formatDate, formatPrice, shortId } from "@/lib/format";
import { OrderTracker } from "@/components/order-tracker";
import { ProductImage } from "@/components/product-image";
import { StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export const metadata: Metadata = { title: "Order · Seller Center" };

const ACTION_LABEL = {
  packed: "Mark as packed",
  shipped: "Mark as shipped",
  delivered: "Mark as delivered",
  cancelled: "Cancel order",
} as const;

export default async function SellerOrderPage(props: PageProps<"/seller/orders/[id]">) {
  const { id } = await props.params;
  const { store } = await requireSeller();
  const sub = await getSubOrderForStore(id, store.id);
  if (!sub) notFound();

  const next = SELLER_TRANSITIONS[sub.status];
  const address = sub.order.shippingAddress;

  return (
    <div className="space-y-5">
      <div>
        <Link href="/seller/orders" className="text-xs font-semibold text-muted hover:text-ink">← Orders</Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight">Order #{shortId(sub.id)}</h1>
          <StatusBadge status={sub.status} />
        </div>
        <p className="mt-1 text-sm text-muted">Placed {formatDate(sub.createdAt)} by {sub.order.user.name}</p>
      </div>

      <section className="card p-5">
        <OrderTracker status={sub.status} />
        {next.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
            {next.map((status) => (
              <form key={status} action={updateSubOrderStatus.bind(null, sub.id, status)}>
                <SubmitButton className={status === "cancelled" ? "btn btn-danger" : "btn btn-primary"}>
                  {ACTION_LABEL[status as keyof typeof ACTION_LABEL]}
                </SubmitButton>
              </form>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className="card">
          <h2 className="border-b border-line px-5 py-4 font-extrabold">Items to ship</h2>
          <ul className="divide-y divide-line">
            {sub.items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 px-5 py-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-paper">
                  <ProductImage src={item.imageUrlSnapshot} alt="" width={140} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium">{item.titleSnapshot}</p>
                  <p className="text-xs text-muted">{formatPrice(item.priceCentsSnapshot)} each</p>
                </div>
                <span className="text-sm font-bold">× {item.quantity}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-line px-5 py-3 font-extrabold">
            <span>Subtotal</span>
            <span>{formatPrice(sub.subtotalCents)}</span>
          </div>
        </section>

        <section className="card h-fit p-5 text-sm">
          <p className="eyebrow">Ship to</p>
          <p className="mt-2 font-semibold">{sub.order.shippingName}</p>
          <p className="text-ink-soft">
            {address.line1}
            <br />
            {address.city}, {address.region} {address.postalCode}
          </p>
          {sub.order.shippingPhone && <p className="mt-1 text-muted">{sub.order.shippingPhone}</p>}
          <p className="mt-4 text-xs text-muted">Customer: {sub.order.user.email}</p>
        </section>
      </div>
    </div>
  );
}
