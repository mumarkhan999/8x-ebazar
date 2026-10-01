import type { Metadata } from "next";
import { requireAdmin } from "@/lib/dal";
import { getAllOrders } from "@/lib/orders";
import { formatDate, formatPrice, shortId } from "@/lib/format";
import { PageTitle, StatusBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Orders · Admin" };

export default async function AdminOrdersPage() {
  await requireAdmin();
  const orders = await getAllOrders();

  return (
    <div>
      <PageTitle eyebrow="Admin console" title="Orders" />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th className="px-5 py-3 font-semibold">Order</th>
              <th className="px-3 py-3 font-semibold">Customer</th>
              <th className="px-3 py-3 font-semibold">Payment</th>
              <th className="px-3 py-3 font-semibold">Fulfilment by store</th>
              <th className="px-5 py-3 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.map((o) => (
              <tr key={o.id} className="align-top hover:bg-paper/50">
                <td className="px-5 py-3">
                  <p className="font-semibold">#{shortId(o.id)}</p>
                  <p className="text-xs text-muted">{formatDate(o.createdAt)}</p>
                </td>
                <td className="px-3 py-3">
                  <p>{o.user.name}</p>
                  <p className="text-xs text-muted">{o.user.email}</p>
                </td>
                <td className="px-3 py-3"><StatusBadge status={o.status} /></td>
                <td className="px-3 py-3">
                  <ul className="space-y-1">
                    {o.subOrders.map((s) => (
                      <li key={s.id} className="flex items-center gap-2 text-xs">
                        <span className="min-w-0 truncate">{s.store.name}</span>
                        <StatusBadge status={s.status} />
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="px-5 py-3 text-right font-bold">{formatPrice(o.totalCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
