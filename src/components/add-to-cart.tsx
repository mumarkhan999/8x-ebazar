"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart, type CartItem } from "@/lib/cart-context";

export function AddToCart({
  item,
  disabledReason,
}: {
  item: Omit<CartItem, "quantity">;
  disabledReason?: string;
}) {
  const { addItem, items } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const inCart = items.find((i) => i.productId === item.productId)?.quantity ?? 0;
  const max = Math.max(0, Math.min(item.stock, 20) - inCart);
  const soldOut = item.stock === 0;
  const blocked = Boolean(disabledReason) || soldOut || max === 0;

  function add() {
    addItem(item, qty);
    setAdded(true);
    setQty(1);
    setTimeout(() => setAdded(false), 2500);
  }

  return (
    <div className="space-y-4">
      {!soldOut && (
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-ink-soft">Quantity</span>
          <div className="flex items-center rounded-full border border-line-strong bg-white">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1 || blocked} className="grid h-9 w-9 place-items-center rounded-full text-lg disabled:opacity-30" aria-label="Decrease quantity">−</button>
            <span className="w-8 text-center text-sm font-bold tabular-nums">{qty}</span>
            <button type="button" onClick={() => setQty((q) => Math.min(max, q + 1))} disabled={qty >= max || blocked} className="grid h-9 w-9 place-items-center rounded-full text-lg disabled:opacity-30" aria-label="Increase quantity">+</button>
          </div>
          <span className={`text-xs font-semibold ${item.stock <= 5 ? "text-rose-600" : "text-muted"}`}>
            {item.stock <= 5 ? `Only ${item.stock} left` : `${item.stock} in stock`}
          </span>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          disabled={blocked}
          onClick={() => {
            addItem(item, qty);
            router.push("/checkout");
          }}
          className="btn btn-dark py-3"
        >
          Buy now
        </button>
        <button type="button" disabled={blocked} onClick={add} className="btn btn-primary py-3">
          {added ? "✓ Added to cart" : "Add to cart"}
        </button>
      </div>

      {(disabledReason || soldOut || (max === 0 && inCart > 0)) && (
        <p className="text-sm text-muted">
          {disabledReason ?? (soldOut ? "This item is sold out." : "You already have the maximum quantity in your cart.")}
        </p>
      )}
    </div>
  );
}
