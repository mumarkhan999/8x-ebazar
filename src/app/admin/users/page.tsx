import type { Metadata } from "next";
import { requireAdmin } from "@/lib/dal";
import { listUsersForAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/format";
import { PageTitle, StatusBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Users · Admin" };

export default async function AdminUsersPage() {
  await requireAdmin();
  const users = await listUsersForAdmin();

  return (
    <div>
      <PageTitle eyebrow="Admin console" title="Users" />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-3 py-3 font-semibold">Role</th>
              <th className="px-3 py-3 font-semibold">Store</th>
              <th className="px-5 py-3 text-right font-semibold">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-paper/50">
                <td className="px-5 py-3">
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-muted">{u.email}</p>
                </td>
                <td className="px-3 py-3"><StatusBadge status={u.role} /></td>
                <td className="px-3 py-3">
                  {u.store ? (
                    <span className="flex items-center gap-2">
                      {u.store.name} <StatusBadge status={u.store.status} />
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="px-5 py-3 text-right text-muted">{formatDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
