import Link from "next/link";
import type { ReactNode } from "react";

export function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1.5 text-xs font-medium text-rose-600">{errors[0]}</p>;
}

export function FormMessage({ state }: { state?: { message?: string; ok?: boolean } }) {
  if (!state?.message) return null;
  return (
    <p
      role="status"
      className={`rounded-xl px-3.5 py-2.5 text-sm font-medium ${
        state.ok ? "bg-jade-50 text-jade-700" : "bg-[#fff4ef] text-rose-600"
      }`}
    >
      {state.message}
    </p>
  );
}

const TONES = {
  neutral: "bg-paper text-ink-soft ring-line-strong",
  jade: "bg-jade-50 text-jade-700 ring-jade-200",
  saffron: "bg-saffron-50 text-saffron-700 ring-saffron-100",
  rose: "bg-[#fff4ef] text-rose-600 ring-[#f6d3c4]",
  ink: "bg-ink text-white ring-ink",
} as const;

export type Tone = keyof typeof TONES;

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export const STATUS_TONE: Record<string, Tone> = {
  pending: "saffron",
  active: "jade",
  paid: "jade",
  packed: "saffron",
  shipped: "saffron",
  delivered: "jade",
  draft: "neutral",
  rejected: "rose",
  suspended: "rose",
  blocked: "rose",
  cancelled: "rose",
  customer: "neutral",
  seller: "jade",
  admin: "ink",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? "neutral"}>{status}</Badge>;
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-jade-50 text-jade-600">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 9h18l-1.5 10.5a2 2 0 0 1-2 1.5h-11a2 2 0 0 1-2-1.5L3 9Z" />
          <path d="M8 9V7a4 4 0 1 1 8 0v2" />
        </svg>
      </div>
      <h3 className="text-base font-bold">{title}</h3>
      {body && <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>}
      {action && (
        <Link href={action.href} className="btn btn-primary mt-5">
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function PageTitle({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "neutral" | "jade" | "saffron";
}) {
  const accent =
    tone === "jade" ? "before:bg-jade-500" : tone === "saffron" ? "before:bg-saffron-400" : "before:bg-line-strong";
  return (
    <div
      className={`card relative overflow-hidden p-5 before:absolute before:inset-y-0 before:left-0 before:w-1 ${accent}`}
    >
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="mt-2 text-2xl font-extrabold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
