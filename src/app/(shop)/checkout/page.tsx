import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { PageTitle } from "@/components/ui";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await requireUser("/checkout");
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageTitle title="Checkout" />
      <CheckoutForm defaultName={user.name} />
    </div>
  );
}
