import type { OrderTotals, ProductOptions } from "./catalog.js";
import type { DesignSummary, PosterDesign } from "./design.js";

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
  design: PosterDesign;
  summary: DesignSummary;
  /** JPEG data URL of the composited poster, used as the order preview. */
  previewDataUrl: string;
}

export interface CreateOrderInput {
  customer: CustomerInfo;
  items: OrderItemInput[];
  paymentMethod: PaymentMethod;
  /** Honeypot — real customers never fill this in. */
  website?: string;
}

export interface StoredFile {
  name: string;
  contentType: string;
  size: number;
  createdAt: string;
  label?: string;
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
  design: PosterDesign;
  summary: DesignSummary;
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
    hasPrintFiles: order.items.every((item) => item.printFiles.length > 0),
  };
}

export function statusLabel(status: OrderStatus): string {
  return ORDER_STATUSES.find((entry) => entry.id === status)?.label ?? status;
}
