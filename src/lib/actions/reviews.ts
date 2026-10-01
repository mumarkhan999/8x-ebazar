"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products, reviews } from "@/db/schema";
import { getCurrentUser } from "@/lib/dal";
import { FormState, ReviewFormSchema } from "@/lib/definitions";
import { hasDeliveredPurchase } from "@/lib/orders";
import { recomputeProductRating } from "@/lib/reviews";

export async function submitReview(_state: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Please log in to write a review." };

  const parsed = ReviewFormSchema.safeParse({
    productId: formData.get("productId"),
    rating: formData.get("rating"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };
  const { productId, rating, body } = parsed.data;

  // Only buyers whose order for this product was delivered can review it.
  if (!(await hasDeliveredPurchase(user.id, productId))) {
    return { message: "You can review this product once your order has been delivered." };
  }

  // One review per buyer per product; writing again edits it.
  await db
    .insert(reviews)
    .values({ productId, userId: user.id, rating, body })
    .onConflictDoUpdate({
      target: [reviews.productId, reviews.userId],
      set: { rating, body, createdAt: new Date() },
    });
  await recomputeProductRating(productId);

  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
    columns: { slug: true },
  });
  if (product) revalidatePath(`/product/${product.slug}`);
  return { ok: true, message: "Thanks — your review is live." };
}
