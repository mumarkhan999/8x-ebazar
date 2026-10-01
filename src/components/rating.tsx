export function Stars({ value, size = "h-3.5 w-3.5" }: { value: number; size?: string }) {
  return (
    <span className="inline-flex items-center" aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <svg key={i} viewBox="0 0 20 20" className={size} aria-hidden="true">
            <defs>
              <linearGradient id={`s-${i}-${Math.round(fill * 100)}`}>
                <stop offset={`${fill * 100}%`} stopColor="var(--color-saffron-400)" />
                <stop offset={`${fill * 100}%`} stopColor="var(--color-line-strong)" />
              </linearGradient>
            </defs>
            <path
              fill={`url(#s-${i}-${Math.round(fill * 100)})`}
              d="M10 1.8l2.5 5.2 5.7.8-4.1 4 1 5.7L10 14.8l-5.1 2.7 1-5.7-4.1-4 5.7-.8L10 1.8z"
            />
          </svg>
        );
      })}
    </span>
  );
}

export function RatingSummary({ rating, count }: { rating: number | string; count: number }) {
  const value = Number(rating);
  if (!count) return <span className="text-xs text-muted">No reviews yet</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <Stars value={value} />
      <span className="font-semibold text-ink-soft">{value.toFixed(1)}</span>
      <span>({count.toLocaleString()})</span>
    </span>
  );
}
