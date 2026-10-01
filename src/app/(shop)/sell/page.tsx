import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser, getStoreForOwner } from "@/lib/dal";
import { applyForStore } from "@/lib/actions/store";
import { formatDate } from "@/lib/format";
import { StoreForm } from "@/components/store-form";
import { StatusBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Sell on eBazar" };

export default async function SellPage() {
  const user = await requireUser("/sell");
  if (user.role === "seller" && user.store?.status === "active") redirect("/seller");
  const store = await getStoreForOwner(user.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <p className="eyebrow">Sell on eBazar</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
            {store ? store.name : "Open your stall"}
          </h1>

          {user.role === "admin" ? (
            <p className="mt-4 text-sm text-muted">Admin accounts manage the marketplace and can&apos;t open a store.</p>
          ) : !store ? (
            <div className="card mt-6 p-6">
              <p className="mb-5 text-sm text-muted">
                Tell us about your store. Our team reviews every application — usually within a day — before you can list products.
              </p>
              <StoreForm action={applyForStore} submitLabel="Submit application" />
            </div>
          ) : store.status === "pending" ? (
            <StatusPanel tone="saffron" title="Your application is under review">
              Submitted {formatDate(store.createdAt)}. You&apos;ll get access to Seller Center as soon as an admin approves your store. You can keep shopping meanwhile.
            </StatusPanel>
          ) : store.status === "rejected" ? (
            <>
              <StatusPanel tone="rose" title="Your application wasn't approved">
                {store.statusNote ?? "No reason was given."} Update your details below and re-submit.
              </StatusPanel>
              <div className="card mt-6 p-6">
                <StoreForm action={applyForStore} defaults={store} submitLabel="Re-submit application" />
              </div>
            </>
          ) : store.status === "suspended" ? (
            <StatusPanel tone="rose" title="Your store is suspended">
              {store.statusNote ?? "Your listings are hidden while we review your account."} You can still shop with this account.
            </StatusPanel>
          ) : (
            <p className="mt-4"><Link href="/seller" className="btn btn-primary">Go to Seller Center</Link></p>
          )}
        </div>

        <aside className="space-y-4">
          {store && (
            <div className="card p-5">
              <p className="eyebrow">Application status</p>
              <div className="mt-2"><StatusBadge status={store.status} /></div>
            </div>
          )}
          <div className="card p-5">
            <p className="font-bold">How selling works</p>
            <ol className="mt-3 space-y-3 text-sm text-ink-soft">
              {[
                ["Apply", "Give your store a name and a short description."],
                ["Get approved", "An eBazar admin reviews your store."],
                ["List products", "Upload photos or paste image links, set prices and stock."],
                ["Fulfil orders", "Mark orders packed, shipped and delivered as you go."],
              ].map(([t, b], i) => (
                <li key={t} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-jade-600 text-xs font-bold text-white">{i + 1}</span>
                  <span><strong className="text-ink">{t}.</strong> {b}</span>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatusPanel({ tone, title, children }: { tone: "saffron" | "rose"; title: string; children: React.ReactNode }) {
  return (
    <div className={`mt-6 rounded-2xl p-6 ${tone === "saffron" ? "bg-saffron-50 ring-1 ring-saffron-100" : "bg-[#fff4ef] ring-1 ring-[#f6d3c4]"}`}>
      <p className="font-bold">{title}</p>
      <p className="mt-1 text-sm text-ink-soft">{children}</p>
    </div>
  );
}
