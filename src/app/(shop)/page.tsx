import Link from "next/link";
import {
  getDeals,
  getFeaturedStores,
  getPopularCategories,
  listProducts,
} from "@/lib/catalog";
import { ProductCard, ProductGrid } from "@/components/product-card";
import { ProductImage } from "@/components/product-image";
import { formatPrice } from "@/lib/format";
import { StoreTile } from "@/components/store-tile";

const FEED_STEP = 15;

export default async function HomePage(props: PageProps<"/">) {
  const { more } = await props.searchParams;
  const pages = Math.min(Math.max(Number(more) || 1, 1), 10);

  const [deals, categories, stores, feed] = await Promise.all([
    getDeals(10),
    getPopularCategories(12),
    getFeaturedStores(4),
    listProducts({ sort: "popular", pageSize: FEED_STEP * pages }),
  ]);
  const topDeal = deals[0];

  return (
    <div className="mx-auto max-w-7xl space-y-14 px-4 py-6 sm:py-8">
      {/* Hero */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="bg-weave relative overflow-hidden rounded-3xl p-8 text-white sm:p-12 lg:col-span-2">
          <p className="eyebrow !text-jade-100">A marketplace of independent stores</p>
          <h1 className="mt-4 max-w-xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
            Many stalls.
            <br />
            <span className="text-saffron-400">One checkout.</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-white/80">
            Shop from reviewed sellers across electronics, fashion, home and more. Pay once — each store ships its
            part and you track every package.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/deals" className="btn btn-accent">
              Shop today&apos;s deals
            </Link>
            <Link href="/stores" className="btn border border-white/30 text-white hover:bg-white/10">
              Browse stores
            </Link>
          </div>
          <svg viewBox="0 0 200 200" className="pointer-events-none absolute -bottom-16 -right-10 h-72 w-72 text-white/10" aria-hidden="true">
            <path fill="currentColor" d="M20 80 40 30h120l20 50c0 15-12 26-27 26s-26-11-26-26c0 15-12 26-27 26s-27-11-27-26c0 15-12 26-26 26S20 95 20 80Z" />
          </svg>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {topDeal && (
            <Link href={`/product/${topDeal.slug}`} className="group card flex items-center gap-4 overflow-hidden p-4">
              <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-paper">
                <ProductImage src={topDeal.images[0]?.url} alt={topDeal.title} width={300} priority className="object-cover transition group-hover:scale-105" />
              </div>
              <div className="min-w-0">
                <p className="eyebrow !text-saffron-700">Deal of the day</p>
                <p className="mt-1 line-clamp-2 text-sm font-semibold">{topDeal.title}</p>
                <p className="mt-2 text-lg font-extrabold">
                  {formatPrice(topDeal.priceCents)}{" "}
                  <span className="text-xs font-medium text-muted line-through">{formatPrice(topDeal.compareAtCents!)}</span>
                </p>
              </div>
            </Link>
          )}
          <Link href="/sell" className="group card relative overflow-hidden bg-saffron-50 p-5">
            <p className="eyebrow !text-saffron-700">For sellers</p>
            <p className="mt-1 text-lg font-extrabold">Open your stall on eBazar</p>
            <ol className="mt-3 space-y-1.5 text-sm text-ink-soft">
              {["Apply in two minutes", "We review your store", "List products & get paid"].map((step, i) => (
                <li key={step} className="flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-ink text-[11px] font-bold text-white">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
            <span className="mt-4 inline-block text-sm font-semibold text-jade-700 group-hover:underline">Start selling →</span>
          </Link>
        </div>
      </section>

      {/* Trust strip */}
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          ["Every store reviewed", "Sellers are approved by our team before they can list."],
          ["One payment, many sellers", "Check out once, even when your cart spans stores."],
          ["Track each package", "Every store's shipment has its own live status."],
        ].map(([title, body]) => (
          <div key={title} className="flex gap-3 rounded-2xl border border-line bg-white/60 p-4">
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-jade-50 text-jade-600">
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m5 12 5 5L20 7" /></svg>
            </span>
            <div>
              <p className="text-sm font-bold">{title}</p>
              <p className="text-xs leading-5 text-muted">{body}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Deals */}
      {deals.length > 0 && (
        <section>
          <SectionHeader title="Today's deals" subtitle="Biggest markdowns from across the marketplace" href="/deals" />
          <div className="scrollbar-none -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:gap-4">
            {deals.map((p) => (
              <div key={p.id} className="w-44 shrink-0 snap-start sm:w-52">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section>
          <SectionHeader title="Shop by category" />
          <div className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 md:grid-cols-6">
            {categories.map((c) => (
              <Link key={c.id} href={`/category/${c.slug}`} className="group flex flex-col items-center text-center">
                <div className="relative aspect-square w-full max-w-28 overflow-hidden rounded-full border-4 border-white bg-jade-50 shadow-[var(--shadow-card)] transition group-hover:-translate-y-1 group-hover:shadow-[var(--shadow-lift)]">
                  <ProductImage src={c.imageUrl} alt="" width={240} className="object-cover" />
                </div>
                <p className="mt-2.5 text-sm font-semibold text-ink-soft group-hover:text-jade-700">{c.name}</p>
                <p className="text-xs text-muted">{c.productCount} items</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured stores */}
      {stores.length > 0 && (
        <section>
          <SectionHeader title="Stores to know" subtitle="Independent sellers on eBazar" href="/stores" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stores.map((s) => (
              <StoreTile key={s.id} store={s} />
            ))}
          </div>
        </section>
      )}

      {/* Feed */}
      <section>
        <SectionHeader title="Picked for you" subtitle="Popular right now" />
        <ProductGrid products={feed.items} />
        {feed.items.length < feed.total && (
          <div className="mt-8 flex justify-center">
            <Link href={`/?more=${pages + 1}`} scroll={false} className="btn btn-outline px-8">
              Show more
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

function SectionHeader({ title, subtitle, href }: { title: string; subtitle?: string; href?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="shrink-0 text-sm font-semibold text-jade-700 hover:underline">
          See all →
        </Link>
      )}
    </div>
  );
}
