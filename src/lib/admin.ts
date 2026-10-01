import "server-only";
import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  categories,
  orders,
  productImages,
  products,
  reviews,
  stores,
  users,
  type ProductStatus,
  type StoreStatus,
} from "@/db/schema";

export async function getAdminStats() {
  const [storeRows, [userRow], [orderRow], [productRow]] = await Promise.all([
    db.select({ status: stores.status, n: count() }).from(stores).groupBy(stores.status),
    db.select({ n: count() }).from(users),
    db
      .select({
        n: count(),
        gmv: sql<number>`coalesce(sum(${orders.totalCents}) filter (where ${orders.status} = 'paid'), 0)::int`,
        paid: sql<number>`count(*) filter (where ${orders.status} = 'paid')::int`,
      })
      .from(orders),
    db
      .select({
        n: count(),
        blocked: sql<number>`count(*) filter (where ${products.status} = 'blocked')::int`,
      })
      .from(products),
  ]);
  const store = (s: StoreStatus) => storeRows.find((r) => r.status === s)?.n ?? 0;
  return {
    pendingStores: store("pending"),
    activeStores: store("active"),
    suspendedStores: store("suspended"),
    users: userRow.n,
    paidOrders: orderRow.paid,
    gmvCents: orderRow.gmv,
    products: productRow.n,
    blockedProducts: productRow.blocked,
  };
}

export async function listStoresForAdmin(status?: StoreStatus) {
  return db.query.stores.findMany({
    where: status ? eq(stores.status, status) : undefined,
    orderBy: [
      // Pending applications first, oldest first so nobody waits forever.
      sql`case ${stores.status} when 'pending' then 0 else 1 end`,
      asc(stores.createdAt),
    ],
    with: { owner: { columns: { name: true, email: true } } },
  });
}

export async function listProductsForAdmin({ q, status }: { q?: string; status?: ProductStatus }) {
  const conditions = [];
  if (status) conditions.push(eq(products.status, status));
  if (q) {
    const term = `%${q.replace(/[%_]/g, "\\$&")}%`;
    conditions.push(or(ilike(products.title, term), ilike(products.slug, term))!);
  }
  return db.query.products.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    orderBy: [desc(products.createdAt)],
    limit: 100,
    columns: {
      id: true,
      slug: true,
      title: true,
      status: true,
      priceCents: true,
      stock: true,
      createdAt: true,
    },
    with: {
      store: { columns: { name: true, slug: true, status: true } },
      images: { columns: { url: true }, orderBy: [asc(productImages.position)], limit: 1 },
    },
  });
}

export async function listReviewsForAdmin(filter: "all" | "hidden" | "low") {
  return db.query.reviews.findMany({
    where:
      filter === "hidden"
        ? eq(reviews.hidden, true)
        : filter === "low"
          ? sql`${reviews.rating} <= 2`
          : undefined,
    orderBy: [desc(reviews.createdAt)],
    limit: 100,
    with: {
      user: { columns: { name: true, email: true } },
      product: { columns: { title: true, slug: true } },
    },
  });
}

export async function listCategoriesForAdmin() {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      parentId: categories.parentId,
      imageUrl: categories.imageUrl,
      sortOrder: categories.sortOrder,
      productCount: count(products.id),
    })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
  const roots = rows.filter((r) => !r.parentId);
  return roots.map((root) => ({
    ...root,
    children: rows.filter((r) => r.parentId === root.id),
  }));
}

export async function listUsersForAdmin() {
  return db.query.users.findMany({
    orderBy: [desc(users.createdAt)],
    limit: 200,
    columns: { id: true, name: true, email: true, role: true, createdAt: true },
    with: { store: { columns: { name: true, slug: true, status: true } } },
  });
}
