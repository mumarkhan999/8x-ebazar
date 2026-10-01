import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryBySlug, getCategoryTree } from "@/lib/catalog";
import { CategorySidebar, Listing } from "@/components/listing";
import { PageTitle } from "@/components/ui";

export async function generateMetadata(props: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const found = await getCategoryBySlug(slug);
  return { title: found?.category.name ?? "Category" };
}

export default async function CategoryPage(props: PageProps<"/category/[slug]">) {
  const [{ slug }, searchParams] = await Promise.all([props.params, props.searchParams]);
  const [found, tree] = await Promise.all([getCategoryBySlug(slug), getCategoryTree()]);
  if (!found) notFound();
  const { category, parent, ids } = found;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted">
        <Link href="/" className="hover:text-ink">Home</Link>
        {parent && (
          <>
            <span className="mx-1.5">/</span>
            <Link href={`/category/${parent.slug}`} className="hover:text-ink">{parent.name}</Link>
          </>
        )}
        <span className="mx-1.5">/</span>
        <span className="text-ink-soft">{category.name}</span>
      </nav>
      <PageTitle eyebrow={parent ? parent.name : "Department"} title={category.name} />
      <Listing
        basePath={`/category/${slug}`}
        searchParams={searchParams}
        fixed={{ categoryIds: ids }}
        sidebar={<CategorySidebar tree={tree} activeSlug={slug} />}
        emptyTitle={`No ${category.name.toLowerCase()} listed yet`}
      />
    </div>
  );
}
