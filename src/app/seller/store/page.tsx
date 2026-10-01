import type { Metadata } from "next";
import { requireSeller, getStoreForOwner } from "@/lib/dal";
import { updateStore } from "@/lib/actions/store";
import { StoreForm } from "@/components/store-form";
import { PageTitle } from "@/components/ui";

export const metadata: Metadata = { title: "Store profile · Seller Center" };

export default async function SellerStorePage() {
  const { user } = await requireSeller();
  const store = (await getStoreForOwner(user.id))!;
  return (
    <div className="max-w-3xl">
      <PageTitle eyebrow="Seller Center" title="Store profile">
        <a href={`/store/${store.slug}`} className="btn btn-outline btn-sm">View public page ↗</a>
      </PageTitle>
      <div className="card p-6">
        <StoreForm action={updateStore} defaults={store} submitLabel="Save profile" />
      </div>
    </div>
  );
}
