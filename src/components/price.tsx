import { discountPercent, formatPrice } from "@/lib/format";

export function Price({
  priceCents,
  compareAtCents,
  size = "md",
  showPercent = true,
}: {
  priceCents: number;
  compareAtCents: number | null;
  size?: "md" | "lg";
  showPercent?: boolean;
}) {
  const off = discountPercent(priceCents, compareAtCents);
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={size === "lg" ? "text-3xl font-extrabold tracking-tight" : "text-base font-extrabold"}>
        {formatPrice(priceCents)}
      </span>
      {off > 0 && (
        <>
          <span className={`text-muted line-through ${size === "lg" ? "text-base" : "text-xs"}`}>
            {formatPrice(compareAtCents!)}
          </span>
          {showPercent && (
            <span
              className={`rounded-md bg-saffron-100 font-bold text-saffron-700 ${
                size === "lg" ? "px-2 py-0.5 text-sm" : "px-1.5 text-[11px]"
              }`}
            >
              −{off}%
            </span>
          )}
        </>
      )}
    </div>
  );
}
