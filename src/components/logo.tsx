import Link from "next/link";

// A market-stall awning over a basket — the eBazar mark.
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--color-jade-600)" />
      <path
        d="M6 12.5 8.5 7h15L26 12.5c0 1.7-1.3 3-3 3s-3-1.3-3-3c0 1.7-1.3 3-3 3h-2c-1.7 0-3-1.3-3-3 0 1.7-1.3 3-3 3s-3-1.3-3-3Z"
        fill="var(--color-saffron-400)"
      />
      <path d="M9 17.5h14l-1.4 7.2a1.6 1.6 0 0 1-1.6 1.3h-8a1.6 1.6 0 0 1-1.6-1.3L9 17.5Z" fill="white" />
      <path d="M13 20.5v2.5M16 20.5v2.5M19 20.5v2.5" stroke="var(--color-jade-600)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ href = "/", suffix }: { href?: string; suffix?: string }) {
  return (
    <Link href={href} className="flex shrink-0 items-center gap-2" aria-label="eBazar home">
      <LogoMark />
      <span className="text-xl font-extrabold tracking-tight text-ink">
        e<span className="text-jade-600">Bazar</span>
      </span>
      {suffix && (
        <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-white">
          {suffix}
        </span>
      )}
    </Link>
  );
}
