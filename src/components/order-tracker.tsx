import type { SubOrderStatus } from "@/db/schema";

const STEPS: { key: SubOrderStatus; label: string }[] = [
  { key: "paid", label: "Confirmed" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

export function OrderTracker({ status }: { status: SubOrderStatus }) {
  if (status === "cancelled") {
    return <p className="rounded-xl bg-[#fff4ef] px-3 py-2 text-xs font-semibold text-rose-600">Cancelled by the seller — you won&apos;t be charged for these items.</p>;
  }
  if (status === "pending") {
    return <p className="rounded-xl bg-saffron-50 px-3 py-2 text-xs font-semibold text-saffron-700">Awaiting payment</p>;
  }
  const current = STEPS.findIndex((s) => s.key === status);
  return (
    <ol className="flex items-center" aria-label={`Status: ${status}`}>
      {STEPS.map((step, i) => {
        const done = i <= current;
        return (
          <li key={step.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold ${done ? "bg-jade-600 text-white" : "bg-paper text-muted ring-1 ring-line-strong"}`}>
                {done ? "✓" : i + 1}
              </span>
              <span className={`text-[11px] font-semibold ${done ? "text-ink" : "text-muted"}`}>{step.label}</span>
            </div>
            {i < STEPS.length - 1 && <span className={`mx-1 mb-5 h-0.5 flex-1 rounded ${i < current ? "bg-jade-500" : "bg-line"}`} />}
          </li>
        );
      })}
    </ol>
  );
}
