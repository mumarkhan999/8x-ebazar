import Link from "next/link";
import { listProducts, parseSort, SORTS, type ListFilters } from "@/lib/catalog";
import { ProductGrid } from "@/components/product-card";
import { EmptyState } from "@/components/ui";

type Params = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const dollarsToCents = (v: string | undefined) => {
  const n = Number(v);
  return v && Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : undefined;
};

// Builds a URL on the current path, keeping existing params and overriding some.
function hrefWith(basePath: string, params: Params, overrides: Record<string, string | undefined>) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    const value = first(v);
    if (value) qs.set(k, value);
  }
  for (const [k, v] of Object.entries(overrides)) {
    if (v) qs.set(k, v);
    else qs.delete(k);
  }
  const s = qs.toString();
  return s ? `${basePath}?${s}` : basePath;
}

export async function Listing({
  basePath,
  searchParams,
  fixed = {},
  sidebar,
  emptyTitle = "Nothing here yet",
}: {
  basePath: string;
  searchParams: Params;
  fixed?: ListFilters;
  sidebar?: React.ReactNode;
  emptyTitle?: string;
}) {
  const q = first(searchParams.q)?.trim() || undefined;
  const sort = parseSort(first(searchParams.sort));
  const page = Math.max(1, Number(first(searchParams.page)) || 1);
  const min = first(searchParams.min);
  const max = first(searchParams.max);

  const { items, total, pageSize } = await listProducts({
    q,
    sort,
    page,
    minCents: dollarsToCents(min),
    maxCents: dollarsToCents(max),
    ...fixed,
  });
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="space-y-4">
        {sidebar}
        <form action={basePath} className="card space-y-3 p-4">
          {q && <input type="hidden" name="q" value={q} />}
          {sort !== "newest" && <input type="hidden" name="sort" value={sort} />}
          <p className="text-sm font-bold">Price</p>
          <div className="flex items-center gap-2">
            <input name="min" defaultValue={min} inputMode="decimal" placeholder="Min $" className="input !py-2" aria-label="Minimum price" />
            <span className="text-muted">–</span>
            <input name="max" defaultValue={max} inputMode="decimal" placeholder="Max $" className="input !py-2" aria-label="Maximum price" />
          </div>
          <button className="btn btn-dark btn-sm w-full">Apply</button>
          {(min || max) && (
            <Link href={hrefWith(basePath, searchParams, { min: undefined, max: undefined, page: undefined })} className="block text-center text-xs font-semibold text-jade-700 hover:underline">
              Clear price
            </Link>
          )}
        </form>
      </aside>

      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            <span className="font-semibold text-ink">{total.toLocaleString()}</span> {total === 1 ? "item" : "items"}
            {q && (
              <>
                {" "}for “<span className="font-semibold text-ink">{q}</span>”
              </>
            )}
          </p>
          <nav aria-label="Sort" className="scrollbar-none -mx-1 flex gap-1 overflow-x-auto px-1">
            {Object.entries(SORTS).map(([key, { label }]) => (
              <Link
                key={key}
                href={hrefWith(basePath, searchParams, { sort: key === "newest" ? undefined : key, page: undefined })}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  key === sort ? "bg-ink text-white" : "bg-white text-ink-soft ring-1 ring-line hover:ring-ink"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {items.length ? (
          <ProductGrid products={items} priorityCount={4} />
        ) : (
          <EmptyState
            title={emptyTitle}
            body={q ? "Try a shorter search or a different spelling." : "Try removing a filter."}
            action={{ href: "/", label: "Back to home" }}
          />
        )}

        {pages > 1 && (
          <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
            {page > 1 && (
              <Link href={hrefWith(basePath, searchParams, { page: String(page - 1) })} className="btn btn-outline btn-sm">
                ← Prev
              </Link>
            )}
            {Array.from({ length: pages }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1)
              .map((n, i, arr) => (
                <span key={n} className="flex items-center gap-1.5">
                  {i > 0 && n - arr[i - 1] > 1 && <span className="text-muted">…</span>}
                  <Link
                    href={hrefWith(basePath, searchParams, { page: n === 1 ? undefined : String(n) })}
                    aria-current={n === page ? "page" : undefined}
                    className={`grid h-9 min-w-9 place-items-center rounded-full px-2 text-sm font-semibold ${
                      n === page ? "bg-jade-600 text-white" : "bg-white ring-1 ring-line hover:ring-ink"
                    }`}
                  >
                    {n}
                  </Link>
                </span>
              ))}
            {page < pages && (
              <Link href={hrefWith(basePath, searchParams, { page: String(page + 1) })} className="btn btn-outline btn-sm">
                Next →
              </Link>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}

export function CategorySidebar({
  tree,
  activeSlug,
}: {
  tree: { id: string; name: string; slug: string; children: { id: string; name: string; slug: string }[] }[];
  activeSlug?: string;
}) {
  return (
    <nav className="card p-4" aria-label="Categories">
      <p className="mb-2 text-sm font-bold">Categories</p>
      <ul className="space-y-0.5 text-sm">
        {tree.map((dept) => {
          const open = dept.slug === activeSlug || dept.children.some((c) => c.slug === activeSlug);
          return (
            <li key={dept.id}>
              <Link
                href={`/category/${dept.slug}`}
                className={`block rounded-lg px-2.5 py-1.5 ${dept.slug === activeSlug ? "bg-jade-50 font-semibold text-jade-700" : "text-ink-soft hover:bg-paper"}`}
              >
                {dept.name}
              </Link>
              {open && (
                <ul className="my-1 ml-3 border-l border-line pl-2">
                  {dept.children.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/category/${c.slug}`}
                        className={`block rounded-lg px-2.5 py-1 text-[13px] ${c.slug === activeSlug ? "font-semibold text-jade-700" : "text-muted hover:text-ink"}`}
                      >
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
