import Link from "next/link";
import type { ProductCardData } from "@/lib/catalog";
import { discountPercent } from "@/lib/format";
import { ProductImage } from "@/components/product-image";
import { Price } from "@/components/price";
import { RatingSummary } from "@/components/rating";

export function ProductCard({ product, priority }: { product: ProductCardData; priority?: boolean }) {
  const off = discountPercent(product.priceCents, product.compareAtCents);
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group card flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
    >
      <div className="relative aspect-square overflow-hidden bg-paper">
        <ProductImage
          src={product.images[0]?.url}
          alt={product.title}
          width={500}
          priority={priority}
          sizes="(min-width: 1024px) 220px, (min-width: 640px) 33vw, 50vw"
          className="object-cover transition duration-300 group-hover:scale-[1.04]"
        />
        {off >= 10 && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-saffron-400 px-2 py-0.5 text-[11px] font-bold text-ink">
            {off}% off
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute inset-x-0 bottom-0 bg-ink/75 py-1 text-center text-[11px] font-semibold text-white">
            Sold out
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-jade-700">
          {product.store.name}
        </p>
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm leading-5 text-ink-soft group-hover:text-ink">
          {product.title}
        </h3>
        <div className="mt-auto space-y-1 pt-1">
          <Price priceCents={product.priceCents} compareAtCents={product.compareAtCents} showPercent={false} />
          <div className="flex items-center justify-between gap-2">
            <RatingSummary rating={product.ratingAvg} count={product.reviewCount} />
            {product.soldCount > 0 && (
              <span className="text-[11px] text-muted">{product.soldCount.toLocaleString()} sold</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: ProductCardData[]; priorityCount?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}
