import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { getAdminStats, listStoresForAdmin } from "@/lib/admin";
import { formatDate, formatPrice } from "@/lib/format";
import { PageTitle, StatCard } from "@/components/ui";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminOverview() {
  await requireAdmin();
  const [stats, pending] = await Promise.all([getAdminStats(), listStoresForAdmin("pending")]);

  return (
    <div className="space-y-8">
      <PageTitle eyebrow="Admin console" title="Marketplace overview" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Gross sales (paid orders)" value={formatPrice(stats.gmvCents)} hint={`${stats.paidOrders} orders`} tone="jade" />
        <StatCard label="Applications waiting" value={stats.pendingStores} hint="Stores pending review" tone="saffron" />
        <StatCard label="Live stores" value={stats.activeStores} hint={`${stats.suspendedStores} suspended`} />
        <StatCard label="Products" value={stats.products} hint={`${stats.blockedProducts} blocked · ${stats.users} users`} />
      </div>

      <section className="card">
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-extrabold">Store applications</h2>
          <Link href="/admin/stores" className="text-sm font-semibold text-jade-700 hover:underline">Manage stores</Link>
        </header>
        {pending.length ? (
          <ul className="divide-y divide-line">
            {pending.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                <div>
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-xs text-muted">{s.owner.name} · {s.owner.email} · applied {formatDate(s.createdAt)}</p>
                </div>
                <Link href="/admin/stores?status=pending" className="btn btn-primary btn-sm">Review</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-muted">No applications waiting.</p>
        )}
      </section>
    </div>
  );
}
