"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

export function CartLink() {
  const { totalItems } = useCart();
  return (
    <Link
      href="/cart"
      className="relative grid h-10 w-10 place-items-center rounded-full text-ink-soft transition hover:bg-jade-50 hover:text-jade-700"
      aria-label={`Cart, ${totalItems} items`}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9h18l-1.5 10.5a2 2 0 0 1-2 1.5h-11a2 2 0 0 1-2-1.5L3 9Z" />
        <path d="M8 9V7a4 4 0 1 1 8 0v2" />
      </svg>
      {totalItems > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-saffron-400 px-1 text-[11px] font-bold text-ink">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </Link>
  );
}
