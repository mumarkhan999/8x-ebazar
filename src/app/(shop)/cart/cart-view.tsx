"use client";

import Link from "next/link";
import { useCart, type CartItem } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";
import { ProductImage } from "@/components/product-image";
import { EmptyState } from "@/components/ui";

export function groupByStore(items: CartItem[]) {
  const groups = new Map<string, { storeName: string; storeSlug: string; items: CartItem[] }>();
  for (const item of items) {
    const g = groups.get(item.storeSlug) ?? { storeName: item.storeName, storeSlug: item.storeSlug, items: [] };
    g.items.push(item);
    groups.set(item.storeSlug, g);
  }
  return [...groups.values()];
}

export function CartView() {
  const { items, setQuantity, removeItem, totalCents, totalItems } = useCart();

  if (items.length === 0) {
    return <EmptyState title="Your cart is empty" body="Browse the stores and add something you like." action={{ href: "/", label: "Start shopping" }} />;
  }

  const groups = groupByStore(items);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        {groups.map((g) => (
          <section key={g.storeSlug} className="card overflow-hidden">
            <header className="flex items-center justify-between border-b border-line bg-paper/60 px-5 py-3">
              <Link href={`/store/${g.storeSlug}`} className="flex items-center gap-2 text-sm font-bold hover:text-jade-700">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-jade-600 text-[11px] text-white">{g.storeName.charAt(0)}</span>
                {g.storeName}
              </Link>
              <span className="text-xs text-muted">Ships separately</span>
            </header>
            <ul className="divide-y divide-line">
              {g.items.map((item) => (
                <li key={item.productId} className="flex gap-4 p-5">
                  <Link href={`/product/${item.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-paper">
                    <ProductImage src={item.imageUrl} alt={item.title} width={200} />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <Link href={`/product/${item.slug}`} className="line-clamp-2 text-sm font-medium hover:text-jade-700">{item.title}</Link>
                      <p className="mt-1 text-sm font-bold">{formatPrice(item.priceCents)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="sr-only" htmlFor={`qty-${item.productId}`}>Quantity</label>
                      <select
                        id={`qty-${item.productId}`}
                        value={item.quantity}
                        onChange={(e) => setQuantity(item.productId, Number(e.target.value))}
                        className="input !w-20 !py-1.5"
                      >
                        {Array.from({ length: Math.max(1, Math.min(item.stock, 20)) }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                      <button type="button" onClick={() => removeItem(item.productId)} className="text-xs font-semibold text-muted hover:text-rose-600">
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <aside className="card h-fit space-y-4 p-5 lg:sticky lg:top-36">
        <h2 className="font-extrabold">Summary</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Items ({totalItems})</dt>
            <dd>{formatPrice(totalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Shipping</dt>
            <dd className="font-semibold text-jade-700">Free</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-base font-extrabold">
            <dt>Total</dt>
            <dd>{formatPrice(totalCents)}</dd>
          </div>
        </dl>
        {groups.length > 1 && (
          <p className="rounded-xl bg-jade-50 px-3 py-2 text-xs text-jade-800">
            Your cart has items from {groups.length} stores. You&apos;ll pay once; each store ships its own package.
          </p>
        )}
        <Link href="/checkout" className="btn btn-primary w-full py-3">Proceed to checkout</Link>
      </aside>
    </div>
  );
}
