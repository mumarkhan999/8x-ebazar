import type { Metadata } from "next";
import Link from "next/link";
import { requireSeller } from "@/lib/dal";
import { getSubOrdersForStore } from "@/lib/orders";
import { formatDate, formatPrice, shortId } from "@/lib/format";
import { subOrderStatus, type SubOrderStatus } from "@/db/schema";
import { EmptyState, PageTitle, StatusBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Orders · Seller Center" };

const TABS: (SubOrderStatus | undefined)[] = [undefined, "paid", "packed", "shipped", "delivered", "cancelled"];

export default async function SellerOrdersPage(props: PageProps<"/seller/orders">) {
  const { store } = await requireSeller();
  const sp = await props.searchParams;
  const status = subOrderStatus.enumValues.includes(sp.status as SubOrderStatus) ? (sp.status as SubOrderStatus) : undefined;
  const orders = await getSubOrdersForStore(store.id, status);

  return (
    <div>
      <PageTitle eyebrow="Seller Center" title="Orders" />
      <p className="-mt-3 mb-5 max-w-2xl text-sm text-muted">
        These are the parts of customer orders that {store.name} needs to ship. Move each one along as you pack and dispatch it — the buyer sees every update.
      </p>

      <div className="scrollbar-none mb-4 flex gap-2 overflow-x-auto">
        {TABS.map((s) => (
          <Link
            key={s ?? "all"}
            href={s ? `/seller/orders?status=${s}` : "/seller/orders"}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${status === s ? "bg-ink text-white" : "bg-white ring-1 ring-line hover:ring-ink"}`}
          >
            {s === "paid" ? "New" : s ?? "All"}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <EmptyState title="No orders here" body="New orders appear as soon as a buyer pays." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="px-5 py-3 font-semibold">Order</th>
                <th className="px-3 py-3 font-semibold">Customer</th>
                <th className="px-3 py-3 font-semibold">Items</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((s) => (
                <tr key={s.id} className="hover:bg-paper/50">
                  <td className="px-5 py-3">
                    <Link href={`/seller/orders/${s.id}`} className="font-semibold text-jade-700 hover:underline">#{shortId(s.id)}</Link>
                    <p className="text-xs text-muted">{formatDate(s.createdAt)}</p>
                  </td>
                  <td className="px-3 py-3">{s.order.user.name}</td>
                  <td className="max-w-xs px-3 py-3">
                    <p className="line-clamp-1 text-ink-soft">{s.items.map((i) => `${i.quantity}× ${i.titleSnapshot}`).join(", ")}</p>
                  </td>
                  <td className="px-3 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-5 py-3 text-right font-bold">{formatPrice(s.subtotalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
