"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/definitions";
import { FieldError, FormMessage } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { ImageListInput } from "@/components/image-inputs";

export type ProductFormValues = {
  title: string;
  description: string;
  highlights: string[];
  categoryId: string;
  priceCents: number;
  compareAtCents: number | null;
  stock: number;
  status: "draft" | "active" | "blocked";
  images: string[];
};

const dollars = (cents?: number | null) => (cents ? (cents / 100).toFixed(2) : "");

export function ProductForm({
  action,
  categories,
  defaults,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  categories: { id: string; label: string }[];
  defaults?: ProductFormValues;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const e = state?.errors;

  return (
    <form action={formAction} className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <section className="card space-y-5 p-6">
          <h2 className="font-extrabold">Details</h2>
          <div>
            <label htmlFor="title" className="label">Title</label>
            <input id="title" name="title" defaultValue={defaults?.title} required className="input" aria-invalid={Boolean(e?.title)} placeholder="e.g. Insulated Steel Water Bottle, 750 ml" />
            <FieldError errors={e?.title} />
          </div>
          <div>
            <label htmlFor="description" className="label">Description</label>
            <textarea id="description" name="description" rows={6} defaultValue={defaults?.description} required className="input" aria-invalid={Boolean(e?.description)} />
            <FieldError errors={e?.description} />
          </div>
          <div>
            <label htmlFor="highlights" className="label">Key features <span className="font-normal text-muted">(one per line, optional)</span></label>
            <textarea id="highlights" name="highlights" rows={4} defaultValue={defaults?.highlights.join("\n")} className="input" placeholder={"Keeps drinks cold for 24 hours\nLeak-proof lid"} />
          </div>
        </section>

        <section className="card space-y-4 p-6">
          <h2 className="font-extrabold">Images</h2>
          <ImageListInput defaultValue={defaults?.images} error={e?.images} />
        </section>
      </div>

      <div className="space-y-6">
        <section className="card space-y-4 p-6">
          <h2 className="font-extrabold">Pricing & stock</h2>
          <div>
            <label htmlFor="price" className="label">Price (USD)</label>
            <input id="price" name="price" inputMode="decimal" defaultValue={dollars(defaults?.priceCents)} required className="input" aria-invalid={Boolean(e?.price)} placeholder="24.99" />
            <FieldError errors={e?.price} />
          </div>
          <div>
            <label htmlFor="compareAt" className="label">Original price <span className="font-normal text-muted">(optional)</span></label>
            <input id="compareAt" name="compareAt" inputMode="decimal" defaultValue={dollars(defaults?.compareAtCents)} className="input" aria-invalid={Boolean(e?.compareAt)} placeholder="Shows a discount when higher" />
            <FieldError errors={e?.compareAt} />
          </div>
          <div>
            <label htmlFor="stock" className="label">Stock</label>
            <input id="stock" name="stock" type="number" min={0} defaultValue={defaults?.stock ?? 10} required className="input" aria-invalid={Boolean(e?.stock)} />
            <FieldError errors={e?.stock} />
          </div>
        </section>

        <section className="card space-y-4 p-6">
          <h2 className="font-extrabold">Organisation</h2>
          <div>
            <label htmlFor="categoryId" className="label">Category</label>
            <select id="categoryId" name="categoryId" defaultValue={defaults?.categoryId ?? ""} required className="input" aria-invalid={Boolean(e?.categoryId)}>
              <option value="" disabled>Choose a category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            <FieldError errors={e?.categoryId} />
          </div>
          {defaults?.status === "blocked" ? (
            <p className="rounded-xl bg-[#fff4ef] px-3 py-2 text-xs font-medium text-rose-600">
              This product was blocked by an eBazar admin and isn&apos;t visible to shoppers. You can still edit it.
              <input type="hidden" name="status" value="draft" />
            </p>
          ) : (
            <fieldset>
              <legend className="label">Visibility</legend>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["active", "Published", "Visible in your store"],
                  ["draft", "Draft", "Only you can see it"],
                ].map(([value, label, hint]) => (
                  <label key={value} className="cursor-pointer rounded-xl border border-line-strong p-3 text-sm has-[:checked]:border-jade-500 has-[:checked]:bg-jade-50">
                    <input type="radio" name="status" value={value} defaultChecked={(defaults?.status ?? "active") === value} className="sr-only" />
                    <span className="block font-semibold">{label}</span>
                    <span className="text-xs text-muted">{hint}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        </section>

        <FormMessage state={state} />
        <SubmitButton className="btn btn-primary w-full py-3" pendingLabel="Saving…">{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
