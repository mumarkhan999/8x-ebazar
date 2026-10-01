import type { Metadata } from "next";
import Link from "next/link";
import { requireSeller } from "@/lib/dal";
import { listStoreProducts } from "@/lib/seller";
import { deleteProduct, setProductPublished } from "@/lib/actions/products";
import { formatPrice } from "@/lib/format";
import { productStatus, type ProductStatus } from "@/db/schema";
import { EmptyState, PageTitle, StatusBadge } from "@/components/ui";
import { ProductImage } from "@/components/product-image";

export const metadata: Metadata = { title: "Products · Seller Center" };

export default async function SellerProductsPage(props: PageProps<"/seller/products">) {
  const { store } = await requireSeller();
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const status = productStatus.enumValues.includes(sp.status as ProductStatus) ? (sp.status as ProductStatus) : undefined;
  const items = await listStoreProducts(store.id, { q, status });

  return (
    <div>
      <PageTitle eyebrow="Seller Center" title="Products">
        <Link href="/seller/products/new" className="btn btn-primary">+ New product</Link>
      </PageTitle>

      {sp.created && (
        <p className="mb-4 rounded-xl bg-jade-50 px-4 py-2.5 text-sm font-medium text-jade-700">Product created.</p>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[undefined, "active", "draft", "blocked"].map((s) => (
          <Link
            key={s ?? "all"}
            href={s ? `/seller/products?status=${s}` : "/seller/products"}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${status === s ? "bg-ink text-white" : "bg-white ring-1 ring-line hover:ring-ink"}`}
          >
            {s ?? "All"}
          </Link>
        ))}
        <form className="ml-auto w-full sm:w-64">
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q} placeholder="Search your products" className="input !rounded-full !py-2" />
        </form>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title={q || status ? "No matching products" : "No products yet"}
          body="List your first product — upload photos or paste image links."
          action={{ href: "/seller/products/new", label: "Add a product" }}
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="px-5 py-3 font-semibold">Product</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 text-right font-semibold">Price</th>
                <th className="px-3 py-3 text-right font-semibold">Stock</th>
                <th className="px-3 py-3 text-right font-semibold">Sold</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((p) => (
                <tr key={p.id} className="hover:bg-paper/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-paper">
                        <ProductImage src={p.images[0]?.url} alt="" width={100} />
                      </div>
                      <div className="min-w-0">
                        <Link href={`/seller/products/${p.id}/edit`} className="line-clamp-1 font-medium hover:text-jade-700">{p.title}</Link>
                        <p className="text-xs text-muted">{p.category.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-3 py-3 text-right font-semibold">{formatPrice(p.priceCents)}</td>
                  <td className={`px-3 py-3 text-right font-semibold ${p.stock === 0 ? "text-rose-600" : p.stock <= 5 ? "text-saffron-700" : ""}`}>{p.stock}</td>
                  <td className="px-3 py-3 text-right text-muted">{p.soldCount}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {p.status === "active" && (
                        <Link href={`/product/${p.slug}`} className="btn btn-ghost btn-sm">View</Link>
                      )}
                      {p.status !== "blocked" && (
                        <form action={setProductPublished.bind(null, p.id, p.status === "draft")}>
                          <button className="btn btn-outline btn-sm">{p.status === "draft" ? "Publish" : "Unpublish"}</button>
                        </form>
                      )}
                      <Link href={`/seller/products/${p.id}/edit`} className="btn btn-outline btn-sm">Edit</Link>
                      <form action={deleteProduct.bind(null, p.id)}>
                        <button className="btn btn-danger btn-sm" title="Products with orders are unpublished instead of deleted">Delete</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
