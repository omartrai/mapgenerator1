import type { FrameDepth, FrameId, FramedPriceTable } from "./catalog.js";

/**
 * Ready-made posters from the print partner's catalogue (UrbanArt), as shown
 * in the shop. Only customer-facing fields are kept: reseller cost, product
 * cost and shipping cost never leave the server.
 */

export interface CollectionVariant {
  /** Position in the partner's variant list (needed to order it later). */
  index: number;
  /** e.g. "40x60". */
  size: string;
  withMat: boolean;
  /** Frame moulding depth in cm (1.5 or 3). */
  frameDepthCm: number;
  /** Suggested retail price, in centimes (MAD). */
  price: number;
  /** Frame colours this variant comes in (shop frame ids). */
  colors: FrameId[];
}

/** A collection poster as it sits in the cart or an order. */
export interface CollectionLine {
  productId: number;
  variantIndex: number;
  title: string;
  /** e.g. "50x70". */
  size: string;
  withMat: boolean;
  frameDepthCm: number;
  frameColor: FrameId;
  /** Picture shown in the cart and the order. */
  image: string;
  /** Retail price shown to the customer; the server re-checks it. */
  price: number;
}

/** UrbanArt colour names → shop frame ids. */
const COLOR_IDS: Record<string, FrameId> = {
  oak: "oak",
  chene: "oak",
  white: "white",
  blanc: "white",
  grey: "grey",
  gray: "grey",
  gris: "grey",
  noyer: "walnut",
  walnut: "walnut",
  black: "black",
  noir: "black",
};
const FRAME_ORDER: FrameId[] = ["oak", "white", "grey", "walnut", "black"];

function toColors(raw: unknown): FrameId[] {
  const list = Array.isArray(raw) ? raw : [];
  const ids = new Set(list.map((entry) => COLOR_IDS[text(entry).toLowerCase()]).filter(Boolean));
  const colors = FRAME_ORDER.filter((id) => ids.has(id));
  return colors.length ? colors : ["black"];
}

export interface CollectionProduct {
  id: number;
  title: string;
  category: string;
  image: string;
  sizes: string[];
  /** Lowest variant price, in centimes. */
  fromPrice: number;
  variants: CollectionVariant[];
  /** First room mockups (for the card and its hover view); may be empty. */
  mockups?: string[];
}

export interface CollectionMockup {
  id: number;
  url: string;
}

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const httpsUrl = (value: unknown) => {
  const url = text(value);
  return /^https:\/\//i.test(url) ? url : "";
};

/** Maps one raw catalogue product; returns null when it can't be shown. */
export function toCollectionProduct(raw: unknown): CollectionProduct | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Record<string, unknown>;
  const id = Number(source.id);
  const title = text(source.title);
  const image = httpsUrl(source.image);
  if (!Number.isInteger(id) || id <= 0 || !title || !image) return null;

  const variants: CollectionVariant[] = [];
  (Array.isArray(source.variants) ? source.variants : []).forEach((entry, index) => {
    if (!entry || typeof entry !== "object") return;
    const variant = entry as Record<string, unknown>;
    const price = Math.round(Number(variant.retail_price) * 100);
    const size = text(variant.size);
    if (!size || !Number.isFinite(price) || price <= 0) return;
    variants.push({
      index,
      size,
      withMat: Number(variant.with_mat) === 1,
      frameDepthCm: Number(variant.frame_weight) || 0,
      price,
      colors: toColors(variant.allColors),
    });
  });
  if (variants.length === 0) return null;

  const sizes = [...new Set(variants.map((variant) => variant.size))].sort(
    (a, b) => sizeArea(a) - sizeArea(b),
  );

  return {
    id,
    title,
    category: text(source.category),
    image,
    sizes,
    fromPrice: Math.min(...variants.map((variant) => variant.price)),
    variants,
  };
}

export function toCollectionMockups(raw: unknown): CollectionMockup[] {
  const list = (raw as { mockups?: unknown })?.mockups;
  if (!Array.isArray(list)) return [];
  return list
    .map((entry) => ({ id: Number(entry?.id), url: httpsUrl(entry?.url) }))
    .filter((mockup) => Number.isInteger(mockup.id) && mockup.url);
}

/** "40x60" → 2400, used to sort sizes from small to large. */
export function sizeArea(size: string): number {
  const [width, height] = size.split(/x/i).map(Number);
  return (width || 0) * (height || 0);
}

