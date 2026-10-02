"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * A slim bar at the top of the page that starts the moment a link is clicked
 * (or a GET form like search is submitted) and finishes when the new URL has
 * rendered. Covers navigations that loading.tsx doesn't, e.g. changing sort,
 * page or filters on the same route.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentUrl = `${pathname}?${searchParams}`;
  // The URL we were on when a navigation started. While it's still the
  // current URL we're loading; once the URL changes, the navigation is done.
  const [startedFrom, setStartedFrom] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const state = startedFrom === null ? "idle" : startedFrom === currentUrl ? "loading" : "done";

  // After finishing, let the bar complete and fade, then reset.
  // Safety net: a navigation that ends on the same URL (e.g. a redirect back
  // here) never changes the URL, so give up after 10s.
  useEffect(() => {
    if (state === "idle") return;
    timer.current = setTimeout(() => setStartedFrom(null), state === "done" ? 350 : 10_000);
    return () => clearTimeout(timer.current);
  }, [state]);

  useEffect(() => {
    const start = (target: URL) => {
      const here = new URL(window.location.href);
      if (target.origin !== here.origin) return;
      if (target.pathname === here.pathname && target.search === here.search) return;
      clearTimeout(timer.current);
      setStartedFrom(`${here.pathname}?${here.searchParams}`);
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element).closest("a");
      if (!a || !a.href || a.target === "_blank" || a.hasAttribute("download")) return;
      start(new URL(a.href));
    };

    const onSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement;
      // Only plain GET forms navigate (search, filters). Server-action forms
      // have their own pending buttons.
      if (form.method.toLowerCase() !== "get" || typeof form.getAttribute("action") !== "string") return;
      const url = new URL(form.action, window.location.href);
      url.search = new URLSearchParams(new FormData(form) as unknown as Record<string, string>).toString();
      start(url);
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]"
      style={{ opacity: state === "idle" ? 0 : 1, transition: "opacity 300ms" }}
    >
      <div
        className="h-full bg-saffron-400 shadow-[0_0_8px_var(--color-saffron-400)]"
        style={{
          width: state === "loading" ? "85%" : state === "done" ? "100%" : "0%",
          transition:
            state === "loading" ? "width 8s cubic-bezier(0.1, 0.7, 0.2, 1)" : state === "done" ? "width 200ms ease-out" : "none",
        }}
      />
    </div>
  );
}
