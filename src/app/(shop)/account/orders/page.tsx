import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { getOrdersForUser } from "@/lib/orders";
import { formatDate, formatPrice, shortId } from "@/lib/format";
import { EmptyState, PageTitle, StatusBadge } from "@/components/ui";
import { ProductImage } from "@/components/product-image";

export const metadata: Metadata = { title: "My orders" };

export default async function OrdersPage() {
  const user = await requireUser("/account/orders");
  const orders = await getOrdersForUser(user.id);

  return (
    <div>
      <PageTitle eyebrow="Account" title="My orders" />
      {orders.length === 0 ? (
        <EmptyState title="No orders yet" body="When you buy something it'll show up here." action={{ href: "/", label: "Start shopping" }} />
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => (
            <li key={o.id} className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-paper/60 px-5 py-3 text-xs">
                <div className="flex flex-wrap gap-x-6 gap-y-1">
                  <span><span className="text-muted">Order</span> <strong>#{shortId(o.id)}</strong></span>
                  <span><span className="text-muted">Placed</span> {formatDate(o.createdAt)}</span>
                  <span><span className="text-muted">Total</span> <strong>{formatPrice(o.totalCents)}</strong></span>
                </div>
                <Link href={`/account/orders/${o.id}`} className="font-semibold text-jade-700 hover:underline">Details & tracking →</Link>
              </div>
              <ul className="divide-y divide-line">
                {o.subOrders.map((sub) => (
                  <li key={sub.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
                    <div className="flex -space-x-3">
                      {sub.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="relative h-11 w-11 overflow-hidden rounded-lg border-2 border-white bg-paper">
                          <ProductImage src={item.imageUrlSnapshot} alt="" width={100} />
                        </div>
                      ))}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-wide text-jade-700">{sub.store.name}</p>
                      <p className="line-clamp-1 text-sm text-ink-soft">{sub.items.map((i) => i.titleSnapshot).join(", ")}</p>
                    </div>
                    <StatusBadge status={o.status === "pending" ? "pending" : sub.status} />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
