"use server";

import { revalidatePath } from "next/cache";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, products, reviews, stores, users } from "@/db/schema";
import { assertAdmin } from "@/lib/dal";
import { CategoryFormSchema, FormState } from "@/lib/definitions";
import { slugify } from "@/lib/format";
import { recomputeProductRating } from "@/lib/reviews";

// ---------------------------------------------------------------------------
// Store applications & moderation
// ---------------------------------------------------------------------------

type StoreDecision = "approve" | "reject" | "suspend" | "reinstate";

const ALLOWED_FROM: Record<StoreDecision, string[]> = {
  approve: ["pending"],
  reject: ["pending"],
  suspend: ["active"],
  reinstate: ["suspended"],
};

export async function reviewStore(storeId: string, decision: StoreDecision, formData?: FormData) {
  await assertAdmin();
  const store = await db.query.stores.findFirst({ where: eq(stores.id, storeId) });
  if (!store) throw new Error("Store not found");
  if (!ALLOWED_FROM[decision]?.includes(store.status)) {
    throw new Error(`Can't ${decision} a ${store.status} store.`);
  }

  const note = String(formData?.get("note") ?? "").trim() || null;
  const status = decision === "approve" || decision === "reinstate" ? "active" : decision === "reject" ? "rejected" : "suspended";

  await db.batch([
    db
      .update(stores)
      .set({ status, statusNote: status === "active" ? null : note, reviewedAt: new Date() })
      .where(eq(stores.id, storeId)),
    // The role follows the store: approved -> seller. A suspended seller keeps
    // the role (dal.requireSeller also checks store status), so reinstating
    // doesn't need to touch it.
    ...(decision === "approve"
      ? [db.update(users).set({ role: "seller" }).where(eq(users.id, store.ownerId))]
      : []),
  ]);

  revalidatePath("/admin/stores");
  revalidatePath("/admin");
  revalidatePath(`/store/${store.slug}`);
}

// ---------------------------------------------------------------------------
// Product & review moderation
// ---------------------------------------------------------------------------

export async function setProductBlocked(productId: string, blocked: boolean) {
  await assertAdmin();
  await db
    .update(products)
    .set({ status: blocked ? "blocked" : "draft" })
    .where(eq(products.id, productId));
  revalidatePath("/admin/products");
}

export async function setReviewHidden(reviewId: string, hidden: boolean) {
  await assertAdmin();
  const [row] = await db
    .update(reviews)
    .set({ hidden })
    .where(eq(reviews.id, reviewId))
    .returning({ productId: reviews.productId });
  if (row) await recomputeProductRating(row.productId);
  revalidatePath("/admin/reviews");
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function createCategory(_state: FormState, formData: FormData): Promise<FormState> {
  await assertAdmin();
  const parsed = CategoryFormSchema.safeParse({
    name: formData.get("name"),
    parentId: formData.get("parentId") ?? "",
    imageUrl: formData.get("imageUrl") ?? "",
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  if (parsed.data.parentId) {
    const parent = await db.query.categories.findFirst({
      where: eq(categories.id, parsed.data.parentId),
    });
    // Keep the tree two levels deep.
    if (!parent || parent.parentId) return { errors: { parentId: ["Pick a top-level department."] } };
  }

  const slug = slugify(parsed.data.name);
  const taken = await db.query.categories.findFirst({ where: eq(categories.slug, slug) });
  if (taken) return { errors: { name: ["A category with that name already exists."] } };

  await db.insert(categories).values({ ...parsed.data, slug });
  revalidatePath("/admin/categories");
  return { ok: true, message: `Added “${parsed.data.name}”.` };
}

export async function deleteCategory(categoryId: string) {
  await assertAdmin();
  const [[{ productsN }], [{ childrenN }]] = await Promise.all([
    db.select({ productsN: count() }).from(products).where(eq(products.categoryId, categoryId)),
    db.select({ childrenN: count() }).from(categories).where(eq(categories.parentId, categoryId)),
  ]);
  if (productsN > 0 || childrenN > 0) {
    throw new Error("Only empty categories can be deleted.");
  }
  await db.delete(categories).where(eq(categories.id, categoryId));
  revalidatePath("/admin/categories");
}
