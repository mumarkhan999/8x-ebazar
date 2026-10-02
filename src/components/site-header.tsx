import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { getCategoryTree } from "@/lib/catalog";
import { logout } from "@/lib/actions/auth";
import { Logo } from "@/components/logo";
import { CartLink } from "@/components/cart-link";

export async function SiteHeader({ query = "" }: { query?: string }) {
  const [user, tree] = await Promise.all([getCurrentUser(), getCategoryTree()]);
  const sellerLive = user?.role === "seller" && user.store?.status === "active";

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap sm:gap-6">
        <Logo />

        <form action="/search" role="search" className="order-last w-full sm:order-none sm:flex-1">
          <label className="relative block">
            <span className="sr-only">Search eBazar</span>
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              name="q"
              defaultValue={query}
              placeholder="Search products, stores and categories"
              className="w-full rounded-full border border-line-strong bg-paper py-2.5 pl-10 pr-24 text-sm transition focus:border-jade-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-jade-100"
            />
            <button type="submit" className="btn btn-primary btn-sm absolute right-1.5 top-1/2 -translate-y-1/2">
              Search
            </button>
          </label>
        </form>

        <nav className="ml-auto flex items-center gap-1 sm:ml-0">
          {!sellerLive && user?.role !== "admin" && (
            <Link href="/sell" className="btn btn-ghost btn-sm hidden md:inline-flex">
              Sell on eBazar
            </Link>
          )}

          {user ? (
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition hover:bg-jade-50 [&::-webkit-details-marker]:hidden">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-jade-600 text-sm font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="hidden max-w-28 truncate text-sm font-semibold lg:block">{user.name.split(" ")[0]}</span>
              </summary>
              <div className="card absolute right-0 mt-2 w-60 p-2 text-sm">
                <div className="border-b border-line px-3 pb-2.5 pt-1.5">
                  <p className="font-semibold">{user.name}</p>
                  <p className="truncate text-xs text-muted">{user.email}</p>
                </div>
                <div className="py-1.5">
                  <MenuLink href="/account/orders">My orders</MenuLink>
                  <MenuLink href="/account">Account</MenuLink>
                  {sellerLive && <MenuLink href="/seller" strong>Seller Center</MenuLink>}
                  {user.role === "admin" && <MenuLink href="/admin" strong>Admin console</MenuLink>}
                  {!sellerLive && user.role !== "admin" && (
                    <MenuLink href="/sell">{user.store ? "My store application" : "Open a store"}</MenuLink>
                  )}
                </div>
                <form action={logout} className="border-t border-line pt-1.5">
                  <button className="w-full rounded-lg px-3 py-2 text-left text-muted hover:bg-paper hover:text-ink">
                    Log out
                  </button>
                </form>
              </div>
            </details>
          ) : (
            <Link href="/login" className="btn btn-ghost btn-sm">
              Log in
            </Link>
          )}

          <CartLink />
        </nav>
      </div>

      <div className="border-t border-line">
        <ul className="scrollbar-none mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 text-sm lg:overflow-visible">
          <li>
            <Link href="/deals" className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 font-semibold text-saffron-700 hover:text-ink">
              <span className="h-1.5 w-1.5 rounded-full bg-saffron-400" />
              Deals
            </Link>
          </li>
          {tree.map((dept) => (
            <li key={dept.id} className="group/dept relative">
              <Link
                href={`/category/${dept.slug}`}
                className="block whitespace-nowrap px-3 py-2.5 font-medium text-ink-soft hover:text-jade-700"
              >
                {dept.name}
              </Link>
              {dept.children.length > 0 && (
                <div className="invisible absolute left-0 top-full z-40 hidden pt-1 opacity-0 transition group-hover/dept:visible group-hover/dept:opacity-100 lg:block">
                  <ul className="card w-56 p-2">
                    {dept.children.map((c) => (
                      <li key={c.id}>
                        <Link href={`/category/${c.slug}`} className="block rounded-lg px-3 py-2 text-ink-soft hover:bg-jade-50 hover:text-jade-700">
                          {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
          <li className="ml-auto hidden lg:block">
            <Link href="/stores" className="block whitespace-nowrap px-3 py-2.5 font-medium text-ink-soft hover:text-jade-700">
              All stores →
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
}

function MenuLink({ href, children, strong }: { href: string; children: React.ReactNode; strong?: boolean }) {
  return (
    <Link
      href={href}
      className={`block rounded-lg px-3 py-2 hover:bg-jade-50 hover:text-jade-700 ${strong ? "font-semibold text-jade-700" : "text-ink-soft"}`}
    >
      {children}
    </Link>
  );
}
