import Link from "next/link";
import { ProductImage } from "@/components/product-image";

export function StoreTile({
  store,
}: {
  store: { name: string; slug: string; tagline: string; logoUrl: string | null; bannerUrl: string | null; productCount: number };
}) {
  return (
    <Link href={`/store/${store.slug}`} className="group card overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
      <div className="relative h-24 bg-weave">
        {store.bannerUrl && <ProductImage src={store.bannerUrl} alt="" width={600} className="object-cover opacity-90" />}
      </div>
      <div className="relative px-4 pb-4">
        <div className="relative -mt-7 h-14 w-14 overflow-hidden rounded-2xl border-4 border-white bg-jade-50">
          {store.logoUrl ? (
            <ProductImage src={store.logoUrl} alt="" width={120} />
          ) : (
            <span className="grid h-full w-full place-items-center text-lg font-extrabold text-jade-700">{store.name.charAt(0)}</span>
          )}
        </div>
        <p className="mt-2 font-bold group-hover:text-jade-700">{store.name}</p>
        <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-muted">{store.tagline}</p>
        <p className="mt-2 text-xs font-semibold text-ink-soft">{store.productCount} products</p>
      </div>
    </Link>
  );
}
