import type { CartItem, LastOrderRef } from "../domain/cart";

const CART_KEY = "maploom.cart.v1";
const LAST_ORDER_KEY = "maploom.lastOrder.v1";
const CUSTOMER_KEY = "maploom.customer.v1";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // Storage full or blocked (private mode): the cart still works in memory.
    return false;
  }
}

export const cartStorage = {
  loadCart: (): CartItem[] => {
    const items = read<CartItem[]>(CART_KEY, []);
    return Array.isArray(items) ? items : [];
  },
  saveCart: (items: CartItem[]) => write(CART_KEY, items),
  loadLastOrder: (): LastOrderRef | null => read<LastOrderRef | null>(LAST_ORDER_KEY, null),
  saveLastOrder: (order: LastOrderRef) => write(LAST_ORDER_KEY, order),
  loadCustomerDraft: <T,>(fallback: T): T => read<T>(CUSTOMER_KEY, fallback),
  saveCustomerDraft: (value: unknown) => write(CUSTOMER_KEY, value),
};
