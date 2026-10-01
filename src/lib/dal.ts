import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, stores } from "@/db/schema";

// The JWT only carries the user id. Role and store status are read from the
// database on every request, so an admin approving a store or suspending a
// seller takes effect immediately instead of waiting for the token to expire.
export const getCurrentUser = cache(async () => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
    columns: { id: true, name: true, email: true, role: true },
    with: {
      store: {
        columns: { id: true, name: true, slug: true, status: true },
      },
    },
  });
  return user ?? null;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function requireUser(callbackUrl?: string) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(
      callbackUrl
        ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
        : "/login"
    );
  }
  return user;
}

/**
 * A seller is only "live" when the account has the seller role AND their store
 * is active. Suspended or pending stores are sent to /sell, which explains
 * their status. Every seller query must be scoped by the returned store.id.
 */
export async function requireSeller() {
  const user = await requireUser("/seller");
  const store = user.store;
  if (user.role !== "seller" || !store || store.status !== "active") {
    redirect("/sell");
  }
  return { user, store };
}

export async function requireAdmin() {
  const user = await requireUser("/admin");
  if (user.role !== "admin") redirect("/");
  return user;
}

// Variants for server actions: return an error instead of redirecting, so a
// direct call to the action endpoint by an unauthorised user just fails.
export async function assertSeller() {
  const user = await getCurrentUser();
  if (!user || user.role !== "seller" || user.store?.status !== "active") {
    throw new Error("Not authorised");
  }
  return { user, store: user.store };
}

export async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") throw new Error("Not authorised");
  return user;
}

export async function getStoreForOwner(ownerId: string) {
  return db.query.stores.findFirst({ where: eq(stores.ownerId, ownerId) });
}
