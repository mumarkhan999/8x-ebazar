import "server-only";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { products, reviews } from "@/db/schema";

// Keeps products.rating_avg / review_count in sync with visible reviews.
export async function recomputeProductRating(productId: string) {
  const [agg] = await db
    .select({
      n: count(),
      avg: sql<string>`coalesce(round(avg(${reviews.rating}), 1), 0)`,
    })
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.hidden, false)));
  await db
    .update(products)
    .set({ reviewCount: agg.n, ratingAvg: String(agg.avg) })
    .where(eq(products.id, productId));
}

export async function getReviewsForProduct(productId: string) {
  const visible = and(eq(reviews.productId, productId), eq(reviews.hidden, false));
  const [list, breakdown] = await Promise.all([
    db.query.reviews.findMany({
      where: visible,
      orderBy: [desc(reviews.createdAt)],
      limit: 30,
      with: { user: { columns: { name: true } } },
    }),
    db
      .select({ rating: reviews.rating, n: count() })
      .from(reviews)
      .where(visible)
      .groupBy(reviews.rating),
  ]);
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    n: breakdown.find((b) => b.rating === star)?.n ?? 0,
  }));
  return { list, counts };
}

export async function getUserReview(productId: string, userId: string) {
  return db.query.reviews.findFirst({
    where: and(eq(reviews.productId, productId), eq(reviews.userId, userId)),
  });
}
