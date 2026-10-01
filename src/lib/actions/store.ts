"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { stores } from "@/db/schema";
import { assertSeller, getCurrentUser } from "@/lib/dal";
import { FormState, StoreFormSchema } from "@/lib/definitions";
import { slugify } from "@/lib/format";

function parseStoreForm(formData: FormData) {
  return StoreFormSchema.safeParse({
    name: formData.get("name"),
    tagline: formData.get("tagline") ?? "",
    description: formData.get("description") ?? "",
    logoUrl: formData.get("logoUrl") ?? "",
    bannerUrl: formData.get("bannerUrl") ?? "",
  });
}

async function uniqueStoreSlug(name: string, exceptStoreId?: string) {
  const base = slugify(name) || "store";
  for (let i = 0; i < 20; i++) {
    const slug = i === 0 ? base : `${base}-${i + 1}`;
    const taken = await db.query.stores.findFirst({
      where: eq(stores.slug, slug),
      columns: { id: true },
    });
    if (!taken || taken.id === exceptStoreId) return slug;
  }
  return `${base}-${crypto.randomUUID().slice(0, 6)}`;
}

/**
 * Any logged-in customer can apply. The store starts as `pending` and the
 * account keeps the customer role until an admin approves it. A rejected
 * applicant can edit and re-submit, which puts it back to pending.
 */
export async function applyForStore(_state: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/sell");
  if (user.role === "admin") return { message: "Admin accounts can't open a store." };

  const parsed = parseStoreForm(formData);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const existing = user.store;
  if (existing && existing.status !== "rejected") {
    return { message: "You already have a store application." };
  }

  const slug = await uniqueStoreSlug(parsed.data.name, existing?.id);
  if (existing) {
    await db
      .update(stores)
      .set({ ...parsed.data, slug, status: "pending", statusNote: null, reviewedAt: null })
      .where(eq(stores.id, existing.id));
  } else {
    await db.insert(stores).values({ ...parsed.data, slug, ownerId: user.id });
  }

  revalidatePath("/sell");
  redirect("/sell");
}

export async function updateStore(_state: FormState, formData: FormData): Promise<FormState> {
  const { store } = await assertSeller();

  const parsed = parseStoreForm(formData);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  // Slug is kept stable once a store is live so shared links don't break.
  await db.update(stores).set(parsed.data).where(eq(stores.id, store.id));

  revalidatePath(`/store/${store.slug}`);
  revalidatePath("/seller/store");
  return { ok: true, message: "Store profile saved." };
}
