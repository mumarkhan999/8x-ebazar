import type { Metadata } from "next";
import Link from "next/link";
import { getCategoryTree, searchStoresAndCategories } from "@/lib/catalog";
import { CategorySidebar, Listing } from "@/components/listing";
import { ProductImage } from "@/components/product-image";
import { PageTitle } from "@/components/ui";

export async function generateMetadata(props: PageProps<"/search">): Promise<Metadata> {
  const { q } = await props.searchParams;
  return { title: typeof q === "string" && q ? `“${q}”` : "All products" };
}

export default async function SearchPage(props: PageProps<"/search">) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const [tree, matches] = await Promise.all([
    getCategoryTree(),
    q ? searchStoresAndCategories(q) : Promise.resolve({ stores: [], categories: [] }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageTitle eyebrow={q ? "Search results" : "Browse"} title={q ? `Results for “${q}”` : "All products"} />

      {(matches.stores.length > 0 || matches.categories.length > 0) && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {matches.stores.map((s) => (
            <Link
              key={s.slug}
              href={`/store/${s.slug}`}
              className="flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3.5 text-sm font-semibold ring-1 ring-line transition hover:ring-jade-500"
            >
              <span className="relative h-7 w-7 overflow-hidden rounded-full bg-jade-50">
                {s.logoUrl ? (
                  <ProductImage src={s.logoUrl} alt="" width={80} />
                ) : (
                  <span className="grid h-full place-items-center text-xs font-bold text-jade-700">{s.name.charAt(0)}</span>
                )}
              </span>
              <span>
                <span className="text-muted">Store · </span>
                {s.name}
              </span>
            </Link>
          ))}
          {matches.categories.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="rounded-full bg-jade-50 px-3.5 py-1.5 text-sm font-semibold text-jade-800 ring-1 ring-jade-200 transition hover:bg-jade-100"
            >
              <span className="font-medium text-jade-700">{c.parentName ? `${c.parentName} › ` : "Department · "}</span>
              {c.name}
            </Link>
          ))}
        </div>
      )}

      <Listing
        basePath="/search"
        searchParams={searchParams}
        sidebar={<CategorySidebar tree={tree} />}
        emptyTitle={q ? `No results for “${q}”` : "No products yet"}
      />
    </div>
  );
}
