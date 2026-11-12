import type { OrderConfirmation, OrderLanguage } from "./whatsapp.js";
import type { OrderTotals, ProductOptions } from "./catalog.js";
import type { DesignSummary, PosterDesign } from "./design.js";
import type { CollectionLine } from "./collection.js";

export interface CustomerInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  notes: string;
}

export const EMPTY_CUSTOMER: CustomerInfo = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  postalCode: "",
  country: "",
  notes: "",
};

export type OrderStatus =
  | "new"
  | "confirmed"
  | "in_production"
  | "shipped"
  | "delivered"
  | "cancelled";

export const ORDER_STATUSES: { id: OrderStatus; label: string }[] = [
  { id: "new", label: "New" },
  { id: "confirmed", label: "Confirmed" },
  { id: "in_production", label: "Sent to print" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

export type PaymentMethod = "cash_on_delivery";

/** What the browser sends for each cart line. Prices are never trusted. */
export interface OrderItemInput {
  id: string;
  product: ProductOptions;
  quantity: number;
  design: PosterDesign | null;
  summary: DesignSummary;
  /** Ready-made collection poster (then design is null and no preview is sent). */
  collection?: CollectionLine;
  /** JPEG data URL of the composited poster, used as the order preview. */
  previewDataUrl: string;
}

export interface CreateOrderInput {
  customer: CustomerInfo;
  items: OrderItemInput[];
  paymentMethod: PaymentMethod;
  /** Site language at checkout; the WhatsApp confirmation uses it. */
  language?: OrderLanguage;
  /** Honeypot — real customers never fill this in. */
  website?: string;
}

export interface StoredFile {
  name: string;
  contentType: string;
  size: number;
  createdAt: string;
  label?: string;
  /** Print file downloaded to the owner's computer only; nothing is stored. */
  downloadOnly?: boolean;
}

export interface OrderItem {
  id: string;
  product: ProductOptions;
  productLabel: string;
  widthCm: number;
  heightCm: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  design: PosterDesign | null;
  summary: DesignSummary;
  /** Ready-made collection poster, with the partner's product and variant. */
  collection?: CollectionLine;
  preview: StoredFile | null;
  printFiles: StoredFile[];
}

export interface OrderEvent {
  at: string;
  type: "created" | "status" | "note" | "file" | "fulfillment";
  message: string;
}

export interface FulfillmentInfo {
  /** Which provider handles printing/shipping: "manual" until an integration exists. */
  provider: string;
  status: "pending" | "submitted" | "fulfilled" | "failed";
  externalReference: string;
  trackingUrl: string;
  submittedAt: string | null;
  /** Last status read from the print partner (urbanArt), e.g. "shipped". */
  partnerStatus?: string;
  partnerCheckedAt?: string;
}

export interface Order {
  number: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  customer: CustomerInfo;
  items: OrderItem[];
  totals: OrderTotals;
  payment: { method: PaymentMethod; status: "pending" | "paid" };
  fulfillment: FulfillmentInfo;
  history: OrderEvent[];
  /** Secret handed to the customer so only they can view their order. */
  accessKey: string;
  /** Site language at checkout. */
  language?: OrderLanguage;
  /** Automatic WhatsApp confirmation, when enabled. */
  confirmation?: OrderConfirmation;
  /** When the order reached each status (for the customer's tracking page). */
  statusDates?: Partial<Record<OrderStatus, string>>;
}

/** The subset of an order a customer may see with their access key. */
export interface PublicOrder {
  number: string;
  createdAt: string;
  status: OrderStatus;
  customer: CustomerInfo;
  items: Omit<OrderItem, "design" | "printFiles">[];
  totals: OrderTotals;
  payment: Order["payment"];
}

export interface OrderSummaryRow {
  number: string;
  createdAt: string;
  status: OrderStatus;
  customerName: string;
  city: string;
  itemCount: number;
  total: number;
  currency: string;
  hasPrintFiles: boolean;
  /** WhatsApp confirmation state, when it was attempted. */
  confirmation?: OrderConfirmation["status"];
}

export function toPublicOrder(order: Order): PublicOrder {
  return {
    number: order.number,
    createdAt: order.createdAt,
    status: order.status,
    customer: order.customer,
    items: order.items.map(({ design: _design, printFiles: _files, ...item }) => item),
    totals: order.totals,
    payment: order.payment,
  };
}

export function toSummaryRow(order: Order): OrderSummaryRow {
  return {
    number: order.number,
    createdAt: order.createdAt,
    status: order.status,
    customerName: order.customer.fullName,
    city: order.customer.city,
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    total: order.totals.total,
    currency: order.totals.currency,
    hasPrintFiles: order.items.every((item) => !!item.collection || item.printFiles.length > 0),
    ...(order.confirmation ? { confirmation: order.confirmation.status } : {}),
  };
}

export function statusLabel(status: OrderStatus): string {
  return ORDER_STATUSES.find((entry) => entry.id === status)?.label ?? status;
}

/* ── Customer tracking ── */

/** The road an order travels, in order. */
export const TRACKING_STEPS: OrderStatus[] = ["new", "confirmed", "in_production", "shipped", "delivered"];

export function statusRank(status: OrderStatus): number {
  return TRACKING_STEPS.indexOf(status);
}

/**
 * Our status for a print partner (urbanArt) status. Unknown or early
 * states (awaiting_payment) give null: they don't move the order.
 */
export function partnerStatusToOrder(status: string): OrderStatus | "cancelled" | null {
  switch (status.toLowerCase()) {
    case "confirmed":
    case "processing":
    case "in_production":
      return "in_production";
    case "shipped":
    case "completed-shipped":
      return "shipped";
    case "delivered":
    case "completed":
      return "delivered";
    case "cancelled":
    case "canceled":
    case "refused":
    case "failed":
      return "cancelled";
    default:
      return null;
  }
}

/** Records when an order reached a status. */
export function stampStatus(order: Order, status: OrderStatus, at: string): void {
  order.statusDates = { ...order.statusDates, [status]: order.statusDates?.[status] ?? at };
}

export interface OrderTracking {
  number: string;
  createdAt: string;
  status: OrderStatus;
  steps: { status: OrderStatus; at: string | null; done: boolean }[];
  items: { title: string; detail: string; quantity: number; product: ProductOptions; collection?: CollectionLine }[];
  total: number;
  currency: string;
  city: string;
  trackingUrl: string;
}

/** What the customer may see on the tracking page (no address, phone or files). */
export function toTracking(order: Order): OrderTracking {
  const dates: Partial<Record<OrderStatus, string>> = { new: order.createdAt, ...order.statusDates };
  // Older orders: recover dates from the history.
  for (const event of order.history) {
    const match = /Status changed to (\w+)\./.exec(event.message);
    if (match && !dates[match[1] as OrderStatus]) dates[match[1] as OrderStatus] = event.at;
    if (/confirmed on WhatsApp/.test(event.message) && !dates.confirmed) dates.confirmed = event.at;
  }
  const rank = statusRank(order.status);
  return {
    number: order.number,
    createdAt: order.createdAt,
    status: order.status,
    steps: TRACKING_STEPS.map((status, index) => ({
      status,
      done: order.status !== "cancelled" && index <= rank,
      at: order.status !== "cancelled" && index <= rank ? dates[status] ?? null : null,
    })),
    items: order.items.map((item) => ({
      title: item.collection?.title || item.summary?.title || "Poster",
      detail: item.productLabel,
      quantity: item.quantity,
      product: item.product,
      ...(item.collection ? { collection: item.collection } : {}),
    })),
    total: order.totals.total,
    currency: order.totals.currency,
    city: order.customer.city,
    trackingUrl: order.fulfillment.trackingUrl,
  };
}

/** Same customer? Compares the last 9 digits of two phone numbers. */
export function samePhone(a: string, b: string): boolean {
  const tail = (value: string) => value.replace(/\D/g, "").slice(-9);
  return tail(a).length >= 6 && tail(a) === tail(b);
}
