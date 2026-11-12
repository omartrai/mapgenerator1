import { createHash, timingSafeEqual } from "node:crypto";
import path from "node:path";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { toPublicOrder, toSummaryRow } from "../src/features/store/domain/order.js";
import { framedPricesFromCollection } from "../src/features/store/domain/collection.js";
import { createBlobStorage } from "./storage/blobStorage.js";
import { createFsStorage } from "./storage/fsStorage.js";
import { createFulfillmentProvider } from "./fulfillment/index.js";
import { createUrbanArtCatalog } from "./urbanart.js";
import { createReviewService, type ReviewService } from "./reviews.js";
import {
  HttpError,
  assertFileName,
  assertOrderNumber,
  createOrderService,
  filePath,
  type OrderService,
} from "./orders.js";

type Env = Record<string, string | undefined>;

export interface RouterOptions {
  env: Env;
  /** Set by the Vite dev server: allows local disk storage and a dev password. */
  devDataDir?: string;
}

const MAX_JSON_BYTES = 12_000_000;
const MAX_DIRECT_UPLOAD_BYTES = 60_000_000;
const PRINT_CONTENT_TYPES = ["image/png", "image/jpeg", "application/pdf", "image/svg+xml"];

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers,
    },
  });

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(digest(a), digest(b));
}

function resolveStorage(options: RouterOptions) {
  const token = String(options.env.BLOB_READ_WRITE_TOKEN ?? "").trim();
  if (token) return createBlobStorage(token);
  if (options.devDataDir) return createFsStorage(options.devDataDir);
  return null;
}

async function readJson<T>(request: Request): Promise<T> {
  const text = await request.text();
  if (text.length > MAX_JSON_BYTES) throw new HttpError(413, "Request is too large.");
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new HttpError(400, "Invalid JSON body.");
  }
}