/** "40x60" → { widthCm: 40, heightCm: 60 }. */
export function collectionDimensions(size: string): { widthCm: number; heightCm: number } {
  const [widthCm, heightCm] = size.split(/x/i).map(Number);
  return { widthCm: widthCm || 50, heightCm: heightCm || 70 };
}

/** "40x60" → "40 × 60 cm". */
export function formatCollectionSize(size: string): string {
  const [width, height] = size.split(/x/i);
  return height ? `${width} × ${height} cm` : size;
}

/* ── Shop categories ── */

/**
 * UrbanArt files every product under "Posters", so the shop groups them by
 * rules on the title. Add keywords here as the catalogue grows; any extra
 * category UrbanArt sends is added automatically (see categoriesFor).
 */
const MAP_WORDS = /\b(map|carte|plan)\b/i;
const MOROCCO_WORDS =
  /maroc|morocco|marrakech|marrakesh|casablanca|rabat|f[eè]s\b|tanger|tangier|chefchaouen|essaouira|agadir|kasbah|blue city|palmeraie|maghreb|azure|atlas|nazar|riad|medina|zellige/i;

export const RULE_CATEGORIES = [
  { id: "maps", match: (product: CollectionProduct) => MAP_WORDS.test(product.title) },
  { id: "morocco", match: (product: CollectionProduct) => MOROCCO_WORDS.test(product.title) },
  { id: "art", match: (product: CollectionProduct) => !MAP_WORDS.test(product.title) },
] as const;

export type RuleCategoryId = (typeof RULE_CATEGORIES)[number]["id"];

export interface ShopCategory {
  id: string;
  /** Translation key for rule categories; raw label for partner categories. */
  label: string;
  isRule: boolean;
  count: number;
}

const slug = (value: string) =>
  value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function matchesCategory(product: CollectionProduct, categoryId: string): boolean {
  if (!categoryId || categoryId === "all") return true;
  const rule = RULE_CATEGORIES.find((entry) => entry.id === categoryId);
  if (rule) return rule.match(product);
  return `cat-${slug(product.category)}` === categoryId;
}

/** Non-empty categories, rule ones first, then the partner's own if it uses several. */
export function categoriesFor(products: CollectionProduct[]): ShopCategory[] {
  const result: ShopCategory[] = RULE_CATEGORIES.map((rule) => ({
    id: rule.id,
    label: `cat.${rule.id}`,
    isRule: true,
    count: products.filter(rule.match).length,
  })).filter((category) => category.count > 0);

  const partner = [...new Set(products.map((product) => product.category).filter(Boolean))];
  if (partner.length > 1) {
    for (const name of partner) {
      result.push({
        id: `cat-${slug(name)}`,
        label: name,
        isRule: false,
        count: products.filter((product) => product.category === name).length,
      });
    }
  }
  return result;
}

/**
 * Framed prices per size / depth / passe-partout as the collection sells them:
 * the most common price across posters (lowest on a tie), so one odd listing
 * does not move every studio price.
 */
export function framedPricesFromCollection(products: CollectionProduct[]): FramedPriceTable {
  const counts = new Map<string, Map<number, number>>();
  for (const product of products) {
    for (const variant of product.variants) {
      const depth: FrameDepth | null =
        variant.frameDepthCm === 1.5 ? "1.5" : variant.frameDepthCm === 3 ? "3" : null;
      if (!depth || !Number.isInteger(variant.price) || variant.price <= 0) continue;
      const key = `${variant.size}|${depth}|${variant.withMat ? "mat" : "plain"}`;
      const prices = counts.get(key) ?? new Map<number, number>();
      prices.set(variant.price, (prices.get(variant.price) ?? 0) + 1);
      counts.set(key, prices);
    }
  }
  const pick = (key: string) => {
    const prices = counts.get(key);
    if (!prices) return null;
    return [...prices.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
  };
  const table: FramedPriceTable = {};
  const sizes = new Set([...counts.keys()].map((key) => key.split("|")[0]));
  for (const size of sizes) {
    for (const depth of ["1.5", "3"] as FrameDepth[]) {
      const plain = pick(`${size}|${depth}|plain`);
      const mat = pick(`${size}|${depth}|mat`);
      if (plain !== null && mat !== null) {
        table[size] = { ...table[size], [depth]: { plain, mat } };
      }
    }
  }
  return table;
}
