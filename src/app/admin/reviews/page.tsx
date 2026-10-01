import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { listReviewsForAdmin } from "@/lib/admin";
import { setReviewHidden } from "@/lib/actions/admin";
import { formatDate } from "@/lib/format";
import { Badge, EmptyState, PageTitle } from "@/components/ui";
import { Stars } from "@/components/rating";

export const metadata: Metadata = { title: "Reviews · Admin" };

const FILTERS = [
  ["all", "All"],
  ["low", "2★ and below"],
  ["hidden", "Hidden"],
] as const;

export default async function AdminReviewsPage(props: PageProps<"/admin/reviews">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const filter = FILTERS.find(([k]) => k === sp.filter)?.[0] ?? "all";
  const reviews = await listReviewsForAdmin(filter);

  return (
    <div>
      <PageTitle eyebrow="Admin console" title="Reviews" />
      <div className="mb-5 flex gap-2">
        {FILTERS.map(([key, label]) => (
          <Link
            key={key}
            href={key === "all" ? "/admin/reviews" : `/admin/reviews?filter=${key}`}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filter === key ? "bg-ink text-white" : "bg-white ring-1 ring-line hover:ring-ink"}`}
          >
            {label}
          </Link>
        ))}
      </div>
      {reviews.length === 0 ? (
        <EmptyState title="No reviews here" />
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className={`card flex flex-wrap items-start gap-4 p-4 ${r.hidden ? "opacity-60" : ""}`}>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Stars value={r.rating} />
                  {r.hidden && <Badge tone="rose">hidden</Badge>}
                  <span className="text-xs text-muted">{r.user.name} · {formatDate(r.createdAt)}</span>
                </div>
                <p className="mt-1.5 text-sm text-ink-soft">{r.body}</p>
                <Link href={`/product/${r.product.slug}`} className="mt-1 inline-block text-xs font-semibold text-jade-700 hover:underline">
                  {r.product.title}
                </Link>
              </div>
              <form action={setReviewHidden.bind(null, r.id, !r.hidden)}>
                <button className={r.hidden ? "btn btn-outline btn-sm" : "btn btn-danger btn-sm"}>{r.hidden ? "Restore" : "Hide"}</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
