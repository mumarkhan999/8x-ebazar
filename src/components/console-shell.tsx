import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/logo";
import { logout } from "@/lib/actions/auth";
import { ConsoleNav } from "@/components/console-nav";

export function ConsoleShell({
  badge,
  context,
  nav,
  userName,
  children,
}: {
  badge: string;
  context: ReactNode;
  nav: { href: string; label: string; count?: number }[];
  userName: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="border-b border-line bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <Logo suffix={badge} />
        </div>
        <div className="mx-4 mb-3 hidden rounded-xl bg-paper px-3 py-2.5 lg:block">{context}</div>
        <ConsoleNav items={nav} />
        <div className="mt-auto hidden border-t border-line p-4 text-sm lg:block">
          <p className="truncate font-semibold">{userName}</p>
          <div className="mt-2 flex items-center gap-3 text-xs">
            <Link href="/" className="font-semibold text-jade-700 hover:underline">← Storefront</Link>
            <form action={logout}>
              <button className="text-muted hover:text-ink">Log out</button>
            </form>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
    </div>
  );
}