export function createApiHandler(options: RouterOptions) {
  let service: OrderService | null = null;
  let reviews: ReviewService | null = null;
  const getReviews = () => {
    if (reviews) return reviews;
    const storage = resolveStorage(options);
    if (!storage) throw new HttpError(503, "Review storage is not configured.");
    reviews = createReviewService(storage);
    return reviews;
  };
  const getService = () => {
    if (service) return service;
    const storage = resolveStorage(options);
    if (!storage) {
      throw new HttpError(
        503,
        "Order storage is not configured. Connect a Vercel Blob store to this project.",
      );
    }
    service = createOrderService(
      storage,
      createFulfillmentProvider(options.env),
      catalog ? async (id) => (await catalog.getProduct(id))?.product ?? null : undefined,
      catalog ? async () => framedPricesFromCollection(await catalog.listProducts()) : undefined,
    );
    return service;
  };

  const adminPassword = () => {
    const configured = String(options.env.ADMIN_PASSWORD ?? "").trim();
    if (configured) return configured;
    return options.devDataDir ? "admin" : "";
  };

  function requireAdmin(request: Request) {
    const expected = adminPassword();
    if (!expected) {
      throw new HttpError(503, "Admin access is not configured. Set ADMIN_PASSWORD in your Vercel project.");
    }
    const header = request.headers.get("authorization") ?? "";
    const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!provided || !safeEqual(provided, expected)) {
      throw new HttpError(401, "Wrong admin password.");
    }
  }

  async function streamFile(number: string, name: string, download: boolean) {
    const { file, name: fileName } = await getService().readFile(number, name);
    return new Response(file.body as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": file.contentType,
        "Cache-Control": "private, max-age=300",
        ...(file.size !== null ? { "Content-Length": String(file.size) } : {}),
        ...(download
          ? { "Content-Disposition": `attachment; filename="${number}-${fileName}"` }
          : {}),
      },
    });
  }

  const catalog = createUrbanArtCatalog(options.env);
  // Public catalogue data: let the CDN cache it briefly.
  const cached = { "Cache-Control": "public, max-age=60, s-maxage=600, stale-while-revalidate=3600" };

  async function route(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const rawPath = url.searchParams.get("path") ?? url.pathname.replace(/^\/api\/?/, "");
    const segments = rawPath.split("/").filter(Boolean).map(decodeURIComponent);
    const method = request.method.toUpperCase();
    const [head, ...rest] = segments;

    // GET /api/health
    if (head === "health" && method === "GET") {
      const storage = resolveStorage(options);
      return json(200, {
        ok: true,
        storage: storage?.kind ?? "unconfigured",
        adminConfigured: !!adminPassword(),
      });
    }

    // GET /api/studio-prices — framed studio prices, matched to the collection
    if (head === "studio-prices" && rest.length === 0 && method === "GET") {
      if (!catalog) return json(200, { framed: null });
      try {
        return json(200, { framed: framedPricesFromCollection(await catalog.listProducts()) }, cached);
      } catch (error) {
        console.warn("[urbanart] catalogue unavailable for studio prices", error);
        return json(200, { framed: null });
      }
    }

    // GET /api/collection — ready-made posters from UrbanArt
    if (head === "collection" && method === "GET") {
      if (!catalog) return json(200, { products: [], configured: false });
      if (rest.length === 0) {
        try {
          return json(200, { products: await catalog.listProducts(), configured: true }, cached);
        } catch (error) {
          console.warn("[urbanart] catalogue unavailable", error);
          throw new HttpError(502, "The collection is unavailable right now.");
        }
      }
      if (rest.length === 1) {
        const id = Number(rest[0]);
        if (!Number.isInteger(id) || id <= 0) throw new HttpError(404, "Product not found.");
        let found;
        try {
          found = await catalog.getProduct(id);
        } catch (error) {
          console.warn("[urbanart] catalogue unavailable", error);
          throw new HttpError(502, "The collection is unavailable right now.");
        }
        if (!found) throw new HttpError(404, "Product not found.");
        return json(200, found, cached);
      }
    }

    // GET /api/reviews — approved reviews for the site
    if (head === "reviews" && rest.length === 0 && method === "GET") {
      if (!resolveStorage(options)) return json(200, { reviews: [], count: 0, average: 0 });
      return json(200, await getReviews().summary(), { "Cache-Control": "public, max-age=60, s-maxage=120" });
    }

    // POST /api/orders — place an order
    if (head === "orders" && rest.length === 0 && method === "POST") {
      const order = await getService().create(await readJson(request));
      return json(201, { order: toPublicOrder(order), accessKey: order.accessKey });
    }

    // GET /api/orders/:number?key=… — customer view
    if (head === "orders" && rest.length >= 1) {
      const number = assertOrderNumber(rest[0]);
      const key = url.searchParams.get("key") ?? "";
      const order = await getService().load(number);
      if (!key || !safeEqual(key, order.accessKey)) throw new HttpError(404, "Order not found.");
      if (rest.length === 1 && method === "GET") return json(200, { order: toPublicOrder(order) });
      // GET / POST /api/orders/:number/review?key=… — the customer's review
      if (rest[1] === "review" && rest.length === 2) {
        if (method === "GET") {
          const review = await getReviews().forOrder(order.number);
          return json(200, { review: review ? { ...review, orderNumber: undefined } : null });
        }
        if (method === "POST") {
          const review = await getReviews().submit(order, await readJson(request));
          return json(201, { review: { ...review, orderNumber: undefined } });
        }
      }
      // GET /api/orders/:number/files/:name?key=… — preview images only
      if (rest[1] === "files" && rest[2] && method === "GET") {
        const name = assertFileName(rest[2]);
        if (!order.items.some((item) => item.preview?.name === name)) {
          throw new HttpError(404, "File not found.");
        }
        return streamFile(number, name, false);
      }
    }

    if (head === "admin") {
      // POST /api/admin/blob-upload — client upload tokens for large print files
      if (rest[0] === "blob-upload" && method === "POST") {
        const body = await readJson<HandleUploadBody>(request);
        if (body.type === "blob.generate-client-token") requireAdmin(request);
        const token = String(options.env.BLOB_READ_WRITE_TOKEN ?? "").trim();
        if (!token) throw new HttpError(400, "Direct uploads need a Vercel Blob store.");
        const result = await handleUpload({
          body,
          request,
          token,
          onBeforeGenerateToken: async (pathname) => {
            const match = /^orders\/(ML-\d{6}-[A-Z0-9]{5})\/([a-z0-9._-]+)$/.exec(pathname);
            if (!match) throw new HttpError(400, "Invalid upload path.");
            await getService().load(match[1]);
            return {
              allowedContentTypes: PRINT_CONTENT_TYPES,
              maximumSizeInBytes: 250_000_000,
              addRandomSuffix: false,
              allowOverwrite: true,
            };
          },
        });
        return json(200, result);
      }

      requireAdmin(request);

      // GET /api/admin/session — password check
      if (rest[0] === "session" && method === "GET") {
        return json(200, {
          ok: true,
          storage: getService().storageKind,
          fulfillment: getService().fulfillmentLabel,
        });
      }

      if (rest[0] === "reviews") {
        // GET /api/admin/reviews
        if (rest.length === 1 && method === "GET") {
          return json(200, { reviews: await getReviews().listAll() });
        }
        // PATCH /api/admin/reviews/:id { status }
        if (rest.length === 2 && method === "PATCH") {
          const body = await readJson<{ status: string }>(request);
          const review = await getReviews().setStatus(assertOrderNumber(rest[1]), body?.status as never);
          return json(200, { review });
        }
      }

      if (rest[0] === "orders") {
        // GET /api/admin/orders
        if (rest.length === 1 && method === "GET") {
          const orders = await getService().list();
          return json(200, { orders: orders.map(toSummaryRow) });
        }

        const number = assertOrderNumber(rest[1]);

        // GET /api/admin/orders/:number
        if (rest.length === 2 && method === "GET") {
          return json(200, { order: await getService().load(number) });
        }

        // PATCH /api/admin/orders/:number
        if (rest.length === 2 && method === "PATCH") {
          const order = await getService().update(number, await readJson(request));
          return json(200, { order });
        }

        if (rest[2] === "files") {
          // GET /api/admin/orders/:number/files/:name
          if (rest[3] && method === "GET") {
            return streamFile(number, rest[3], url.searchParams.get("download") === "1");
          }

          // PUT /api/admin/orders/:number/files/:name?item=…&label=… — direct upload
          if (rest[3] && method === "PUT") {
            const contentType = (request.headers.get("content-type") ?? "").split(";")[0].trim();
            if (!PRINT_CONTENT_TYPES.includes(contentType)) throw new HttpError(415, "Unsupported file type.");
            const buffer = new Uint8Array(await request.arrayBuffer());
            if (buffer.byteLength === 0 || buffer.byteLength > MAX_DIRECT_UPLOAD_BYTES) {
              throw new HttpError(413, "File is empty or too large.");
            }
            const order = await getService().attachPrintFile(
              number,
              url.searchParams.get("item") ?? "",
              rest[3],
              buffer,
              contentType,
              url.searchParams.get("label") ?? "Print file",
            );
            return json(200, { order });
          }

          // POST /api/admin/orders/:number/files — record a client-uploaded blob
          if (!rest[3] && method === "POST") {
            const body = await readJson<{
              itemId: string;
              name: string;
              contentType: string;
              size: number;
              label?: string;
            }>(request);
            const name = assertFileName(body.name);
            if (!PRINT_CONTENT_TYPES.includes(body.contentType)) throw new HttpError(415, "Unsupported file type.");
            const order = await getService().recordUploadedPrintFile(number, body.itemId, {
              name: path.basename(name),
              contentType: body.contentType,
              size: Math.max(0, Number(body.size) || 0),
              createdAt: new Date().toISOString(),
              label: String(body.label ?? "Print file").slice(0, 80),
            });
            return json(200, { order, path: filePath(number, name) });
          }
        }
      }
    }

    throw new HttpError(404, "Not found.");
  }

  return async function handle(request: Request): Promise<Response> {
    try {
      return await route(request);
    } catch (error) {
      if (error instanceof HttpError) {
        return json(error.status, { error: error.message, ...(error.details ? { details: error.details } : {}) });
      }
      console.error("[api] unexpected error", error);
      return json(500, { error: "Something went wrong. Please try again." });
    }
  };
}
