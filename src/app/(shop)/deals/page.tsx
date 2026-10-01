import type { Metadata } from "next";
import { getCategoryTree } from "@/lib/catalog";
import { CategorySidebar, Listing } from "@/components/listing";

export const metadata: Metadata = { title: "Today's deals" };

export default async function DealsPage(props: PageProps<"/deals">) {
  const [searchParams, tree] = await Promise.all([props.searchParams, getCategoryTree()]);
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 rounded-3xl bg-saffron-100 px-6 py-8 sm:px-10">
        <p className="eyebrow !text-saffron-700">Marked down by sellers</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Today&apos;s deals</h1>
        <p className="mt-2 max-w-lg text-sm text-ink-soft">
          Every item here is selling below its original price. Discounts are set by each store.
        </p>
      </div>
      <Listing
        basePath="/deals"
        searchParams={searchParams}
        fixed={{ dealsOnly: true }}
        sidebar={<CategorySidebar tree={tree} />}
        emptyTitle="No deals right now"
      />
    </div>
  );
}
