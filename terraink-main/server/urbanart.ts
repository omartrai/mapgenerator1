import {
  DEFAULT_MARGIN_PERCENT,
  toCollectionMockups,
  toCollectionProduct,
  type CollectionMockup,
  type CollectionProduct,
} from "../src/features/store/domain/collection.js";

/**
 * Read-only client for the UrbanArt reseller API (catalogue + mockups).
 * The key stays on the server (URBANART_API_KEY); responses are cached for a
 * few minutes so the shop stays fast and well under the 120 requests/minute
 * limit, while prices still refresh regularly as UrbanArt asks.
 */
const DEFAULT_BASE_URL = "https://urbanart.ma/wp-json/urbanart/v1";
const CACHE_MS = 10 * 60 * 1000;
const TIMEOUT_MS = 8000;
/** Mockups shown on each card: the cover and the hover view. */
const CARD_MOCKUPS = 2;
/** Parallel mockup requests while building the list (rate limit: 120/min). */
const MOCKUP_CONCURRENCY = 4;

interface Cached<T> {
  at: number;
  value: T;
}

export interface UrbanArtCatalog {
  listProducts(): Promise<CollectionProduct[]>;
  getProduct(id: number): Promise<{ product: CollectionProduct; mockups: CollectionMockup[] } | null>;
  /** Status of one of our orders at urbanArt, by its id or reference. */
  getOrderStatus(reference: string): Promise<{ status: string; reference: string } | null>;
}

/** urbanArt orders are re-read at most this often per reference. */
const ORDER_CACHE_MS = 2 * 60 * 1000;

export function createUrbanArtCatalog(env: Record<string, string | undefined>): UrbanArtCatalog | null {
  const apiKey = String(env.URBANART_API_KEY ?? "").trim();
  if (!apiKey) return null;
  const baseUrl = (String(env.URBANART_API_URL ?? "").trim() || DEFAULT_BASE_URL).replace(/\/+$/, "");
  // Selling price = reseller cost + this margin (%), for every product.
  // URBANART_MARGIN_PERCENT=dashboard keeps the prices set per product there.
  const marginSetting = String(env.URBANART_MARGIN_PERCENT ?? "").trim();
  const marginPercent =
    marginSetting.toLowerCase() === "dashboard"
      ? undefined
      : Number.isFinite(Number(marginSetting)) && marginSetting !== ""
        ? Math.max(0, Number(marginSetting))
        : DEFAULT_MARGIN_PERCENT;

  let products: Cached<CollectionProduct[]> | null = null;
  let pending: Promise<CollectionProduct[]> | null = null;
  const mockups = new Map<number, Cached<CollectionMockup[]>>();

  async function call(path: string): Promise<unknown> {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`UrbanArt ${path} answered ${response.status}`);
    }
    const body = (await response.json()) as { data?: unknown };
    return body?.data;
  }

  async function listProducts(): Promise<CollectionProduct[]> {
    if (products && Date.now() - products.at < CACHE_MS) return products.value;
    pending ??= call("/products")
      .then(async (data) => {
        const value = (Array.isArray(data) ? data : [])
          .map((raw) => toCollectionProduct(raw, marginPercent))
          .filter((product): product is CollectionProduct => product !== null);
        await attachCardMockups(value);
        products = { at: Date.now(), value };
        return value;
      })
      .catch((error) => {
        // Keep showing the last good catalogue if UrbanArt is briefly down.
        if (products) return products.value;
        throw error;
      })
      .finally(() => {
        pending = null;
      });
    return pending;
  }

  async function getMockups(id: number): Promise<CollectionMockup[]> {
    const cached = mockups.get(id);
    if (cached && Date.now() - cached.at < CACHE_MS) return cached.value;
    try {
      const value = toCollectionMockups(await call(`/products/${id}/mockups`));
      mockups.set(id, { at: Date.now(), value });
      return value;
    } catch (error) {
      if (cached) return cached.value;
      console.warn("[urbanart] mockups unavailable", error);
      return [];
    }
  }

  /** Adds the first mockups to each product, a few requests at a time. */
  async function attachCardMockups(list: CollectionProduct[]) {
    let next = 0;
    const worker = async () => {
      while (next < list.length) {
        const product = list[next++];
        const all = (await getMockups(product.id)).map((mockup) => mockup.url);
        // Cover = first mockup; hover = one from the middle of the set, which is
        // usually a different room (neighbouring mockups often only change the frame).
        product.mockups = all.length > 2 ? [all[0], all[Math.floor(all.length / 2)]] : all.slice(0, CARD_MOCKUPS);
      }
    };
    await Promise.all(Array.from({ length: Math.min(MOCKUP_CONCURRENCY, list.length) }, worker));
  }

  const orderStatuses = new Map<string, Cached<{ status: string; reference: string } | null>>();

  return {
    listProducts,
    async getOrderStatus(reference) {
      const key = reference.trim();
      if (!/^[A-Za-z0-9_-]{2,80}$/.test(key)) return null;
      const cached = orderStatuses.get(key);
      if (cached && Date.now() - cached.at < ORDER_CACHE_MS) return cached.value;
      try {
        const data = (await call(`/orders/${encodeURIComponent(key)}`)) as Record<string, unknown> | undefined;
        const value =
          data && typeof data.status === "string"
            ? { status: data.status, reference: String(data.reference ?? key) }
            : null;
        orderStatuses.set(key, { at: Date.now(), value });
        return value;
      } catch (error) {
        if (/404/.test(String(error))) {
          orderStatuses.set(key, { at: Date.now(), value: null });
          return null;
        }
        throw error;
      }
    },
    async getProduct(id) {
      const product = (await listProducts()).find((entry) => entry.id === id);
      if (!product) return null;
      return { product, mockups: await getMockups(id) };
    },
  };
}
