import type { Metadata } from "next";
import { PageTitle } from "@/components/ui";
import { CartView } from "./cart-view";

export const metadata: Metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageTitle title="Your cart" />
      <CartView />
    </div>
  );
}
