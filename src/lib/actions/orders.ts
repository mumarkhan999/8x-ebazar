"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { subOrders, subOrderStatus, type SubOrderStatus } from "@/db/schema";
import { assertSeller } from "@/lib/dal";
import { SELLER_TRANSITIONS } from "@/lib/orders";

export async function updateSubOrderStatus(subOrderId: string, next: SubOrderStatus) {
  const { store } = await assertSeller();
  if (!subOrderStatus.enumValues.includes(next)) throw new Error("Invalid status");

  const sub = await db.query.subOrders.findFirst({
    where: and(eq(subOrders.id, subOrderId), eq(subOrders.storeId, store.id)),
    columns: { id: true, status: true, orderId: true },
  });
  if (!sub) throw new Error("Order not found");

  if (!SELLER_TRANSITIONS[sub.status].includes(next)) {
    throw new Error(`Can't move an order from ${sub.status} to ${next}.`);
  }

  // Compare-and-set on the current status so two tabs can't race each other.
  await db
    .update(subOrders)
    .set({ status: next })
    .where(and(eq(subOrders.id, sub.id), eq(subOrders.storeId, store.id), eq(subOrders.status, sub.status)));

  revalidatePath("/seller/orders");
  revalidatePath(`/seller/orders/${sub.id}`);
  revalidatePath(`/account/orders/${sub.orderId}`);
}
