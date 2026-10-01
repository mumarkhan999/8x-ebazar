import "server-only";
import { cache } from "react";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  lte,
  ne,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { db } from "@/db";
import { categories, productImages, products, stores } from "@/db/schema";

// ---------------------------------------------------------------------------
// Visibility: a product is public only if it's active AND its store is active.
// Every storefront query goes through this.
// ---------------------------------------------------------------------------
const activeStoreIds = db
  .select({ id: stores.id })
  .from(stores)
  .where(eq(stores.status, "active"));

export const isVisible = and(
  eq(products.status, "active"),
  inArray(products.storeId, activeStoreIds)
)!;

const onDeal = and(
  isNotNull(products.compareAtCents),
  sql`${products.compareAtCents} > ${products.priceCents}`
)!;

// Columns + first image: everything a product card needs.
const cardQuery = {
  columns: {
    id: true,
    slug: true,
    title: true,
    priceCents: true,
    compareAtCents: true,
    ratingAvg: true,
    reviewCount: true,
    soldCount: true,
    stock: true,
  },
  with: {
    images: {
      columns: { url: true },
      orderBy: [asc(productImages.position)],
      limit: 1,
    },
    store: { columns: { name: true, slug: true } },
  },
} satisfies Parameters<typeof db.query.products.findMany>[0];

export const SORTS = {
  newest: { label: "Newest", order: [desc(products.createdAt)] },
  popular: { label: "Best selling", order: [desc(products.soldCount), desc(products.createdAt)] },
  rating: { label: "Top rated", order: [desc(products.ratingAvg), desc(products.reviewCount)] },
  "price-asc": { label: "Price: low to high", order: [asc(products.priceCents)] },
  "price-desc": { label: "Price: high to low", order: [desc(products.priceCents)] },
} as const;

export type SortKey = keyof typeof SORTS;

export function parseSort(value: string | undefined): SortKey {
  return value && value in SORTS ? (value as SortKey) : "newest";
}

export type ListFilters = {
  q?: string;
  categoryIds?: string[];
  storeId?: string;
  minCents?: number;
  maxCents?: number;
  dealsOnly?: boolean;
  sort?: SortKey;
  page?: number;
  pageSize?: number;
};

export type ProductCardData = Awaited<ReturnType<typeof getDeals>>[number];

export async function listProducts(filters: ListFilters = {}) {
  const pageSize = filters.pageSize ?? 24;
  const page = Math.max(1, filters.page ?? 1);

  const conditions: SQL[] = [isVisible];
  if (filters.q) {
    const term = `%${filters.q.replace(/[%_]/g, "\\$&")}%`;
    conditions.push(or(ilike(products.title, term), ilike(products.description, term))!);
  }
  if (filters.categoryIds?.length) {
    conditions.push(inArray(products.categoryId, filters.categoryIds));
  }
  if (filters.storeId) conditions.push(eq(products.storeId, filters.storeId));
  if (filters.minCents != null) conditions.push(gte(products.priceCents, filters.minCents));
  if (filters.maxCents != null) conditions.push(lte(products.priceCents, filters.maxCents));
  if (filters.dealsOnly) conditions.push(onDeal);

  const where = and(...conditions);

  const [items, [{ total }]] = await Promise.all([
    db.query.products.findMany({
      ...cardQuery,
      where,
      orderBy: [...SORTS[filters.sort ?? "newest"].order, asc(products.id)],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    db.select({ total: count() }).from(products).where(where),
  ]);

  return { items, total, page, pageSize };
}

export async function getDeals(limit = 6) {
  return db.query.products.findMany({
    ...cardQuery,
    where: and(isVisible, onDeal),
    // Biggest discount first.
    orderBy: [desc(sql`(${products.compareAtCents} - ${products.priceCents})::float / ${products.compareAtCents}`)],
    limit,
  });
}

export async function getProductBySlug(slug: string) {
  return db.query.products.findFirst({
    where: and(eq(products.slug, slug), isVisible),
    with: {
      images: { orderBy: [asc(productImages.position)] },
      store: true,
      category: { with: { parent: true } },
    },
  });
}

export async function getRelatedProducts(productId: string, categoryId: string, limit = 6) {
  return db.query.products.findMany({
    ...cardQuery,
    where: and(isVisible, eq(products.categoryId, categoryId), ne(products.id, productId)),
    orderBy: [desc(products.soldCount)],
    limit,
  });
}

export async function getMoreFromStore(storeId: string, excludeId: string, limit = 6) {
  return db.query.products.findMany({
    ...cardQuery,
    where: and(isVisible, eq(products.storeId, storeId), ne(products.id, excludeId)),
    orderBy: [desc(products.soldCount)],
    limit,
  });
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const getCategoryTree = cache(async () => {
  const all = await db.query.categories.findMany({
    orderBy: [asc(categories.sortOrder), asc(categories.name)],
  });
  const roots = all.filter((c) => !c.parentId);
  return roots.map((root) => ({
    ...root,
    children: all.filter((c) => c.parentId === root.id),
  }));
});

export async function getCategoryBySlug(slug: string) {
  const tree = await getCategoryTree();
  for (const root of tree) {
    if (root.slug === slug) return { category: root, parent: null, ids: [root.id, ...root.children.map((c) => c.id)] };
    const child = root.children.find((c) => c.slug === slug);
    if (child) return { category: child, parent: root, ids: [child.id] };
  }
  return null;
}

// Sub-categories that actually have something to sell, for the home page grid.
export async function getPopularCategories(limit = 12) {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      imageUrl: categories.imageUrl,
      productCount: count(products.id),
    })
    .from(categories)
    .innerJoin(products, and(eq(products.categoryId, categories.id), isVisible))
    .where(isNotNull(categories.parentId))
    .groupBy(categories.id)
    .orderBy(desc(count(products.id)), asc(categories.name))
    .limit(limit);
  return rows;
}

export async function getLeafCategoriesForSelect() {
  const tree = await getCategoryTree();
  return tree.flatMap((root) =>
    root.children.length
      ? root.children.map((c) => ({ id: c.id, label: `${root.name} › ${c.name}` }))
      : [{ id: root.id, label: root.name }]
  );
}

// ---------------------------------------------------------------------------
// Stores (public)
// ---------------------------------------------------------------------------

export async function getActiveStoreBySlug(slug: string) {
  return db.query.stores.findFirst({
    where: and(eq(stores.slug, slug), eq(stores.status, "active")),
  });
}

export async function getStoreStats(storeId: string) {
  const [row] = await db
    .select({
      productCount: count(products.id),
      ratingAvg: sql<string>`coalesce(round(avg(nullif(${products.ratingAvg}, 0)), 1), 0)`,
      reviewCount: sql<number>`coalesce(sum(${products.reviewCount}), 0)::int`,
      soldCount: sql<number>`coalesce(sum(${products.soldCount}), 0)::int`,
    })
    .from(products)
    .where(and(eq(products.storeId, storeId), isVisible));
  return row;
}

export async function getFeaturedStores(limit = 6) {
  return db
    .select({
      id: stores.id,
      name: stores.name,
      slug: stores.slug,
      tagline: stores.tagline,
      logoUrl: stores.logoUrl,
      bannerUrl: stores.bannerUrl,
      productCount: count(products.id),
    })
    .from(stores)
    .innerJoin(products, and(eq(products.storeId, stores.id), isVisible))
    .where(eq(stores.status, "active"))
    .groupBy(stores.id)
    .orderBy(desc(count(products.id)))
    .limit(limit);
}

