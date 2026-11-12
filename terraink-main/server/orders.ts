import { randomBytes } from "node:crypto";
import {
  MAX_ITEMS_PER_ORDER,
  MAX_QUANTITY_PER_ITEM,
  computeTotals,
  describeProduct,
  isValidProduct,
  applyFramedPrices,
  resolveDimensions,
  unitPrice,
  type FramedPriceTable,
} from "../src/features/store/domain/catalog.js";
import { isPosterDesign } from "../src/features/store/domain/design.js";
import {
  collectionDimensions,
  formatCollectionSize,
  type CollectionLine,
  type CollectionProduct,
} from "../src/features/store/domain/collection.js";
import type {
  CreateOrderInput,
  Order,
  OrderItem,
  OrderStatus,
  StoredFile,
} from "../src/features/store/domain/order.js";
import {
  ORDER_STATUSES,
  partnerStatusToOrder,
  samePhone,
  stampStatus,
  statusRank,
  toTracking,
  type OrderTracking,
} from "../src/features/store/domain/order.js";
import { normalizeCustomer, validateCustomer } from "../src/features/store/domain/validation.js";
import type { IOrderStorage } from "./storage/ports.js";
import type { IFulfillmentProvider } from "./fulfillment/ports.js";
import type { WhatsAppClient } from "./whatsapp.js";
import {
  toWhatsAppNumber,
  type ConfirmationAction,
  type OrderConfirmation,
  type OrderLanguage,
} from "../src/features/store/domain/whatsapp.js";

const LANGUAGES: OrderLanguage[] = ["fr", "ar", "en"];
const messageIndexPath = (messageId: string) =>
  `whatsapp/messages/${messageId.replace(/[^A-Za-z0-9_.=-]/g, "_")}.json`;
const phoneIndexPath = (phone: string) => `whatsapp/phones/${phone.replace(/\D/g, "")}.json`;

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

/** Looks up a collection poster in the partner catalogue (null if unknown). */
export type CollectionLookup = (productId: number) => Promise<CollectionProduct | null>;

const FRAME_NAMES: Record<string, string> = {
  oak: "Oak",
  white: "White",
  grey: "Grey",
  walnut: "Walnut",
  black: "Black",
};

/** Re-checks a collection line against the live catalogue; price comes from there. */
async function resolveCollectionLine(raw: unknown, lookup: CollectionLookup | undefined): Promise<CollectionLine> {
  const input = (raw ?? {}) as Partial<CollectionLine>;
  if (!lookup) throw new HttpError(503, "The collection can't be ordered right now.");
  const productId = Number(input.productId);
  const variantIndex = Number(input.variantIndex);
  if (!Number.isInteger(productId) || !Number.isInteger(variantIndex)) {
    throw new HttpError(400, "A collection poster is unknown.");
  }
  let product: CollectionProduct | null;
  try {
    product = await lookup(productId);
  } catch {
    throw new HttpError(502, "The collection is unavailable right now. Please try again.");
  }
  const variant = product?.variants.find((entry) => entry.index === variantIndex);
  if (!product || !variant) throw new HttpError(400, "A collection poster is no longer available.");
  const frameColor = variant.colors.find((color) => color === input.frameColor);
  if (!frameColor) throw new HttpError(400, "A collection poster has an unknown frame colour.");
  return {
    productId,
    variantIndex,
    title: product.title,
    size: variant.size,
    withMat: variant.withMat,
    frameDepthCm: variant.frameDepthCm,
    frameColor,
    image: product.image,
    price: variant.price,
  };
}

function describeCollectionLine(line: CollectionLine): string {
  return [
    `Collection #${line.productId}`,
    formatCollectionSize(line.size),
    `${FRAME_NAMES[line.frameColor] ?? line.frameColor} frame ${line.frameDepthCm} cm`,
    line.withMat ? "Passe-partout" : "No passe-partout",
  ].join(" · ");
}

