import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getMoreFromStore,
  getProductBySlug,
  getRelatedProducts,
  getStoreStats,
} from "@/lib/catalog";
import { getCurrentUser } from "@/lib/dal";
import { hasDeliveredPurchase } from "@/lib/orders";
import { getReviewsForProduct, getUserReview } from "@/lib/reviews";
import { formatDate } from "@/lib/format";
import { Gallery } from "@/components/gallery";
import { AddToCart } from "@/components/add-to-cart";
import { Price } from "@/components/price";
import { RatingSummary, Stars } from "@/components/rating";
import { ProductCard } from "@/components/product-card";
import { ProductImage } from "@/components/product-image";
import { ReviewForm } from "@/components/review-form";

export async function generateMetadata(props: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return { title: product.title, description: product.description.slice(0, 160) };
}

export default async function ProductPage(props: PageProps<"/product/[slug]">) {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [user, storeStats, reviews, related, moreFromStore] = await Promise.all([
    getCurrentUser(),
    getStoreStats(product.storeId),
    getReviewsForProduct(product.id),
    getRelatedProducts(product.id, product.categoryId),
    getMoreFromStore(product.storeId, product.id, 4),
  ]);
  const [canReview, myReview] = user
    ? await Promise.all([hasDeliveredPurchase(user.id, product.id), getUserReview(product.id, user.id)])
    : [false, undefined];

  const { store, category } = product;
  const isOwnProduct = user?.id === store.ownerId;
  const images = product.images.map((i) => i.url);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-muted">
        <Link href="/" className="hover:text-ink">Home</Link>
        {category.parent && (
          <>
            <span>/</span>
            <Link href={`/category/${category.parent.slug}`} className="hover:text-ink">{category.parent.name}</Link>
          </>
        )}
        <span>/</span>
        <Link href={`/category/${category.slug}`} className="hover:text-ink">{category.name}</Link>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr_300px]">
        <Gallery images={images} alt={product.title} />

        <div className="space-y-5">
          <div>
            <Link href={`/store/${store.slug}`} className="text-xs font-bold uppercase tracking-wide text-jade-700 hover:underline">
              {store.name}
            </Link>
            <h1 className="mt-1.5 text-2xl font-extrabold leading-tight tracking-tight">{product.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <a href="#reviews"><RatingSummary rating={product.ratingAvg} count={product.reviewCount} /></a>
              {product.soldCount > 0 && <span className="text-xs text-muted">· {product.soldCount.toLocaleString()} sold</span>}
            </div>
          </div>

          <div className="rounded-2xl bg-paper p-4">
            <Price priceCents={product.priceCents} compareAtCents={product.compareAtCents} size="lg" />
            <p className="mt-1 text-xs text-muted">Price set by {store.name}. Taxes included.</p>
          </div>

          {product.highlights.length > 0 && (
            <ul className="space-y-1.5 text-sm text-ink-soft">
              {product.highlights.map((h) => (
                <li key={h} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-jade-500" />
                  {h}
                </li>
              ))}
            </ul>
          )}

          <AddToCart
            item={{
              productId: product.id,
              slug: product.slug,
              title: product.title,
              imageUrl: images[0] ?? "",
              priceCents: product.priceCents,
              storeName: store.name,
              storeSlug: store.slug,
              stock: product.stock,
            }}
            disabledReason={isOwnProduct ? "This is your own listing — you can't buy from your own store." : undefined}
          />
        </div>

        <aside className="space-y-4">
          <div className="card p-4">
            <p className="eyebrow">Sold by</p>
            <Link href={`/store/${store.slug}`} className="mt-2 flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-jade-50">
                {store.logoUrl ? (
                  <ProductImage src={store.logoUrl} alt="" width={120} />
                ) : (
                  <span className="grid h-full place-items-center font-extrabold text-jade-700">{store.name.charAt(0)}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-bold hover:text-jade-700">{store.name}</p>
                <p className="flex items-center gap-1 text-xs text-jade-700">
                  <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor"><path d="M10 1 3 4v5c0 4.4 3 8.3 7 9.5 4-1.2 7-5.1 7-9.5V4l-7-3Zm-1.2 12.2L5.6 10l1.2-1.2 2 2 4.4-4.4 1.2 1.2-5.6 5.6Z" /></svg>
                  Verified store
                </p>
              </div>
            </Link>
            <dl className="mt-4 grid grid-cols-3 divide-x divide-line rounded-xl bg-paper py-2.5 text-center">
              <div>
                <dt className="text-[11px] text-muted">Rating</dt>
                <dd className="text-sm font-bold">{Number(storeStats.ratingAvg) ? Number(storeStats.ratingAvg).toFixed(1) : "—"}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-muted">Products</dt>
                <dd className="text-sm font-bold">{storeStats.productCount}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-muted">Sold</dt>
                <dd className="text-sm font-bold">{storeStats.soldCount}</dd>
              </div>
            </dl>
            <Link href={`/store/${store.slug}`} className="btn btn-outline btn-sm mt-4 w-full">Visit store</Link>
          </div>

          <div className="card divide-y divide-line text-sm">
            {[
              ["Delivery", "Ships from the seller in 1–2 business days. Standard delivery 3–5 days."],
              ["Returns", "7-day change-of-mind returns on unused items."],
              ["Payment", "Secure card checkout. Pay once for items from several stores."],
            ].map(([title, body]) => (
              <div key={title} className="p-4">
                <p className="font-semibold">{title}</p>
                <p className="mt-0.5 text-xs leading-5 text-muted">{body}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="text-lg font-extrabold">About this product</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-ink-soft">{product.description}</p>
          </section>

          <section id="reviews" className="card scroll-mt-32 p-6">
            <h2 className="text-lg font-extrabold">Ratings & reviews</h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-[180px_1fr]">
              <div>
                <p className="text-5xl font-extrabold tracking-tight">
                  {product.reviewCount ? Number(product.ratingAvg).toFixed(1) : "—"}
                  <span className="text-lg text-muted">/5</span>
                </p>
                <Stars value={Number(product.ratingAvg)} size="h-5 w-5" />
                <p className="mt-1 text-xs text-muted">{product.reviewCount} reviews from verified buyers</p>
              </div>
              <ul className="space-y-1.5">
                {reviews.counts.map(({ star, n }) => (
                  <li key={star} className="flex items-center gap-3 text-xs">
                    <span className="w-8 font-semibold">{star} ★</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-paper">
                      <span className="block h-full rounded-full bg-saffron-400" style={{ width: `${product.reviewCount ? (n / product.reviewCount) * 100 : 0}%` }} />
                    </span>
                    <span className="w-6 text-right text-muted">{n}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              {canReview ? (
                <ReviewForm productId={product.id} existing={myReview ? { rating: myReview.rating, body: myReview.body } : undefined} />
              ) : (
                <p className="rounded-xl bg-paper px-4 py-3 text-xs text-muted">
                  Only buyers whose order was delivered can review — so every review here comes from a real purchase.
                </p>
              )}
            </div>

            <ul className="mt-6 divide-y divide-line">
              {reviews.list.map((r) => (
                <li key={r.id} className="py-4">
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-jade-50 text-xs font-bold text-jade-700">{r.user.name.charAt(0)}</span>
                    <span className="text-sm font-semibold">{r.user.name.split(" ")[0]} {r.user.name.split(" ")[1]?.charAt(0)}.</span>
                    <span className="rounded-full bg-jade-50 px-2 py-0.5 text-[10px] font-semibold text-jade-700">Verified purchase</span>
                    <span className="ml-auto text-xs text-muted">{formatDate(r.createdAt)}</span>
                  </div>
                  <div className="mt-2"><Stars value={r.rating} /></div>
                  <p className="mt-1.5 text-sm leading-6 text-ink-soft">{r.body}</p>
                </li>
              ))}
              {reviews.list.length === 0 && <li className="py-4 text-sm text-muted">No reviews yet.</li>}
            </ul>
          </section>
        </div>

        {moreFromStore.length > 0 && (
          <aside>
            <h2 className="mb-3 text-sm font-extrabold">More from {store.name}</h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              {moreFromStore.map((p) => (
                <Link key={p.id} href={`/product/${p.slug}`} className="card flex gap-3 p-2.5 transition hover:shadow-[var(--shadow-lift)]">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-paper">
                    <ProductImage src={p.images[0]?.url} alt="" width={160} />
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-xs leading-4">{p.title}</p>
                    <div className="mt-1"><Price priceCents={p.priceCents} compareAtCents={p.compareAtCents} /></div>
                  </div>
                </Link>
              ))}
            </div>
          </aside>
        )}
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-extrabold tracking-tight">You may also like</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
