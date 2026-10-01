"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";
import { ProductImage } from "@/components/product-image";
import { EmptyState } from "@/components/ui";
import { groupByStore } from "../cart/cart-view";

export function CheckoutForm({ defaultName }: { defaultName: string }) {
  const { items, totalCents } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return <EmptyState title="Nothing to check out" body="Your cart is empty." action={{ href: "/", label: "Keep shopping" }} />;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const f = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          shippingName: f.get("name"),
          shippingPhone: f.get("phone"),
          shippingAddress: {
            line1: f.get("line1"),
            city: f.get("city"),
            region: f.get("region"),
            postalCode: f.get("postalCode"),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  const groups = groupByStore(items);

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <section className="card space-y-5 p-6">
        <div>
          <p className="eyebrow">Step 1 of 2</p>
          <h2 className="mt-1 text-lg font-extrabold">Delivery details</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="name" label="Full name" defaultValue={defaultName} autoComplete="name" />
          <Field id="phone" label="Phone" type="tel" autoComplete="tel" placeholder="+92 300 1234567" />
          <div className="sm:col-span-2">
            <Field id="line1" label="Street address" autoComplete="address-line1" placeholder="House, street, area" />
          </div>
          <Field id="city" label="City" autoComplete="address-level2" />
          <Field id="region" label="Province / State" autoComplete="address-level1" />
          <Field id="postalCode" label="Postal code" autoComplete="postal-code" />
        </div>
        <div className="rounded-xl bg-paper p-4 text-xs leading-5 text-muted">
          <p className="font-semibold text-ink-soft">Step 2: payment on Stripe</p>
          This is a demo in Stripe test mode. Use card <span className="font-mono font-semibold text-ink">4242 4242 4242 4242</span>, any future expiry date and any CVC.
        </div>
      </section>

      <aside className="card h-fit space-y-4 p-5 lg:sticky lg:top-36">
        <h2 className="font-extrabold">Order summary</h2>
        {groups.map((g) => (
          <div key={g.storeSlug}>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-jade-700">{g.storeName}</p>
            <ul className="space-y-2.5">
              {g.items.map((item) => (
                <li key={item.productId} className="flex gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-paper">
                    <ProductImage src={item.imageUrl} alt="" width={120} />
                  </div>
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="line-clamp-1 font-medium">{item.title}</p>
                    <p className="text-muted">Qty {item.quantity}</p>
                  </div>
                  <p className="text-xs font-bold">{formatPrice(item.priceCents * item.quantity)}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="flex justify-between border-t border-line pt-3 text-base font-extrabold">
          <span>Total</span>
          <span>{formatPrice(totalCents)}</span>
        </div>
        {error && <p className="rounded-xl bg-[#fff4ef] px-3 py-2 text-sm font-medium text-rose-600">{error}</p>}
        <button type="submit" disabled={submitting} className="btn btn-primary w-full py-3">
          {submitting ? "Redirecting to payment…" : `Pay ${formatPrice(totalCents)}`}
        </button>
      </aside>
    </form>
  );
}

function Field({
  id,
  label,
  type = "text",
  ...rest
}: { id: string; label: string; type?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <input id={id} name={id} type={type} required className="input" {...rest} />
    </div>
  );
}
