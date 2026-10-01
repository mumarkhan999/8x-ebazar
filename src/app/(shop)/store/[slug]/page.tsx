import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveStoreBySlug, getStoreStats } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { Listing } from "@/components/listing";
import { ProductImage } from "@/components/product-image";

export async function generateMetadata(props: PageProps<"/store/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const store = await getActiveStoreBySlug(slug);
  return { title: store?.name ?? "Store", description: store?.tagline };
}

export default async function StorePage(props: PageProps<"/store/[slug]">) {
  const [{ slug }, searchParams] = await Promise.all([props.params, props.searchParams]);
  // Only active stores have a public page; pending/suspended ones 404.
  const store = await getActiveStoreBySlug(slug);
  if (!store) notFound();
  const stats = await getStoreStats(store.id);
  const tab = searchParams.tab === "about" ? "about" : "products";
  const q = typeof searchParams.q === "string" ? searchParams.q : "";

  return (
    <div>
      <div className="relative h-40 bg-weave sm:h-56">
        {store.bannerUrl && <ProductImage src={store.bannerUrl} alt="" width={1600} priority sizes="100vw" />}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/50 to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-4">
        <div className="card relative -mt-14 flex flex-col gap-5 p-5 sm:flex-row sm:items-end sm:p-6">
          <div className="relative -mt-14 h-24 w-24 shrink-0 overflow-hidden rounded-3xl border-4 border-white bg-jade-50 shadow-[var(--shadow-card)] sm:-mt-16">
            {store.logoUrl ? (
              <ProductImage src={store.logoUrl} alt={`${store.name} logo`} width={200} />
            ) : (
              <span className="grid h-full place-items-center text-3xl font-extrabold text-jade-700">{store.name.charAt(0)}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-extrabold tracking-tight">{store.name}</h1>
            <p className="mt-1 text-sm text-muted">{store.tagline}</p>
          </div>
          <dl className="grid grid-cols-3 gap-6 text-center sm:text-right">
            <Stat label="Rating" value={Number(stats.ratingAvg) ? `${Number(stats.ratingAvg).toFixed(1)} ★` : "—"} />
            <Stat label="Products" value={stats.productCount} />
            <Stat label="Sold" value={stats.soldCount.toLocaleString()} />
          </dl>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-line">
          <nav className="flex gap-1">
            {[
              ["products", "Products"],
              ["about", "About"],
            ].map(([key, label]) => (
              <Link
                key={key}
                href={key === "products" ? `/store/${slug}` : `/store/${slug}?tab=about`}
                className={`-mb-px border-b-2 px-4 py-3 text-sm font-semibold ${
                  tab === key ? "border-jade-600 text-jade-700" : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
          {tab === "products" && (
            <form action={`/store/${slug}`} className="mb-2 w-full sm:w-72">
              <input name="q" defaultValue={q} placeholder={`Search in ${store.name}`} className="input !rounded-full !py-2" />
            </form>
          )}
        </div>

        <div className="py-6">
          {tab === "about" ? (
            <div className="card max-w-3xl p-6">
              <h2 className="text-lg font-extrabold">About {store.name}</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-ink-soft">{store.description || store.tagline}</p>
              <p className="mt-6 text-xs text-muted">Selling on eBazar since {formatDate(store.reviewedAt ?? store.createdAt)}</p>
            </div>
          ) : (
            <Listing basePath={`/store/${slug}`} searchParams={searchParams} fixed={{ storeId: store.id }} emptyTitle="No products found in this store" />
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-lg font-extrabold">{value}</dd>
    </div>
  );
}
