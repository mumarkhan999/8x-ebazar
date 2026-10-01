import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSeller } from "@/lib/dal";
import { getLeafCategoriesForSelect } from "@/lib/catalog";
import { getStoreProduct } from "@/lib/seller";
import { updateProduct } from "@/lib/actions/products";
import { ProductForm } from "@/components/product-form";
import { PageTitle, StatusBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Edit product · Seller Center" };

export default async function EditProductPage(props: PageProps<"/seller/products/[id]/edit">) {
  const { id } = await props.params;
  const { store } = await requireSeller();
  // Scoped by store: another seller's product id 404s.
  const [product, categories] = await Promise.all([getStoreProduct(id, store.id), getLeafCategoriesForSelect()]);
  if (!product) notFound();

  return (
    <div>
      <Link href="/seller/products" className="text-xs font-semibold text-muted hover:text-ink">← Products</Link>
      <PageTitle title="Edit product">
        <StatusBadge status={product.status} />
        {product.status === "active" && (
          <Link href={`/product/${product.slug}`} className="btn btn-outline btn-sm">View in store ↗</Link>
        )}
      </PageTitle>
      <ProductForm
        action={updateProduct.bind(null, product.id)}
        categories={categories}
        submitLabel="Save changes"
        defaults={{
          title: product.title,
          description: product.description,
          highlights: product.highlights,
          categoryId: product.categoryId,
          priceCents: product.priceCents,
          compareAtCents: product.compareAtCents,
          stock: product.stock,
          status: product.status,
          images: product.images.map((i) => i.url),
        }}
      />
    </div>
  );
}
