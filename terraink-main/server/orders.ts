import { randomBytes } from "node:crypto";
import {
  MAX_ITEMS_PER_ORDER,
  MAX_QUANTITY_PER_ITEM,
  computeTotals,
  describeProduct,
  isValidProduct,
  resolveDimensions,
  unitPrice,
} from "../src/features/store/domain/catalog.js";
import { isPosterDesign } from "../src/features/store/domain/design.js";
import type {
  CreateOrderInput,
  Order,
  OrderItem,
  OrderStatus,
  StoredFile,
} from "../src/features/store/domain/order.js";
import { ORDER_STATUSES } from "../src/features/store/domain/order.js";
import { normalizeCustomer, validateCustomer } from "../src/features/store/domain/validation.js";
import type { IOrderStorage } from "./storage/ports.js";
import type { IFulfillmentProvider } from "./fulfillment/ports.js";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

const ORDER_PREFIX = "orders/";
const MAX_PREVIEW_BYTES = 2_500_000;
const MAX_DESIGN_BYTES = 1_500_000;
const ORDER_NUMBER_PATTERN = /^ML-\d{6}-[A-Z0-9]{5}$/;
const FILE_NAME_PATTERN = /^[a-z0-9][a-z0-9._-]{0,80}$/;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const orderPath = (number: string) => `${ORDER_PREFIX}${number}/order.json`;
export const filePath = (number: string, name: string) => `${ORDER_PREFIX}${number}/${name}`;

export function assertOrderNumber(number: string): string {
  const normalized = String(number ?? "").trim().toUpperCase();
  if (!ORDER_NUMBER_PATTERN.test(normalized)) throw new HttpError(404, "Order not found.");
  return normalized;
}

export function assertFileName(name: string): string {
  const normalized = String(name ?? "").trim().toLowerCase();
  if (!FILE_NAME_PATTERN.test(normalized) || normalized === "order.json") {
    throw new HttpError(400, "Invalid file name.");
  }
  return normalized;
}

function createOrderNumber(now: Date): string {
  const date = now.toISOString().slice(2, 10).replace(/-/g, "");
  const bytes = randomBytes(5);
  const suffix = Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("");
  return `ML-${date}-${suffix}`;
}

function decodeDataUrl(dataUrl: string): { bytes: Uint8Array; contentType: string } {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl ?? ""));
  if (!match) throw new HttpError(400, "Each poster needs a preview image.");
  const bytes = new Uint8Array(Buffer.from(match[2], "base64"));
  if (bytes.byteLength > MAX_PREVIEW_BYTES) throw new HttpError(413, "Preview image is too large.");
  return { bytes, contentType: match[1] };
}

const extensionFor = (contentType: string) =>
  contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";

