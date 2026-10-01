import type { ReactNode } from "react";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-2 md:py-16">
      <div className="bg-weave hidden flex-col justify-between rounded-3xl p-10 text-white md:flex">
        <p className="eyebrow !text-jade-100">eBazar</p>
        <div>
          <p className="text-3xl font-extrabold leading-tight">
            Independent stores.
            <br />
            <span className="text-saffron-400">One account for all of them.</span>
          </p>
          <ul className="mt-6 space-y-2 text-sm text-white/80">
            <li>• Track every package from every seller</li>
            <li>• Review what you buy — verified purchases only</li>
            <li>• Open your own store whenever you&apos;re ready</li>
          </ul>
        </div>
        <p className="text-xs text-white/50">Demo accounts use the password Password123 — see the README.</p>
      </div>
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        <p className="mb-6 mt-1 text-sm text-muted">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
