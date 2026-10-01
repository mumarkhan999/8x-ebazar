"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ConsoleNav({ items }: { items: { href: string; label: string; count?: number }[] }) {
  const pathname = usePathname();
  // The section root (e.g. /seller) is only active on an exact match.
  const root = items[0]?.href;
  return (
    <nav className="scrollbar-none flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
      {items.map((item) => {
        const active = item.href === root ? pathname === root : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-between gap-3 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition ${
              active ? "bg-jade-600 text-white" : "text-ink-soft hover:bg-jade-50 hover:text-jade-700"
            }`}
          >
            {item.label}
            {item.count ? (
              <span className={`rounded-full px-1.5 text-[11px] font-bold ${active ? "bg-white/20" : "bg-saffron-400 text-ink"}`}>
                {item.count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