export function createOrderService(storage: IOrderStorage, fulfillment: IFulfillmentProvider) {
  async function load(number: string): Promise<Order> {
    const order = await storage.getJson<Order>(orderPath(assertOrderNumber(number)));
    if (!order) throw new HttpError(404, "Order not found.");
    return order;
  }

  async function save(order: Order): Promise<Order> {
    order.updatedAt = new Date().toISOString();
    await storage.putJson(orderPath(order.number), order);
    return order;
  }

  return {
    storageKind: storage.kind,
    fulfillmentLabel: fulfillment.label,
    load,

    async create(input: CreateOrderInput): Promise<Order> {
      if (!input || typeof input !== "object") throw new HttpError(400, "Invalid order.");
      if (input.website) throw new HttpError(400, "Invalid order.");

      const customer = normalizeCustomer(input.customer);
      const errors = validateCustomer(customer);
      if (Object.keys(errors).length > 0) {
        throw new HttpError(422, "Please check your delivery details.", { fields: errors });
      }

      const rawItems = Array.isArray(input.items) ? input.items : [];
      if (rawItems.length === 0) throw new HttpError(400, "Your cart is empty.");
      if (rawItems.length > MAX_ITEMS_PER_ORDER) throw new HttpError(400, "Too many posters in one order.");

      const now = new Date();
      const number = createOrderNumber(now);
      const items: OrderItem[] = [];

      for (const [index, raw] of rawItems.entries()) {
        if (!isValidProduct(raw?.product)) throw new HttpError(400, "A poster has an unknown size or frame.");
        if (!isPosterDesign(raw?.design)) throw new HttpError(400, "A poster design is missing.");
        if (JSON.stringify(raw.design).length > MAX_DESIGN_BYTES) {
          throw new HttpError(413, "A poster design is too large.");
        }
        const quantity = Math.floor(Number(raw.quantity));
        if (!Number.isFinite(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_ITEM) {
          throw new HttpError(400, "Invalid quantity.");
        }

        const product = {
          sizeId: raw.product.sizeId,
          orientation: raw.product.orientation,
          frameId: raw.product.frameId,
        };
        const preview = decodeDataUrl(raw.previewDataUrl);
        const previewName = `item-${index + 1}-preview.${extensionFor(preview.contentType)}`;
        await storage.putFile(filePath(number, previewName), preview.bytes, preview.contentType);

        const price = unitPrice(product);
        const { widthCm, heightCm } = resolveDimensions(product);
        items.push({
          id: String(raw.id ?? `item-${index + 1}`).slice(0, 64),
          product,
          productLabel: describeProduct(product),
          widthCm,
          heightCm,
          quantity,
          unitPrice: price,
          lineTotal: price * quantity,
          design: raw.design,
          summary: raw.summary,
          preview: {
            name: previewName,
            contentType: preview.contentType,
            size: preview.bytes.byteLength,
            createdAt: now.toISOString(),
            label: "Customer preview",
          },
          printFiles: [],
        });
      }

      const order: Order = {
        number,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        status: "new",
        customer,
        items,
        totals: computeTotals(items),
        payment: { method: "cash_on_delivery", status: "pending" },
        fulfillment: {
          provider: "manual",
          status: "pending",
          externalReference: "",
          trackingUrl: "",
          submittedAt: null,
        },
        history: [{ at: now.toISOString(), type: "created", message: "Order placed by customer." }],
        accessKey: randomBytes(18).toString("base64url"),
      };

      await save(order);
      await fulfillment.onOrderCreated(order);
      return order;
    },

    async list(): Promise<Order[]> {
      const entries = (await storage.list(ORDER_PREFIX)).filter((entry) =>
        entry.path.endsWith("/order.json"),
      );
      const orders = await Promise.all(
        entries.slice(0, 200).map((entry) => storage.getJson<Order>(entry.path)),
      );
      return orders
        .filter((order): order is Order => !!order)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async update(
      number: string,
      patch: {
        status?: OrderStatus;
        note?: string;
        paymentStatus?: "pending" | "paid";
        fulfillment?: { externalReference?: string; trackingUrl?: string; status?: Order["fulfillment"]["status"] };
      },
    ): Promise<Order> {
      const order = await load(number);
      const at = new Date().toISOString();

      if (patch.status && patch.status !== order.status) {
        if (!ORDER_STATUSES.some((entry) => entry.id === patch.status)) {
          throw new HttpError(400, "Unknown status.");
        }
        order.history.push({ at, type: "status", message: `Status changed to ${patch.status}.` });
        order.status = patch.status;
      }
      if (patch.paymentStatus && patch.paymentStatus !== order.payment.status) {
        order.payment.status = patch.paymentStatus === "paid" ? "paid" : "pending";
        order.history.push({ at, type: "status", message: `Payment marked ${order.payment.status}.` });
      }
      if (patch.fulfillment) {
        const next = { ...order.fulfillment };
        if (typeof patch.fulfillment.externalReference === "string") {
          next.externalReference = patch.fulfillment.externalReference.trim().slice(0, 120);
        }
        if (typeof patch.fulfillment.trackingUrl === "string") {
          next.trackingUrl = patch.fulfillment.trackingUrl.trim().slice(0, 400);
        }
        if (patch.fulfillment.status) {
          next.status = patch.fulfillment.status;
          if (next.status === "submitted" && !next.submittedAt) next.submittedAt = at;
        }
        order.fulfillment = next;
        order.history.push({ at, type: "fulfillment", message: "Fulfillment details updated." });
      }
      if (patch.note && patch.note.trim()) {
        order.history.push({ at, type: "note", message: patch.note.trim().slice(0, 1000) });
      }
      return save(order);
    },

    async attachPrintFile(
      number: string,
      itemId: string,
      name: string,
      body: Uint8Array,
      contentType: string,
      label: string,
    ): Promise<Order> {
      const order = await load(number);
      const item = order.items.find((entry) => entry.id === itemId);
      if (!item) throw new HttpError(404, "Order item not found.");
      const fileName = assertFileName(name);
      await storage.putFile(filePath(order.number, fileName), body, contentType);
      return recordPrintFile(order, item.id, {
        name: fileName,
        contentType,
        size: body.byteLength,
        createdAt: new Date().toISOString(),
        label,
      });
    },

    async recordUploadedPrintFile(number: string, itemId: string, file: StoredFile): Promise<Order> {
      const order = await load(number);
      if (!order.items.some((entry) => entry.id === itemId)) throw new HttpError(404, "Order item not found.");
      return recordPrintFile(order, itemId, { ...file, name: assertFileName(file.name) });
    },

    async readFile(number: string, name: string) {
      const order = await load(number);
      const fileName = assertFileName(name);
      const known = order.items.some(
        (item) => item.preview?.name === fileName || item.printFiles.some((file) => file.name === fileName),
      );
      if (!known) throw new HttpError(404, "File not found.");
      const file = await storage.getFile(filePath(order.number, fileName));
      if (!file) throw new HttpError(404, "File not found.");
      return { order, file, name: fileName };
    },
  };

  async function recordPrintFile(order: Order, itemId: string, file: StoredFile): Promise<Order> {
    const item = order.items.find((entry) => entry.id === itemId)!;
    item.printFiles = [...item.printFiles.filter((entry) => entry.name !== file.name), file];
    order.history.push({
      at: new Date().toISOString(),
      type: "file",
      message: `Print file ${file.name} saved (${Math.round(file.size / 1024)} KB).`,
    });
    return save(order);
  }
}

export type OrderService = ReturnType<typeof createOrderService>;
