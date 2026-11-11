/**
 * Product catalog — the single place to change sizes, frames, prices,
 * shipping and currency. Shared by the storefront (display) and the order
 * API (authoritative pricing), so it must stay free of React, DOM and
 * path-alias imports.
 *
 * All money values are integer minor units (centimes of a dirham).
 */

export const STORE_NAME = "Noria";
export const STORE_CURRENCY = "MAD";
export const STORE_LOCALE = "fr-MA";

export type Orientation = "portrait" | "landscape";
export type FrameId = "none" | "black" | "white" | "oak";

export interface PrintSize {
  id: string;
  label: string;
  /** Short-side × long-side in centimetres (portrait orientation). */
  widthCm: number;
  heightCm: number;
  /** Shape in portrait, e.g. [3, 4]; flipped for landscape. */
  ratio: [number, number];
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

/**
 * Formats for custom map posters (the studio): one print size per shape,
 * each offered in portrait and landscape (3:4 / 4:3, 5:7 / 7:5, …).
 * 40×60 and 40×50 prices were set from surface area; adjust freely.
 */
export const PRINT_SIZES: PrintSize[] = [
  { id: "30x40", label: "30 × 40 cm", widthCm: 30, heightCm: 40, ratio: [3, 4], price: 19900, framePrice: 17900, popular: true },
  { id: "50x70", label: "50 × 70 cm", widthCm: 50, heightCm: 70, ratio: [5, 7], price: 29900, framePrice: 29900 },
  { id: "40x60", label: "40 × 60 cm", widthCm: 40, heightCm: 60, ratio: [2, 3], price: 25900, framePrice: 24900 },
  { id: "21x30", label: "21 × 30 cm", widthCm: 21, heightCm: 30, ratio: [7, 10], price: 14900, framePrice: 14900 },
  { id: "40x50", label: "40 × 50 cm", widthCm: 40, heightCm: 50, ratio: [4, 5], price: 22900, framePrice: 21900 },
];

/** Sizes sold before the formats above; old carts and links map onto the 7:10 shape. */
const LEGACY_SIZE_IDS: Record<string, string> = { a4: "21x30", a3: "21x30" };

const findSize = (sizeId: string) =>
  PRINT_SIZES.find((size) => size.id === (LEGACY_SIZE_IDS[sizeId] ?? sizeId));

export const FRAME_OPTIONS: FrameOption[] = [
  { id: "none", label: "Print only", description: "Unframed print, rolled and shipped in a tube.", swatch: "transparent" },
  { id: "black", label: "Black frame", description: "Matte black aluminium with acrylic glazing.", swatch: "#1d1d1b" },
  { id: "white", label: "White frame", description: "Soft white wood with acrylic glazing.", swatch: "#f3f1ec" },
  { id: "oak", label: "Oak frame", description: "Natural oak veneer with acrylic glazing.", swatch: "#b98b5a" },
];

export const PAPER_DESCRIPTION = "200 g/m² matte paper, printed with pigment inks.";

export const SHIPPING_FLAT = 3500;
export const FREE_SHIPPING_THRESHOLD = 40000;
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
  return findSize(sizeId) ?? PRINT_SIZES[0];
}

export function getFrame(frameId: string): FrameOption {
  return FRAME_OPTIONS.find((frame) => frame.id === frameId) ?? FRAME_OPTIONS[0];
}

export function isValidProduct(options: unknown): options is ProductOptions {
  if (!options || typeof options !== "object") return false;
  const value = options as Record<string, unknown>;
  return (
    typeof value.sizeId === "string" &&
    !!findSize(value.sizeId) &&
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

/** "3:4" in portrait, "4:3" in landscape. */
export function formatRatio(sizeId: string, orientation: Orientation): string {
  const [short, long] = getPrintSize(sizeId).ratio;
  return orientation === "landscape" ? `${long}:${short}` : `${short}:${long}`;
}

export function unitPrice(options: ProductOptions): number {
  const size = getPrintSize(options.sizeId);
  return size.price + (options.frameId === "none" ? 0 : size.framePrice);
}

export function describeProduct(options: ProductOptions): string {
  const size = getPrintSize(options.sizeId);
  const frame = getFrame(options.frameId);
  const orientation = options.orientation === "landscape" ? "Landscape" : "Portrait";
  return `${formatRatio(size.id, options.orientation)} ${orientation} · ${size.label} · ${frame.label}`;
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

/**
 * Formats minor units for display. Dirhams read "1 299 DH" (or "1 299 درهم"
 * in Arabic), the way prices are written in Morocco; other currencies, such
 * as older orders, fall back to Intl.
 */
export function formatMoney(
  amount: number,
  currency: string = STORE_CURRENCY,
  language: "en" | "fr" | "ar" = "fr",
): string {
  const value = amount / 100;
  if (currency === "MAD") {
    const digits = amount % 100 === 0 ? 0 : 2;
    const number = new Intl.NumberFormat("fr-MA", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value);
    return language === "ar" ? `${number} درهم` : `${number} DH`;
  }
  try {
    return new Intl.NumberFormat(language === "en" ? "en-IE" : "fr-FR", {
      style: "currency",
      currency,
      minimumFractionDigits: amount % 100 === 0 ? 0 : 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}
