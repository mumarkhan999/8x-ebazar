import { requireSeller } from "@/lib/dal";
import { getSellerStats } from "@/lib/orders";
import { ConsoleShell } from "@/components/console-shell";

export default async function SellerLayout({ children }: LayoutProps<"/seller">) {
  // Gate for the whole section: role = seller AND store active, else -> /sell.
  const { user, store } = await requireSeller();
  const stats = await getSellerStats(store.id);

  return (
    <ConsoleShell
      badge="Seller"
      userName={user.name}
      context={
        <>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Your store</p>
          <a href={`/store/${store.slug}`} className="block truncate text-sm font-bold hover:text-jade-700">{store.name} ↗</a>
        </>
      }
      nav={[
        { href: "/seller", label: "Dashboard" },
        { href: "/seller/orders", label: "Orders", count: stats.toFulfil },
        { href: "/seller/products", label: "Products" },
        { href: "/seller/store", label: "Store profile" },
      ]}
    >
      {children}
    </ConsoleShell>
  );
}
