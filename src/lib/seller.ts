import "server-only";
import { and, asc, desc, eq, ilike, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { productImages, products, type ProductStatus } from "@/db/schema";

// Every query here takes the seller's storeId from dal.requireSeller() —
// never from the request — so a seller only ever sees their own data.

export async function listStoreProducts(storeId: string, { q, status }: { q?: string; status?: ProductStatus } = {}) {
  const conditions: SQL[] = [eq(products.storeId, storeId)];
  if (status) conditions.push(eq(products.status, status));
  if (q) conditions.push(ilike(products.title, `%${q.replace(/[%_]/g, "\\$&")}%`));
  return db.query.products.findMany({
    where: and(...conditions),
    orderBy: [desc(products.updatedAt)],
    with: {
      images: { columns: { url: true }, orderBy: [asc(productImages.position)], limit: 1 },
      category: { columns: { name: true } },
    },
  });
}

export async function getStoreProduct(productId: string, storeId: string) {
  return db.query.products.findFirst({
    where: and(eq(products.id, productId), eq(products.storeId, storeId)),
    with: { images: { orderBy: [asc(productImages.position)] } },
  });
}
