import "server-only";
import { and, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";

export async function getProducts({
  q,
  category,
}: {
  q?: string;
  category?: string;
} = {}) {
  const conditions = [];
  if (q) {
    conditions.push(
      or(
        ilike(products.title, `%${q}%`),
        ilike(products.description, `%${q}%`),
        ilike(products.category, `%${q}%`)
      )
    );
  }
  if (category) {
    conditions.push(eq(products.category, category));
  }

  return db.query.products.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    orderBy: (products, { desc }) => [desc(products.createdAt)],
  });
}

export async function getProductBySlug(slug: string) {
  return db.query.products.findFirst({ where: eq(products.slug, slug) });
}

export async function getProductsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  return db.query.products.findMany({
    where: (products, { inArray }) => inArray(products.id, ids),
  });
}

export async function getCategories() {
  const rows = await db
    .selectDistinct({ category: products.category })
    .from(products);
  return rows.map((r) => r.category).sort();
}
