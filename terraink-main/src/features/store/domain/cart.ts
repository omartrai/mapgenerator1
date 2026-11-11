import { resolveDimensions, unitPrice, type ProductOptions } from "./catalog.js";
import { collectionDimensions, type CollectionLine } from "./collection.js";
import type { DesignSummary, PosterDesign } from "./design.js";

export interface CartItem {
  id: string;
  product: ProductOptions;
  quantity: number;
  /** Custom map design; null for a ready-made collection poster. */
  design: PosterDesign | null;
  summary: DesignSummary;
  /** Set when the line is a ready-made poster from the collection. */
  collection?: CollectionLine;
  previewDataUrl: string;
  addedAt: string;
}

export interface LastOrderRef {
  number: string;
  accessKey: string;
  createdAt: string;
}

type PricedItem = { product: ProductOptions; collection?: { price: number } | null };

/** Unit price of a cart or order line (collection posters carry their own). */
export function itemUnitPrice(item: PricedItem): number {
  return item.collection ? item.collection.price : unitPrice(item.product);
}

/** Poster size in cm of a cart line. */
export function itemDimensions(item: { product: ProductOptions; collection?: { size: string } | null }) {
  return item.collection ? collectionDimensions(item.collection.size) : resolveDimensions(item.product);
}

/** Unique id for a new cart line. */
export function createId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
