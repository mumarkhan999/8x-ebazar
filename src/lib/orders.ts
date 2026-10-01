import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";

export async function getOrderForUser(orderId: string, userId: string) {
  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
  });
  if (!order) return null;

  const items = await db.query.orderItems.findMany({
    where: eq(orderItems.orderId, order.id),
  });

  return { order, items };
}

export async function getOrdersForUser(userId: string) {
  return db.query.orders.findMany({
    where: eq(orders.userId, userId),
    orderBy: [desc(orders.createdAt)],
  });
}

export async function markOrderPaid(orderId: string) {
  await db.update(orders).set({ status: "paid" }).where(eq(orders.id, orderId));
}
