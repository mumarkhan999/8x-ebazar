"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

export type CartItem = {
  productId: string;
  slug: string;
  title: string;
  imageUrl: string;
  priceCents: number;
  quantity: number;
};

const STORAGE_KEY = "8x-amazon-clone:cart";
const EMPTY_ITEMS: CartItem[] = [];

type Listener = () => void;

function createCartStore() {
  let items: CartItem[] = [];
  const listeners = new Set<Listener>();

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) items = JSON.parse(raw);
    } catch {
      // ignore malformed/blocked storage
    }
  }

  function persist() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore quota/blocked storage errors
    }
  }

  function emit() {
    persist();
    listeners.forEach((listener) => listener());
  }

  return {
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot() {
      return items;
    },
    getServerSnapshot() {
      return EMPTY_ITEMS;
    },
    addItem(item: Omit<CartItem, "quantity">, quantity = 1) {
      const existing = items.find((i) => i.productId === item.productId);
      items = existing
        ? items.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + quantity }
              : i
          )
        : [...items, { ...item, quantity }];
      emit();
    },
    removeItem(productId: string) {
      items = items.filter((i) => i.productId !== productId);
      emit();
    },
    setQuantity(productId: string, quantity: number) {
      items =
        quantity <= 0
          ? items.filter((i) => i.productId !== productId)
          : items.map((i) =>
              i.productId === productId ? { ...i, quantity } : i
            );
      emit();
    },
    clear() {
      items = [];
      emit();
    },
  };
}

type CartStore = ReturnType<typeof createCartStore>;

const CartContext = createContext<CartStore | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const store = useMemo(() => createCartStore(), []);
  return <CartContext.Provider value={store}>{children}</CartContext.Provider>;
}

export function useCart() {
  const store = useContext(CartContext);
  if (!store) throw new Error("useCart must be used within a CartProvider");

  const items = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  );

  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );
  const totalCents = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity * i.priceCents, 0),
    [items]
  );

  return {
    items,
    addItem: store.addItem,
    removeItem: store.removeItem,
    setQuantity: store.setQuantity,
    clear: store.clear,
    totalItems,
    totalCents,
  };
}
