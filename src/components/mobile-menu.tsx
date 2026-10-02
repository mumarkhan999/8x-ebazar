"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Dept = { id: string; name: string; slug: string; children: { id: string; name: string; slug: string }[] };

/**
 * Below the lg breakpoint the department bar collapses into this menu:
 * a hamburger button that opens a slide-in panel with every department and
 * its sub-categories. The panel is portalled to <body>: the sticky header uses
 * backdrop-blur, which would otherwise trap position:fixed inside the header.
 */
export function MobileMenu({ tree, showSell }: { tree: Dept[]; showSell: boolean }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  // Lock page scroll and allow Escape to close while the panel is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-menu"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-jade-50 hover:text-jade-700 lg:hidden"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              onClick={close}
              className="absolute inset-0 animate-[fade-in_200ms_ease-out] bg-ink/40"
            />
            <nav
              id="mobile-menu"
              aria-label="Categories"
              className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] animate-[slide-in-left_200ms_ease-out] flex-col bg-white shadow-[var(--shadow-lift)]"
            >
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <span className="text-base font-extrabold">Shop by category</span>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close menu"
                  className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-paper hover:text-ink"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-2 py-2 text-sm">
                <Link href="/deals" onClick={close} className="flex items-center gap-2 rounded-lg px-3 py-2.5 font-semibold text-saffron-700 hover:bg-saffron-50">
                  <span className="h-1.5 w-1.5 rounded-full bg-saffron-400" />
                  Today&apos;s deals
                </Link>

                <ul className="mt-1 border-t border-line pt-1">
                  {tree.map((dept) => (
                    <li key={dept.id}>
                      {dept.children.length ? (
                        <details className="group">
                          <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-2.5 font-medium text-ink-soft hover:bg-paper [&::-webkit-details-marker]:hidden">
                            {dept.name}
                            <svg viewBox="0 0 20 20" className="h-4 w-4 text-muted transition group-open:rotate-180" fill="currentColor" aria-hidden>
                              <path d="M5.2 7.2a.75.75 0 0 1 1.06 0L10 10.94l3.74-3.74a.75.75 0 1 1 1.06 1.06l-4.27 4.27a.75.75 0 0 1-1.06 0L5.2 8.26a.75.75 0 0 1 0-1.06Z" />
                            </svg>
                          </summary>
                          <ul className="mb-1 ml-3 border-l border-line pl-2">
                            <li>
                              <Link href={`/category/${dept.slug}`} onClick={close} className="block rounded-lg px-3 py-2 font-semibold text-jade-700 hover:bg-jade-50">
                                All {dept.name}
                              </Link>
                            </li>
                            {dept.children.map((c) => (
                              <li key={c.id}>
                                <Link href={`/category/${c.slug}`} onClick={close} className="block rounded-lg px-3 py-2 text-ink-soft hover:bg-jade-50 hover:text-jade-700">
                                  {c.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </details>
                      ) : (
                        <Link href={`/category/${dept.slug}`} onClick={close} className="block rounded-lg px-3 py-2.5 font-medium text-ink-soft hover:bg-paper">
                          {dept.name}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>

                <div className="mt-1 border-t border-line pt-1">
                  <Link href="/stores" onClick={close} className="block rounded-lg px-3 py-2.5 font-medium text-ink-soft hover:bg-paper">
                    All stores
                  </Link>
                  {showSell && (
                    <Link href="/sell" onClick={close} className="block rounded-lg px-3 py-2.5 font-medium text-jade-700 hover:bg-jade-50">
                      Sell on eBazar
                    </Link>
                  )}
                </div>
              </div>
            </nav>
          </div>,
          document.body
        )}
    </>
  );
}
