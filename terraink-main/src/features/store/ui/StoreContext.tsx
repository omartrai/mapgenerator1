import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cartStorage, collectionApi } from "@/core/services";
import {
  DEFAULT_PRODUCT,
  applyFramedPrices,
  MAX_QUANTITY_PER_ITEM,
  computeTotals,
  type OrderTotals,
  type ProductOptions,
} from "../domain/catalog";
import type { CartItem, LastOrderRef } from "../domain/cart";

export type StudioScene = "studio" | "wall";

/** When set, the studio is generating print files for an existing order. */
export interface AdminTask {
  orderNumber: string;
  itemId: string;
}

interface StoreContextValue {
  cart: CartItem[];
  cartCount: number;
  totals: OrderTotals;
  product: ProductOptions;
  setProduct: (next: Partial<ProductOptions>) => void;
  editingItemId: string | null;
  setEditingItemId: (id: string | null) => void;
  addItem: (item: CartItem) => void;
  replaceItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  lastAdded: CartItem | null;
  dismissLastAdded: () => void;
  lastOrder: LastOrderRef | null;
  rememberOrder: (order: LastOrderRef) => void;
  scene: StudioScene;
  setScene: (scene: StudioScene) => void;
  hasStartedDesign: boolean;
  markDesignStarted: () => void;
  adminTask: AdminTask | null;
  setAdminTask: (task: AdminTask | null) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => cartStorage.loadCart());
  const [product, setProductState] = useState<ProductOptions>(DEFAULT_PRODUCT);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [lastAdded, setLastAdded] = useState<CartItem | null>(null);
  const [lastOrder, setLastOrder] = useState<LastOrderRef | null>(() =>
    cartStorage.loadLastOrder(),
  );
  const [scene, setScene] = useState<StudioScene>("studio");
  const [hasStartedDesign, setHasStartedDesign] = useState(false);
  const [adminTask, setAdminTask] = useState<AdminTask | null>(null);
  // Framed studio prices follow the collection's live prices; re-render once loaded.
  const [pricesVersion, setPricesVersion] = useState(0);
  useEffect(() => {
    let alive = true;
    collectionApi
      .studioPrices()
      .then(({ framed }) => {
        if (alive && applyFramedPrices(framed)) setPricesVersion((version) => version + 1);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    cartStorage.saveCart(cart);
  }, [cart]);

  const setProduct = useCallback((next: Partial<ProductOptions>) => {
    setProductState((prev) => ({ ...prev, ...next }));
  }, []);

  const addItem = useCallback((item: CartItem) => {
    setCart((prev) => [...prev, item]);
    setLastAdded(item);
  }, []);

  const replaceItem = useCallback((item: CartItem) => {
    setCart((prev) => {
      const exists = prev.some((entry) => entry.id === item.id);
      return exists ? prev.map((entry) => (entry.id === item.id ? item : entry)) : [...prev, item];
    });
    setLastAdded(item);
  }, []);

  const removeItem = useCallback((id: string) => {
    setCart((prev) => prev.filter((entry) => entry.id !== id));
    setEditingItemId((current) => (current === id ? null : current));
  }, []);

  const setQuantity = useCallback((id: string, quantity: number) => {
    const clamped = Math.max(1, Math.min(MAX_QUANTITY_PER_ITEM, Math.round(quantity)));
    setCart((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, quantity: clamped } : entry)),
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setEditingItemId(null);
  }, []);

  const rememberOrder = useCallback((order: LastOrderRef) => {
    setLastOrder(order);
    cartStorage.saveLastOrder(order);
  }, []);

  const value = useMemo<StoreContextValue>(
    () => ({
      cart,
      cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
      totals: computeTotals(cart),
      product,
      setProduct,
      editingItemId,
      setEditingItemId,
      addItem,
      replaceItem,
      removeItem,
      setQuantity,
      clearCart,
      lastAdded,
      dismissLastAdded: () => setLastAdded(null),
      lastOrder,
      rememberOrder,
      scene,
      setScene,
      hasStartedDesign,
      markDesignStarted: () => setHasStartedDesign(true),
      adminTask,
      setAdminTask,
    }),
    [
      pricesVersion,
      cart,
      product,
      setProduct,
      editingItemId,
      addItem,
      replaceItem,
      removeItem,
      setQuantity,
      clearCart,
      lastAdded,
      lastOrder,
      rememberOrder,
      scene,
      hasStartedDesign,
      adminTask,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within a StoreProvider");
  return ctx;
}
