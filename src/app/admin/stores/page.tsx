import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { listStoresForAdmin } from "@/lib/admin";
import { reviewStore } from "@/lib/actions/admin";
import { formatDate } from "@/lib/format";
import { storeStatus, type StoreStatus } from "@/db/schema";
import { EmptyState, PageTitle, StatusBadge } from "@/components/ui";
import { ProductImage } from "@/components/product-image";
import { SubmitButton } from "@/components/submit-button";

export const metadata: Metadata = { title: "Stores · Admin" };

export default async function AdminStoresPage(props: PageProps<"/admin/stores">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const status = storeStatus.enumValues.includes(sp.status as StoreStatus) ? (sp.status as StoreStatus) : undefined;
  const stores = await listStoresForAdmin(status);

  return (
    <div>
      <PageTitle eyebrow="Admin console" title="Stores" />
      <div className="scrollbar-none mb-5 flex gap-2 overflow-x-auto">
        {[undefined, ...storeStatus.enumValues].map((s) => (
          <Link
            key={s ?? "all"}
            href={s ? `/admin/stores?status=${s}` : "/admin/stores"}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${status === s ? "bg-ink text-white" : "bg-white ring-1 ring-line hover:ring-ink"}`}
          >
            {s ?? "All"}
          </Link>
        ))}
      </div>

      {stores.length === 0 ? (
        <EmptyState title="No stores here" />
      ) : (
        <ul className="space-y-4">
          {stores.map((s) => (
            <li key={s.id} className="card p-5">
              <div className="flex flex-wrap items-start gap-4">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-jade-50">
                  {s.logoUrl ? (
                    <ProductImage src={s.logoUrl} alt="" width={120} />
                  ) : (
                    <span className="grid h-full place-items-center text-lg font-extrabold text-jade-700">{s.name.charAt(0)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{s.name}</p>
                    <StatusBadge status={s.status} />
                  </div>
                  <p className="text-xs text-muted">
                    {s.owner.name} · {s.owner.email} · applied {formatDate(s.createdAt)}
                    {s.reviewedAt && ` · reviewed ${formatDate(s.reviewedAt)}`}
                  </p>
                  {s.tagline && <p className="mt-2 text-sm font-medium text-ink-soft">{s.tagline}</p>}
                  {s.description && <p className="mt-1 line-clamp-3 text-sm text-muted">{s.description}</p>}
                  {s.statusNote && (
                    <p className="mt-2 rounded-lg bg-paper px-3 py-2 text-xs text-ink-soft"><strong>Note to seller:</strong> {s.statusNote}</p>
                  )}
                </div>
                {s.status === "active" && (
                  <Link href={`/store/${s.slug}`} className="btn btn-ghost btn-sm">View store ↗</Link>
                )}
              </div>

              {s.status === "pending" && (
                <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-line pt-4">
                  <form action={reviewStore.bind(null, s.id, "approve")}>
                    <SubmitButton className="btn btn-primary">Approve store</SubmitButton>
                  </form>
                  <form action={reviewStore.bind(null, s.id, "reject")} className="flex flex-1 flex-wrap gap-2">
                    <input name="note" required placeholder="Reason for rejection (shown to the applicant)" className="input min-w-60 flex-1" />
                    <SubmitButton className="btn btn-danger">Reject</SubmitButton>
                  </form>
                </div>
              )}
              {s.status === "active" && (
                <form action={reviewStore.bind(null, s.id, "suspend")} className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                  <input name="note" required placeholder="Reason for suspension (hides all listings)" className="input min-w-60 flex-1" />
                  <SubmitButton className="btn btn-danger">Suspend store</SubmitButton>
                </form>
              )}
              {s.status === "suspended" && (
                <form action={reviewStore.bind(null, s.id, "reinstate")} className="mt-4 border-t border-line pt-4">
                  <SubmitButton className="btn btn-outline">Reinstate store</SubmitButton>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
