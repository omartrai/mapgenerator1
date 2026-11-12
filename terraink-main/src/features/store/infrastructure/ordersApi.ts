import type {
  CreateOrderInput,
  Order,
  OrderSummaryRow,
  PublicOrder,
} from "../domain/order";
import type { CollectionMockup, CollectionProduct } from "../domain/collection";
import type { FramedPriceTable } from "../domain/catalog";
import type { Review, ReviewInput, ReviewStatus, ReviewSummary } from "../domain/review";

const API_BASE = "/api";
const ADMIN_TOKEN_KEY = "maploom.admin.token";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: { fields?: Record<string, string> },
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, init);
  } catch {
    throw new ApiError(0, "We couldn't reach the server. Check your connection and try again.");
  }
  const text = await response.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  if (!response.ok) {
    throw new ApiError(
      response.status,
      body?.error ?? `Request failed (${response.status}).`,
      body?.details,
    );
  }
  return body as T;
}

/* ── Collection (ready-made posters from the print partner) ── */

export const collectionApi = {
  list: () => request<{ products: CollectionProduct[]; configured: boolean }>("/collection"),
  studioPrices: () => request<{ framed: FramedPriceTable | null }>("/studio-prices"),
  get: (id: number) =>
    request<{ product: CollectionProduct; mockups: CollectionMockup[] }>(`/collection/${id}`),
};

/* ── Reviews ── */

export const reviewsApi = {
  list: () => request<ReviewSummary>("/reviews"),
  forOrder: (number: string, accessKey: string) =>
    request<{ review: Omit<Review, "orderNumber"> | null }>(
      `/orders/${encodeURIComponent(number)}/review?key=${encodeURIComponent(accessKey)}`,
    ),
  submit: (number: string, accessKey: string, input: ReviewInput) =>
    request<{ review: Omit<Review, "orderNumber"> }>(
      `/orders/${encodeURIComponent(number)}/review?key=${encodeURIComponent(accessKey)}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
    ),
};

/* ── Customer ── */

export const ordersApi = {
  createOrder: (input: CreateOrderInput) =>
    request<{ order: PublicOrder; accessKey: string }>("/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),

  getOrder: (number: string, accessKey: string) =>
    request<{ order: PublicOrder }>(
      `/orders/${encodeURIComponent(number)}?key=${encodeURIComponent(accessKey)}`,
    ),

  previewUrl: (number: string, fileName: string, accessKey: string) =>
    `${API_BASE}/orders/${encodeURIComponent(number)}/files/${encodeURIComponent(fileName)}?key=${encodeURIComponent(accessKey)}`,
};

/* ── Admin ── */

function readAdminToken(): string {
  try {
    return window.sessionStorage.getItem(ADMIN_TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

function adminHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return { Authorization: `Bearer ${readAdminToken()}`, ...extra };
}

export const adminApi = {
  hasSession: () => readAdminToken() !== "",

  async signIn(password: string) {
    try {
      window.sessionStorage.setItem(ADMIN_TOKEN_KEY, password);
    } catch {
      // ignore — the request below still validates the password
    }
    try {
      return await request<{ ok: boolean; storage: string; fulfillment: string }>(
        "/admin/session",
        { headers: adminHeaders() },
      );
    } catch (error) {
      adminApi.signOut();
      throw error;
    }
  },

  signOut() {
    try {
      window.sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    } catch {
      // ignore
    }
  },

  session: () =>
    request<{ ok: boolean; storage: string; fulfillment: string }>("/admin/session", {
      headers: adminHeaders(),
    }),

  listReviews: () => request<{ reviews: Review[] }>("/admin/reviews", { headers: adminHeaders() }),

  setReviewStatus: (id: string, status: ReviewStatus) =>
    request<{ review: Review }>(`/admin/reviews/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: adminHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ status }),
    }),

  listOrders: () =>
    request<{ orders: OrderSummaryRow[] }>("/admin/orders", { headers: adminHeaders() }),

  getOrder: (number: string) =>
    request<{ order: Order }>(`/admin/orders/${encodeURIComponent(number)}`, {
      headers: adminHeaders(),
    }),

  updateOrder: (number: string, patch: Record<string, unknown>) =>
    request<{ order: Order }>(`/admin/orders/${encodeURIComponent(number)}`, {
      method: "PATCH",
      headers: adminHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(patch),
    }),

  /** Fetches a stored file with admin auth and returns it as a Blob. */
  async fetchFile(number: string, fileName: string): Promise<Blob> {
    const response = await fetch(
      `${API_BASE}/admin/orders/${encodeURIComponent(number)}/files/${encodeURIComponent(fileName)}`,
      { headers: adminHeaders() },
    );
    if (!response.ok) throw new ApiError(response.status, "Could not load the file.");
    return response.blob();
  },

  /**
   * Stores a generated print file with the order. Large files go straight
   * to Vercel Blob with a short-lived upload token; the local dev server
   * accepts them directly.
   */
  async uploadPrintFile(
    number: string,
    itemId: string,
    fileName: string,
    blob: Blob,
    label: string,
    onProgress?: (percent: number) => void,
  ): Promise<Order> {
    const health = await request<{ storage: string }>("/health");
    const contentType = blob.type || "application/octet-stream";

    if (health.storage === "blob") {
      const { upload } = await import("@vercel/blob/client");
      await upload(`orders/${number}/${fileName}`, blob, {
        access: "private",
        handleUploadUrl: `${API_BASE}/admin/blob-upload`,
        headers: adminHeaders(),
        contentType,
        multipart: blob.size > 8_000_000,
        onUploadProgress: (event) => onProgress?.(Math.round(event.percentage)),
      });
      const { order } = await request<{ order: Order }>(
        `/admin/orders/${encodeURIComponent(number)}/files`,
        {
          method: "POST",
          headers: adminHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ itemId, name: fileName, contentType, size: blob.size, label }),
        },
      );
      return order;
    }

    const query = `item=${encodeURIComponent(itemId)}&label=${encodeURIComponent(label)}`;
    const { order } = await request<{ order: Order }>(
      `/admin/orders/${encodeURIComponent(number)}/files/${encodeURIComponent(fileName)}?${query}`,
      {
        method: "PUT",
        headers: adminHeaders({ "Content-Type": contentType }),
        body: blob,
      },
    );
    onProgress?.(100);
    return order;
  },
};
