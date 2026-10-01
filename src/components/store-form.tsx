"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/definitions";
import { FieldError, FormMessage } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { SingleImageInput } from "@/components/image-inputs";

type StoreValues = {
  name: string;
  tagline: string;
  description: string;
  logoUrl: string | null;
  bannerUrl: string | null;
};

export function StoreForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaults?: Partial<StoreValues>;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const e = state?.errors;

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="name" className="label">Store name</label>
        <input id="name" name="name" defaultValue={defaults?.name} required className="input" aria-invalid={Boolean(e?.name)} />
        <FieldError errors={e?.name} />
      </div>
      <div>
        <label htmlFor="tagline" className="label">Tagline</label>
        <input id="tagline" name="tagline" defaultValue={defaults?.tagline} placeholder="One line shoppers see under your name" className="input" />
        <FieldError errors={e?.tagline} />
      </div>
      <div>
        <label htmlFor="description" className="label">About your store</label>
        <textarea id="description" name="description" rows={4} defaultValue={defaults?.description} placeholder="What do you sell? Where do you ship from?" className="input" />
        <FieldError errors={e?.description} />
      </div>
      <SingleImageInput name="logoUrl" label="Logo" defaultValue={defaults?.logoUrl} error={e?.logoUrl} />
      <SingleImageInput name="bannerUrl" label="Banner" defaultValue={defaults?.bannerUrl} aspect="aspect-[4/1] w-full max-w-md" error={e?.bannerUrl} />
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Saving…">{submitLabel}</SubmitButton>
    </form>
  );
}
