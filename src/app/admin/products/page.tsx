import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { listProductsForAdmin } from "@/lib/admin";
import { setProductBlocked } from "@/lib/actions/admin";
import { formatPrice } from "@/lib/format";
import { productStatus, type ProductStatus } from "@/db/schema";
import { EmptyState, PageTitle, StatusBadge } from "@/components/ui";
import { ProductImage } from "@/components/product-image";

export const metadata: Metadata = { title: "Products · Admin" };

export default async function AdminProductsPage(props: PageProps<"/admin/products">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const status = productStatus.enumValues.includes(sp.status as ProductStatus) ? (sp.status as ProductStatus) : undefined;
  const items = await listProductsForAdmin({ q, status });

  return (
    <div>
      <PageTitle eyebrow="Admin console" title="Products" />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[undefined, ...productStatus.enumValues].map((s) => (
          <Link
            key={s ?? "all"}
            href={s ? `/admin/products?status=${s}` : "/admin/products"}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${status === s ? "bg-ink text-white" : "bg-white ring-1 ring-line hover:ring-ink"}`}
          >
            {s ?? "All"}
          </Link>
        ))}
        <form className="ml-auto w-full sm:w-72">
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q} placeholder="Search all products" className="input !rounded-full !py-2" />
        </form>
      </div>

      {items.length === 0 ? (
        <EmptyState title="No products found" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="px-5 py-3 font-semibold">Product</th>
                <th className="px-3 py-3 font-semibold">Store</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 text-right font-semibold">Price</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((p) => (
                <tr key={p.id} className="hover:bg-paper/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-paper">
                        <ProductImage src={p.images[0]?.url} alt="" width={100} />
                      </div>
                      <p className="line-clamp-2 max-w-sm">{p.title}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <p>{p.store.name}</p>
                    {p.store.status !== "active" && <p className="text-xs text-rose-600">Store {p.store.status}</p>}
                  </td>
                  <td className="px-3 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-3 py-3 text-right font-semibold">{formatPrice(p.priceCents)}</td>
                  <td className="px-5 py-3 text-right">
                    <form action={setProductBlocked.bind(null, p.id, p.status !== "blocked")}>
                      <button className={p.status === "blocked" ? "btn btn-outline btn-sm" : "btn btn-danger btn-sm"}>
                        {p.status === "blocked" ? "Unblock" : "Block"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-muted">Blocking hides a listing from the storefront. Unblocking returns it to the seller as a draft to re-publish.</p>
    </div>
  );
}
