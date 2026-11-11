/**
 * Product catalog — the single place to change sizes, frames, prices,
 * shipping and currency. Shared by the storefront (display) and the order
 * API (authoritative pricing), so it must stay free of React, DOM and
 * path-alias imports.
 *
 * All money values are integer minor units (cents).
 */

export const STORE_NAME = "Maploom";
export const STORE_CURRENCY = "EUR";
export const STORE_LOCALE = "en-IE";

export type Orientation = "portrait" | "landscape";
export type FrameId = "none" | "black" | "white" | "oak";

export interface PrintSize {
  id: string;
  label: string;
  /** Short-side × long-side in centimetres (portrait orientation). */
  widthCm: number;
  heightCm: number;
  price: number;
  framePrice: number;
  popular?: boolean;
}

export interface FrameOption {
  id: FrameId;
  label: string;
  description: string;
  /** CSS colour used for the frame in mockups. */
  swatch: string;
}

export const PRINT_SIZES: PrintSize[] = [
  { id: "a4", label: "A4", widthCm: 21, heightCm: 29.7, price: 2900, framePrice: 2500 },
  { id: "30x40", label: "30 × 40 cm", widthCm: 30, heightCm: 40, price: 3900, framePrice: 3500, popular: true },
  { id: "a3", label: "A3", widthCm: 29.7, heightCm: 42, price: 4500, framePrice: 3900 },
  { id: "50x70", label: "50 × 70 cm", widthCm: 50, heightCm: 70, price: 5900, framePrice: 5900 },
];

export const FRAME_OPTIONS: FrameOption[] = [
  { id: "none", label: "Print only", description: "Unframed print, rolled and shipped in a tube.", swatch: "transparent" },
  { id: "black", label: "Black frame", description: "Matte black aluminium with acrylic glazing.", swatch: "#1d1d1b" },
  { id: "white", label: "White frame", description: "Soft white wood with acrylic glazing.", swatch: "#f3f1ec" },
  { id: "oak", label: "Oak frame", description: "Natural oak veneer with acrylic glazing.", swatch: "#b98b5a" },
];

export const PAPER_DESCRIPTION = "Museum-grade 200 g/m² matte paper, printed with archival pigment inks.";

export const SHIPPING_FLAT = 495;
export const FREE_SHIPPING_THRESHOLD = 7500;
export const MAX_QUANTITY_PER_ITEM = 10;
export const MAX_ITEMS_PER_ORDER = 10;

export const DEFAULT_PRODUCT: ProductOptions = {
  sizeId: "30x40",
  orientation: "portrait",
  frameId: "none",
};

export interface ProductOptions {
  sizeId: string;
  orientation: Orientation;
  frameId: FrameId;
}

export function getPrintSize(sizeId: string): PrintSize {
  return PRINT_SIZES.find((size) => size.id === sizeId) ?? PRINT_SIZES[1];
}

export function getFrame(frameId: string): FrameOption {
  return FRAME_OPTIONS.find((frame) => frame.id === frameId) ?? FRAME_OPTIONS[0];
}

export function isValidProduct(options: unknown): options is ProductOptions {
  if (!options || typeof options !== "object") return false;
  const value = options as Record<string, unknown>;
  return (
    PRINT_SIZES.some((size) => size.id === value.sizeId) &&
    FRAME_OPTIONS.some((frame) => frame.id === value.frameId) &&
    (value.orientation === "portrait" || value.orientation === "landscape")
  );
}

/** Poster dimensions in cm for the chosen size and orientation. */
export function resolveDimensions(options: ProductOptions): { widthCm: number; heightCm: number } {
  const size = getPrintSize(options.sizeId);
  return options.orientation === "landscape"
    ? { widthCm: size.heightCm, heightCm: size.widthCm }
    : { widthCm: size.widthCm, heightCm: size.heightCm };
}

export function unitPrice(options: ProductOptions): number {
  const size = getPrintSize(options.sizeId);
  return size.price + (options.frameId === "none" ? 0 : size.framePrice);
}

export function describeProduct(options: ProductOptions): string {
  const size = getPrintSize(options.sizeId);
  const frame = getFrame(options.frameId);
  const orientation = options.orientation === "landscape" ? "Landscape" : "Portrait";
  return `${size.label} · ${orientation} · ${frame.label}`;
}

export interface PricedLine {
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderTotals {
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
}

export function computeTotals(lines: { product: ProductOptions; quantity: number }[]): OrderTotals {
  const subtotal = lines.reduce(
    (sum, line) => sum + unitPrice(line.product) * line.quantity,
    0,
  );
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  return { subtotal, shipping, total: subtotal + shipping, currency: STORE_CURRENCY };
}

export function formatMoney(amount: number, currency: string = STORE_CURRENCY): string {
  try {
    return new Intl.NumberFormat(STORE_LOCALE, {
      style: "currency",
      currency,
      minimumFractionDigits: amount % 100 === 0 ? 0 : 2,
    }).format(amount / 100);
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency}`;
  }
}
