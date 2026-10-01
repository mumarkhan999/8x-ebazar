import { requireAdmin } from "@/lib/dal";
import { getAdminStats } from "@/lib/admin";
import { ConsoleShell } from "@/components/console-shell";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();
  const stats = await getAdminStats();

  return (
    <ConsoleShell
      badge="Admin"
      userName={user.name}
      context={
        <>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Marketplace</p>
          <p className="text-sm font-bold">{stats.activeStores} live stores</p>
        </>
      }
      nav={[
        { href: "/admin", label: "Overview" },
        { href: "/admin/stores", label: "Stores", count: stats.pendingStores },
        { href: "/admin/products", label: "Products" },
        { href: "/admin/categories", label: "Categories" },
        { href: "/admin/reviews", label: "Reviews" },
        { href: "/admin/orders", label: "Orders" },
        { href: "/admin/users", label: "Users" },
      ]}
    >
      {children}
    </ConsoleShell>
  );
}