export function createOrderService(
  storage: IOrderStorage,
  fulfillment: IFulfillmentProvider,
  findCollectionProduct?: CollectionLookup,
  loadFramedPrices?: () => Promise<FramedPriceTable | null>,
  whatsapp?: WhatsAppClient | null,
  partnerOrderStatus?: (reference: string) => Promise<{ status: string } | null>,
) {
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

  function setConfirmation(order: Order, next: Omit<OrderConfirmation, "channel" | "updatedAt">): void {
    order.confirmation = { channel: "whatsapp", ...order.confirmation, ...next, updatedAt: new Date().toISOString() };
    if (!next.error) delete order.confirmation.error;
  }

  /** Sends the WhatsApp confirmation template; never throws. */
  async function sendConfirmation(order: Order): Promise<Order> {
    if (!whatsapp) return order;
    const at = new Date().toISOString();
    const to = toWhatsAppNumber(order.customer.phone, order.customer.country);
    if (!to) {
      setConfirmation(order, { status: "skipped", error: "Phone number can't receive WhatsApp." });
      order.history.push({ at, type: "note", message: "WhatsApp confirmation skipped: phone number not usable." });
      return save(order);
    }
    try {
      const { messageId } = await whatsapp.sendOrderConfirmation(order, to);
      setConfirmation(order, { status: "sent", to, messageId });
      order.history.push({ at, type: "note", message: `WhatsApp confirmation sent to +${to}.` });
      if (messageId) await storage.putJson(messageIndexPath(messageId), { number: order.number });
      const index = (await storage.getJson<{ numbers: string[] }>(phoneIndexPath(to))) ?? { numbers: [] };
      await storage.putJson(phoneIndexPath(to), {
        numbers: [order.number, ...index.numbers.filter((n) => n !== order.number)].slice(0, 10),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn("[whatsapp] confirmation not sent", order.number, message);
      setConfirmation(order, { status: "failed", to, error: message.slice(0, 300) });
      order.history.push({ at, type: "note", message: `WhatsApp confirmation failed: ${message.slice(0, 200)}` });
    }
    return save(order);
  }

  /** The customer's most recent order still waiting for an answer. */
  async function pendingOrderFor(phone: string): Promise<Order | null> {
    const index = await storage.getJson<{ numbers: string[] }>(phoneIndexPath(phone));
    for (const number of index?.numbers ?? []) {
      const order = await storage.getJson<Order>(orderPath(number));
      if (order && ["sent", "delivered", "read", "failed"].includes(order.confirmation?.status ?? "")) return order;
    }
    return null;
  }

  /**
   * Reads the order's status at urbanArt (when its reference is filled in)
   * and moves our status forward to match. Never moves it backwards and
   * never cancels by itself: a cancellation at urbanArt is noted for you.
   */
  async function syncWithPartner(order: Order): Promise<Order> {
    const reference = order.fulfillment.externalReference.trim();
    if (!partnerOrderStatus || !reference || ["delivered", "cancelled"].includes(order.status)) return order;
    let partner: { status: string } | null = null;
    try {
      partner = await partnerOrderStatus(reference);
    } catch (error) {
      console.warn("[urbanart] order status unavailable", order.number, error);
      return order;
    }
    if (!partner) return order;
    const at = new Date().toISOString();
    const previous = order.fulfillment.partnerStatus;
    order.fulfillment = { ...order.fulfillment, partnerStatus: partner.status, partnerCheckedAt: at };
    const mapped = partnerStatusToOrder(partner.status);
    let changed = previous !== partner.status;
    if (mapped === "cancelled") {
      if (previous !== partner.status) {
        order.history.push({ at, type: "fulfillment", message: `urbanArt reports the order as ${partner.status}. Check it and inform the customer.` });
      }
    } else if (mapped && statusRank(mapped) > statusRank(order.status)) {
      order.history.push({ at, type: "status", message: `Status changed to ${mapped}. (from urbanArt: ${partner.status})` });
      order.status = mapped;
      stampStatus(order, mapped, at);
      changed = true;
    }
    return changed ? save(order) : order;
  }

  return {
    storageKind: storage.kind,
    syncWithPartner: async (number: string) => syncWithPartner(await load(number)),

    /**
     * Customer tracking: the order number plus the phone used to order (or
     * the private link key). Wrong pairs look exactly like unknown orders.
     */
    async track(number: string, proof: { phone?: string; key?: string }): Promise<OrderTracking> {
      let order: Order;
      try {
        order = await load(number.trim().toUpperCase());
      } catch {
        throw new HttpError(404, "No order matches this number and phone.");
      }
      const byKey = !!proof.key && proof.key === order.accessKey;
      const byPhone = !!proof.phone && samePhone(proof.phone, order.customer.phone);
      if (!byKey && !byPhone) throw new HttpError(404, "No order matches this number and phone.");
      return toTracking(await syncWithPartner(order));
    },
    whatsappEnabled: !!whatsapp,
    sendConfirmation: async (number: string) => sendConfirmation(await load(number)),

    /**
     * Applies a customer's ✅/❌ answer. Only the phone the message went to
     * can answer, and only while the order has not gone to print.
     * Returns the order and whether anything changed.
     */
    async applyConfirmationAnswer(
      from: string,
      action: ConfirmationAction,
      orderNumber?: string,
    ): Promise<{ order: Order; changed: boolean } | null> {
      const phone = from.replace(/\D/g, "");
      let order: Order | null = null;
      if (orderNumber) {
        try {
          order = await load(orderNumber);
        } catch {
          return null;
        }
        const allowed = [order.confirmation?.to, toWhatsAppNumber(order.customer.phone, order.customer.country)];
        if (!allowed.includes(phone)) return null;
      } else {
        order = await pendingOrderFor(phone);
      }
      if (!order) return null;

      const at = new Date().toISOString();
      const target = action === "confirm" ? "confirmed" : "cancelled";
      const canChange =
        order.status === "new" ||
        (order.status === "confirmed" && action === "cancel") ||
        (order.status === "cancelled" && action === "confirm" && order.confirmation?.status === "cancelled");
      if (!canChange || order.status === target) {
        return { order, changed: false };
      }
      order.status = target;
      stampStatus(order, target, at);
      setConfirmation(order, { status: target });
      order.history.push({
        at,
        type: "status",
        message: action === "confirm" ? "Customer confirmed on WhatsApp." : "Customer cancelled on WhatsApp.",
      });
      return { order: await save(order), changed: true };
    },

    /** Delivery / read receipts for the confirmation message. */
    async applyConfirmationReceipt(messageId: string, status: string, error?: string): Promise<void> {
      const index = await storage.getJson<{ number: string }>(messageIndexPath(messageId));
      if (!index) return;
      const order = await storage.getJson<Order>(orderPath(index.number));
      if (!order?.confirmation || order.confirmation.messageId !== messageId) return;
      const rank = { sent: 1, delivered: 2, read: 3 } as Record<string, number>;
      const current = order.confirmation.status;
      if (status === "failed" && rank[current]) {
        setConfirmation(order, { status: "failed", error: error || "Message not delivered." });
        order.history.push({ at: new Date().toISOString(), type: "note", message: `WhatsApp message failed: ${error || "not delivered"}.` });
      } else if (rank[status] && rank[current] && rank[status] > rank[current]) {
        setConfirmation(order, { status: status as OrderConfirmation["status"] });
      } else {
        return;
      }
      await save(order);
    },

    /** Any other WhatsApp message from a customer goes into their order's history. */
    async recordCustomerMessage(from: string, text: string): Promise<void> {
      const index = await storage.getJson<{ numbers: string[] }>(phoneIndexPath(from));
      const number = index?.numbers[0];
      if (!number) return;
      const order = await storage.getJson<Order>(orderPath(number));
      if (!order) return;
      order.history.push({
        at: new Date().toISOString(),
        type: "note",
        message: `Customer wrote on WhatsApp: “${text.trim().slice(0, 500)}”`,
      });
      await save(order);
    },
    fulfillmentLabel: fulfillment.label,
    load,

    async create(input: CreateOrderInput): Promise<Order> {
      // Studio frames are priced like the collection; use today's prices.
      if (loadFramedPrices) {
        try {
          applyFramedPrices(await loadFramedPrices());
        } catch (error) {
          console.warn("[orders] live frame prices unavailable, using the built-in ones", error);
        }
      }
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
        const quantityValue = Math.floor(Number(raw?.quantity));
        if (raw?.collection) {
          if (!Number.isFinite(quantityValue) || quantityValue < 1 || quantityValue > MAX_QUANTITY_PER_ITEM) {
            throw new HttpError(400, "Invalid quantity.");
          }
          const line = await resolveCollectionLine(raw.collection, findCollectionProduct);
          const { widthCm, heightCm } = collectionDimensions(line.size);
          items.push({
            id: String(raw.id ?? `item-${index + 1}`).slice(0, 64),
            product: { sizeId: line.size, orientation: "portrait", frameId: line.frameColor, mat: line.withMat },
            productLabel: describeCollectionLine(line),
            widthCm,
            heightCm,
            quantity: quantityValue,
            unitPrice: line.price,
            lineTotal: line.price * quantityValue,
            design: null,
            summary: {
              title: line.title,
              subtitle: formatCollectionSize(line.size),
              themeId: "",
              themeName: "Collection",
              fontFamily: "",
              latitude: 0,
              longitude: 0,
              distanceMeters: 0,
              markerCount: 0,
              routeCount: 0,
            },
            collection: line,
            preview: null,
            printFiles: [],
          });
          continue;
        }
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
          mat: raw.product.frameId !== "none" && raw.product.mat === true,
          ...(raw.product.frameId !== "none" ? { frameDepth: raw.product.frameDepth === "3" ? ("3" as const) : ("1.5" as const) } : {}),
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
        ...(LANGUAGES.includes(input?.language as OrderLanguage) ? { language: input.language } : {}),
      };

      await save(order);
      await fulfillment.onOrderCreated(order);
      return sendConfirmation(order);
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
        stampStatus(order, patch.status, at);
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
        (item) =>
          item.preview?.name === fileName ||
          item.printFiles.some((file) => file.name === fileName && !file.downloadOnly),
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
      message: file.downloadOnly
        ? `Print file ${file.name} downloaded (${Math.round(file.size / 1024)} KB, not stored).`
        : `Print file ${file.name} saved (${Math.round(file.size / 1024)} KB).`,
    });
    return save(order);
  }
}

export type OrderService = ReturnType<typeof createOrderService>;
