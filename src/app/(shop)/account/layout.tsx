import Link from "next/link";
import { requireUser } from "@/lib/dal";

export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  const user = await requireUser("/account");
  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-[220px_1fr]">
      <aside>
        <div className="card p-4">
          <p className="font-bold">{user.name}</p>
          <p className="truncate text-xs text-muted">{user.email}</p>
          <nav className="mt-4 space-y-0.5 text-sm">
            <Link href="/account" className="block rounded-lg px-3 py-2 text-ink-soft hover:bg-jade-50 hover:text-jade-700">Overview</Link>
            <Link href="/account/orders" className="block rounded-lg px-3 py-2 text-ink-soft hover:bg-jade-50 hover:text-jade-700">My orders</Link>
            {user.role === "seller" && user.store?.status === "active" ? (
              <Link href="/seller" className="block rounded-lg px-3 py-2 font-semibold text-jade-700 hover:bg-jade-50">Seller Center →</Link>
            ) : user.role !== "admin" ? (
              <Link href="/sell" className="block rounded-lg px-3 py-2 text-ink-soft hover:bg-jade-50 hover:text-jade-700">Sell on eBazar</Link>
            ) : (
              <Link href="/admin" className="block rounded-lg px-3 py-2 font-semibold text-jade-700 hover:bg-jade-50">Admin console →</Link>
            )}
          </nav>
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
