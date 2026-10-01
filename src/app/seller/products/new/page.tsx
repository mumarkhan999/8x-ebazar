import type { Metadata } from "next";
import Link from "next/link";
import { requireSeller } from "@/lib/dal";
import { getLeafCategoriesForSelect } from "@/lib/catalog";
import { createProduct } from "@/lib/actions/products";
import { ProductForm } from "@/components/product-form";
import { PageTitle } from "@/components/ui";

export const metadata: Metadata = { title: "New product · Seller Center" };

export default async function NewProductPage() {
  await requireSeller();
  const categories = await getLeafCategoriesForSelect();
  return (
    <div>
      <Link href="/seller/products" className="text-xs font-semibold text-muted hover:text-ink">← Products</Link>
      <PageTitle title="New product" />
      <ProductForm action={createProduct} categories={categories} submitLabel="Create product" />
    </div>
  );
}
