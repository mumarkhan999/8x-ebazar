import "server-only";
import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  orderItems,
  orders,
  products,
  subOrders,
  type SubOrderStatus,
} from "@/db/schema";

const fullOrder = {
  with: {
    subOrders: {
      orderBy: [asc(subOrders.createdAt)],
      with: {
        store: { columns: { name: true, slug: true } },
        items: true,
      },
    },
  },
} satisfies Parameters<typeof db.query.orders.findMany>[0];

// ---------------------------------------------------------------------------
// Buyer
// ---------------------------------------------------------------------------

export async function getOrderForUser(orderId: string, userId: string) {
  return db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
    ...fullOrder,
  });
}

export async function getOrdersForUser(userId: string) {
  return db.query.orders.findMany({
    where: eq(orders.userId, userId),
    orderBy: [desc(orders.createdAt)],
    ...fullOrder,
  });
}

/**
 * Called from both the Stripe webhook and the confirmation page (whichever
 * lands first). The conditional `status = 'pending'` update makes it
 * idempotent: only the first caller flips the order and adjusts stock.
 */
export async function markOrderPaid(orderId: string) {
  const [flipped] = await db
    .update(orders)
    .set({ status: "paid", paidAt: new Date() })
    .where(and(eq(orders.id, orderId), eq(orders.status, "pending")))
    .returning({ id: orders.id });
  if (!flipped) return false;

  const subs = await db.query.subOrders.findMany({
    where: eq(subOrders.orderId, orderId),
    with: { items: { columns: { productId: true, quantity: true } } },
  });

  const items = subs.flatMap((s) => s.items);
  await db.batch([
    db
      .update(subOrders)
      .set({ status: "paid" })
      .where(and(eq(subOrders.orderId, orderId), eq(subOrders.status, "pending"))),
    ...items.map((item) =>
      db
        .update(products)
        .set({
          stock: sql`greatest(${products.stock} - ${item.quantity}, 0)`,
          soldCount: sql`${products.soldCount} + ${item.quantity}`,
        })
        .where(eq(products.id, item.productId))
    ),
  ]);
  return true;
}

// Has this user received this product? Gate for leaving a review.
export async function hasDeliveredPurchase(userId: string, productId: string) {
  const [row] = await db
    .select({ n: count() })
    .from(orderItems)
    .innerJoin(subOrders, eq(subOrders.id, orderItems.subOrderId))
    .innerJoin(orders, eq(orders.id, subOrders.orderId))
    .where(
      and(
        eq(orders.userId, userId),
        eq(orderItems.productId, productId),
        eq(subOrders.status, "delivered")
      )
    );
  return row.n > 0;
}

// ---------------------------------------------------------------------------
// Seller — always scoped to the seller's own store.
// ---------------------------------------------------------------------------

// What a seller may move an order to, from each state. Payment flips
// pending -> paid; the seller drives the rest.
export const SELLER_TRANSITIONS: Record<SubOrderStatus, SubOrderStatus[]> = {
  pending: [],
  paid: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export async function getSubOrdersForStore(
  storeId: string,
  status?: SubOrderStatus
) {
  return db.query.subOrders.findMany({
    where: and(
      eq(subOrders.storeId, storeId),
      status ? eq(subOrders.status, status) : inArray(subOrders.status, ["paid", "packed", "shipped", "delivered", "cancelled"])
    ),
    orderBy: [desc(subOrders.createdAt)],
    with: {
      items: true,
      order: {
        columns: { id: true, shippingName: true, createdAt: true },
        with: { user: { columns: { name: true, email: true } } },
      },
    },
  });
}

export async function getSubOrderForStore(subOrderId: string, storeId: string) {
  return db.query.subOrders.findFirst({
    where: and(eq(subOrders.id, subOrderId), eq(subOrders.storeId, storeId)),
    with: {
      items: true,
      order: {
        columns: {
          id: true,
          shippingName: true,
          shippingPhone: true,
          shippingAddress: true,
          createdAt: true,
        },
        with: { user: { columns: { name: true, email: true } } },
      },
    },
  });
}

export async function getSellerStats(storeId: string) {
  const [orderStats, productStats] = await Promise.all([
    db
      .select({
        status: subOrders.status,
        n: count(),
        revenue: sql<number>`coalesce(sum(${subOrders.subtotalCents}), 0)::int`,
      })
      .from(subOrders)
      .where(eq(subOrders.storeId, storeId))
      .groupBy(subOrders.status),
    db
      .select({
        status: products.status,
        n: count(),
        lowStock: sql<number>`count(*) filter (where ${products.stock} <= 5)::int`,
      })
      .from(products)
      .where(eq(products.storeId, storeId))
      .groupBy(products.status),
  ]);

  const by = (s: SubOrderStatus) => orderStats.find((r) => r.status === s);
  const revenue = orderStats
    .filter((r) => r.status !== "pending" && r.status !== "cancelled")
    .reduce((sum, r) => sum + r.revenue, 0);

  return {
    revenueCents: revenue,
    toFulfil: (by("paid")?.n ?? 0) + (by("packed")?.n ?? 0),
    inTransit: by("shipped")?.n ?? 0,
    delivered: by("delivered")?.n ?? 0,
    activeProducts: productStats.find((r) => r.status === "active")?.n ?? 0,
    draftProducts: productStats.find((r) => r.status === "draft")?.n ?? 0,
    blockedProducts: productStats.find((r) => r.status === "blocked")?.n ?? 0,
    lowStock: productStats.reduce((sum, r) => sum + r.lowStock, 0),
  };
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export async function getAllOrders(limit = 100) {
  return db.query.orders.findMany({
    orderBy: [desc(orders.createdAt)],
    limit,
    with: {
      user: { columns: { name: true, email: true } },
      subOrders: {
        columns: { id: true, status: true, subtotalCents: true },
        with: { store: { columns: { name: true } } },
      },
    },
  });
}
