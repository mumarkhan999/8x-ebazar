import type { Metadata } from "next";
import Link from "next/link";
import { getFeaturedStores } from "@/lib/catalog";
import { StoreTile } from "@/components/store-tile";
import { PageTitle } from "@/components/ui";

export const metadata: Metadata = { title: "Stores" };

export default async function StoresPage() {
  const stores = await getFeaturedStores(100);
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageTitle eyebrow="The marketplace" title="Browse stores">
        <Link href="/sell" className="btn btn-outline btn-sm">Open your own store</Link>
      </PageTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stores.map((s) => (
          <StoreTile key={s.id} store={s} />
        ))}
      </div>
    </div>
  );
}
