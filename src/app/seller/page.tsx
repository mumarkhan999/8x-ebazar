import type { Metadata } from "next";
import Link from "next/link";
import { requireSeller } from "@/lib/dal";
import { getSellerStats, getSubOrdersForStore } from "@/lib/orders";
import { listStoreProducts } from "@/lib/seller";
import { formatDate, formatPrice, shortId } from "@/lib/format";
import { PageTitle, StatCard, StatusBadge } from "@/components/ui";
import { ProductImage } from "@/components/product-image";

export const metadata: Metadata = { title: "Seller Center" };

export default async function SellerDashboard() {
  const { user, store } = await requireSeller();
  const [stats, toFulfil, allProducts] = await Promise.all([
    getSellerStats(store.id),
    getSubOrdersForStore(store.id),
    listStoreProducts(store.id),
  ]);
  const queue = toFulfil.filter((s) => s.status === "paid" || s.status === "packed").slice(0, 6);
  const lowStock = allProducts.filter((p) => p.status === "active" && p.stock <= 5).slice(0, 6);

  return (
    <div className="space-y-8">
      <PageTitle eyebrow={store.name} title={`Welcome back, ${user.name.split(" ")[0]}`}>
        <Link href="/seller/products/new" className="btn btn-primary">+ New product</Link>
      </PageTitle>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue (paid orders)" value={formatPrice(stats.revenueCents)} tone="jade" />
        <StatCard label="Orders to fulfil" value={stats.toFulfil} hint="Paid or packed" tone="saffron" />
        <StatCard label="In transit" value={stats.inTransit} hint={`${stats.delivered} delivered`} />
        <StatCard
          label="Live products"
          value={stats.activeProducts}
          hint={`${stats.draftProducts} drafts${stats.blockedProducts ? ` · ${stats.blockedProducts} blocked` : ""}`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="card">
          <header className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-extrabold">Ready to fulfil</h2>
            <Link href="/seller/orders" className="text-sm font-semibold text-jade-700 hover:underline">All orders</Link>
          </header>
          {queue.length ? (
            <ul className="divide-y divide-line">
              {queue.map((s) => (
                <li key={s.id}>
                  <Link href={`/seller/orders/${s.id}`} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-paper/60">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">#{shortId(s.id)} · {s.order.user.name}</p>
                      <p className="line-clamp-1 text-xs text-muted">
                        {formatDate(s.createdAt)} · {s.items.map((i) => `${i.quantity}× ${i.titleSnapshot}`).join(", ")}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <StatusBadge status={s.status} />
                      <span className="text-sm font-bold">{formatPrice(s.subtotalCents)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-muted">You&apos;re all caught up 🎉</p>
          )}
        </section>

        <section className="card">
          <header className="border-b border-line px-5 py-4">
            <h2 className="font-extrabold">Low stock</h2>
            <p className="text-xs text-muted">Live products with 5 or fewer left</p>
          </header>
          {lowStock.length ? (
            <ul className="divide-y divide-line">
              {lowStock.map((p) => (
                <li key={p.id}>
                  <Link href={`/seller/products/${p.id}/edit`} className="flex items-center gap-3 px-5 py-3 hover:bg-paper/60">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-paper">
                      <ProductImage src={p.images[0]?.url} alt="" width={100} />
                    </div>
                    <p className="line-clamp-1 flex-1 text-sm">{p.title}</p>
                    <span className={`text-sm font-bold ${p.stock === 0 ? "text-rose-600" : "text-saffron-700"}`}>{p.stock}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-muted">Stock levels look healthy.</p>
          )}
        </section>
      </div>
    </div>
  );
}
