import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { getOrderForUser, markOrderPaid } from "@/lib/orders";
import { stripe } from "@/lib/stripe";
import { formatPrice, shortId } from "@/lib/format";
import { ClearCartOnMount } from "@/components/clear-cart-on-mount";

export const metadata: Metadata = { title: "Order confirmed" };

export default async function OrderConfirmedPage(props: PageProps<"/order/confirmed">) {
  const { orderId, session_id: sessionId } = await props.searchParams;
  const user = await requireUser();
  if (typeof orderId !== "string") notFound();

  let order = await getOrderForUser(orderId, user.id);
  if (!order) notFound();

  // Self-heal: if the webhook hasn't landed yet, confirm directly with Stripe
  // (only for the session that belongs to this order).
  if (order.status === "pending" && typeof sessionId === "string" && sessionId === order.stripeSessionId) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === "paid") {
      await markOrderPaid(order.id);
      order = (await getOrderForUser(orderId, user.id))!;
    }
  }

  const paid = order.status === "paid";

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {paid && <ClearCartOnMount />}
      <div className="card overflow-hidden">
        <div className={`${paid ? "bg-weave" : "bg-saffron-100"} px-6 py-8 text-center`}>
          <div className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${paid ? "bg-white text-jade-600" : "bg-white text-saffron-700"}`}>
            {paid ? (
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 12 5 5L20 7" /></svg>
            ) : (
              <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-current border-r-transparent" />
            )}
          </div>
          <h1 className={`mt-4 text-2xl font-extrabold ${paid ? "text-white" : ""}`}>
            {paid ? "Thank you — your order is placed!" : "Waiting for payment confirmation"}
          </h1>
          <p className={`mt-1 text-sm ${paid ? "text-white/80" : "text-ink-soft"}`}>
            Order #{shortId(order.id)} · {formatPrice(order.totalCents)}
          </p>
        </div>

        <div className="space-y-4 p-6">
          {order.subOrders.length > 1 && (
            <p className="text-sm text-ink-soft">
              Your order is being fulfilled by <strong>{order.subOrders.length} stores</strong>. Each one ships its own package — you can track them separately.
            </p>
          )}
          {order.subOrders.map((sub) => (
            <div key={sub.id} className="rounded-xl border border-line p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-jade-700">{sub.store.name}</p>
              <ul className="mt-2 space-y-1 text-sm">
                {sub.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3">
                    <span className="line-clamp-1">{item.quantity} × {item.titleSnapshot}</span>
                    <span className="shrink-0 font-semibold">{formatPrice(item.priceCentsSnapshot * item.quantity)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href={`/account/orders/${order.id}`} className="btn btn-primary">Track this order</Link>
            <Link href="/" className="btn btn-outline">Continue shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
