import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { getOrdersForUser } from "@/lib/orders";
import { formatDate, formatPrice, shortId } from "@/lib/format";
import { PageTitle, StatCard, StatusBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await requireUser("/account");
  const orders = await getOrdersForUser(user.id);
  const paid = orders.filter((o) => o.status === "paid");
  const inTransit = paid.flatMap((o) => o.subOrders).filter((s) => s.status !== "delivered" && s.status !== "cancelled").length;

  return (
    <div className="space-y-6">
      <PageTitle eyebrow="Account" title={`Hi, ${user.name.split(" ")[0]}`} />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Orders placed" value={paid.length} />
        <StatCard label="Packages on the way" value={inTransit} tone="saffron" />
        <StatCard label="Total spent" value={formatPrice(paid.reduce((s, o) => s + o.totalCents, 0))} tone="jade" />
      </div>

      {user.store && (
        <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="eyebrow">Your store</p>
            <p className="mt-1 font-bold">{user.store.name} <StatusBadge status={user.store.status} /></p>
          </div>
          <Link href={user.store.status === "active" ? "/seller" : "/sell"} className="btn btn-outline btn-sm">
            {user.store.status === "active" ? "Open Seller Center" : "View application"}
          </Link>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-extrabold">Recent orders</h2>
          <Link href="/account/orders" className="text-sm font-semibold text-jade-700 hover:underline">View all</Link>
        </div>
        <ul className="divide-y divide-line">
          {orders.slice(0, 4).map((o) => (
            <li key={o.id}>
              <Link href={`/account/orders/${o.id}`} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-paper/60">
                <div>
                  <p className="text-sm font-semibold">#{shortId(o.id)}</p>
                  <p className="text-xs text-muted">{formatDate(o.createdAt)} · {o.subOrders.length} {o.subOrders.length === 1 ? "store" : "stores"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={o.status} />
                  <span className="text-sm font-bold">{formatPrice(o.totalCents)}</span>
                </div>
              </Link>
            </li>
          ))}
          {orders.length === 0 && <li className="px-5 py-6 text-sm text-muted">No orders yet.</li>}
        </ul>
      </div>
    </div>
  );
}
