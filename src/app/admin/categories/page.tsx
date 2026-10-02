import type { Metadata } from "next";
import { requireAdmin } from "@/lib/dal";
import { listCategoriesForAdmin } from "@/lib/admin";
import { deleteCategory } from "@/lib/actions/admin";
import { PageTitle } from "@/components/ui";
import { CategoryForm } from "./category-form";
import { SubmitButton } from "@/components/submit-button";

export const metadata: Metadata = { title: "Categories · Admin" };

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const tree = await listCategoriesForAdmin();

  return (
    <div>
      <PageTitle eyebrow="Admin console" title="Categories" />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {tree.map((dept) => {
            const total = dept.productCount + dept.children.reduce((s, c) => s + c.productCount, 0);
            return (
              <section key={dept.id} className="card">
                <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
                  <div>
                    <p className="font-bold">{dept.name}</p>
                    <p className="text-xs text-muted">/{dept.slug} · {total} products</p>
                  </div>
                  {total === 0 && dept.children.length === 0 && (
                    <form action={deleteCategory.bind(null, dept.id)}>
                      <SubmitButton className="btn btn-danger btn-sm">Delete</SubmitButton>
                    </form>
                  )}
                </header>
                <ul className="divide-y divide-line">
                  {dept.children.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
                      <span>
                        {c.name} <span className="text-xs text-muted">/{c.slug}</span>
                      </span>
                      <span className="flex items-center gap-3">
                        <span className="text-xs text-muted">{c.productCount} products</span>
                        {c.productCount === 0 && (
                          <form action={deleteCategory.bind(null, c.id)}>
                            <SubmitButton className="text-xs font-semibold text-rose-600 hover:underline">Delete</SubmitButton>
                          </form>
                        )}
                      </span>
                    </li>
                  ))}
                  {dept.children.length === 0 && <li className="px-5 py-2.5 text-xs text-muted">No sub-categories yet.</li>}
                </ul>
              </section>
            );
          })}
        </div>
        <div>
          <CategoryForm departments={tree.map((d) => ({ id: d.id, name: d.name }))} />
          <p className="mt-3 text-xs text-muted">
            Categories are two levels deep. Sellers list products in sub-categories; only empty categories can be deleted.
          </p>
        </div>
      </div>
    </div>
  );
}
