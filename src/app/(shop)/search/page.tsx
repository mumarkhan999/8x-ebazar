import type { Metadata } from "next";
import { getCategoryTree } from "@/lib/catalog";
import { CategorySidebar, Listing } from "@/components/listing";
import { PageTitle } from "@/components/ui";

export async function generateMetadata(props: PageProps<"/search">): Promise<Metadata> {
  const { q } = await props.searchParams;
  return { title: typeof q === "string" && q ? `“${q}”` : "All products" };
}

export default async function SearchPage(props: PageProps<"/search">) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const tree = await getCategoryTree();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageTitle eyebrow={q ? "Search results" : "Browse"} title={q ? `Results for “${q}”` : "All products"} />
      <Listing
        basePath="/search"
        searchParams={searchParams}
        sidebar={<CategorySidebar tree={tree} />}
        emptyTitle={q ? `No results for “${q}”` : "No products yet"}
      />
    </div>
  );
}
