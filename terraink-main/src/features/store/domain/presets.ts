import type { ProductOptions } from "./catalog.js";

/** Curated starting points shown on the storefront. */
export interface DesignPreset {
  id: string;
  city: string;
  country: string;
  location: string;
  lat: number;
  lon: number;
  distance: number;
  theme: string;
  themeLabel: string;
  fontFamily: string;
  product: ProductOptions;
  image: string;
  /** City names in French and Arabic, for the localised storefront. */
  names?: { fr?: string; ar?: string };
}

const p = (preset: Omit<DesignPreset, "image">): DesignPreset => ({
  ...preset,
  image: `/showcase/${preset.id}.webp`,
});

export const DESIGN_PRESETS: DesignPreset[] = [
  p({ id: "marrakech", city: "Marrakech", country: "Maroc", location: "Marrakech, Maroc", lat: 31.6295, lon: -7.9811, distance: 3600, theme: "terracotta", themeLabel: "Terracotta", fontFamily: "Montserrat", product: { sizeId: "40x60", orientation: "portrait", frameId: "white" }, names: { ar: "مراكش" } }),
  p({ id: "casablanca", city: "Casablanca", country: "Maroc", location: "Casablanca, Maroc", lat: 33.5898, lon: -7.6038, distance: 6000, theme: "midnight_blue", themeLabel: "Midnight Blue", fontFamily: "", product: { sizeId: "50x70", orientation: "portrait", frameId: "black" }, names: { ar: "الدار البيضاء" } }),
  p({ id: "chefchaouen", city: "Chefchaouen", country: "Maroc", location: "Chefchaouen, Maroc", lat: 35.1688, lon: -5.2636, distance: 1400, theme: "ocean", themeLabel: "Ocean", fontFamily: "Playfair Display", product: { sizeId: "40x50", orientation: "portrait", frameId: "white" }, names: { ar: "شفشاون" } }),
  p({ id: "fes", city: "Fès", country: "Maroc", location: "Fès, Maroc", lat: 34.0626, lon: -4.9790, distance: 2600, theme: "sandstone", themeLabel: "Sandstone", fontFamily: "Montserrat", product: { sizeId: "30x40", orientation: "portrait", frameId: "oak" }, names: { ar: "فاس" } }),
  p({ id: "rabat", city: "Rabat", country: "Maroc", location: "Rabat, Maroc", lat: 34.0209, lon: -6.8416, distance: 4200, theme: "rustic", themeLabel: "Rustic", fontFamily: "Raleway", product: { sizeId: "30x40", orientation: "portrait", frameId: "white" }, names: { ar: "الرباط" } }),
  p({ id: "tangier", city: "Tanger", country: "Maroc", location: "Tanger, Maroc", lat: 35.7720, lon: -5.8070, distance: 4200, theme: "copper_patina", themeLabel: "Copper Patina", fontFamily: "Lato", product: { sizeId: "21x30", orientation: "portrait", frameId: "oak" }, names: { ar: "طنجة" } }),
  p({ id: "paris", city: "Paris", country: "France", location: "Paris, Île-de-France, France", lat: 48.8566, lon: 2.3522, distance: 4200, theme: "carrara", themeLabel: "Carrara", fontFamily: "Playfair Display", product: { sizeId: "30x40", orientation: "portrait", frameId: "oak" } }),
  p({ id: "new-york", city: "New York", country: "United States", location: "New York, United States", lat: 40.7484, lon: -73.9857, distance: 5200, theme: "midnight_blue", themeLabel: "Midnight Blue", fontFamily: "", product: { sizeId: "30x40", orientation: "portrait", frameId: "black" } }),
  p({ id: "tokyo", city: "Tokyo", country: "Japan", location: "Tokyo, Japan", lat: 35.6762, lon: 139.7003, distance: 4800, theme: "japanese_ink", themeLabel: "Japanese Ink", fontFamily: "Noto Sans JP", product: { sizeId: "30x40", orientation: "portrait", frameId: "white" } }),
  p({ id: "lisbon", city: "Lisbon", country: "Portugal", location: "Lisbon, Portugal", lat: 38.7139, lon: -9.1394, distance: 3400, theme: "ocean", themeLabel: "Ocean", fontFamily: "Raleway", product: { sizeId: "21x30", orientation: "portrait", frameId: "oak" } }),
  p({ id: "amsterdam", city: "Amsterdam", country: "Netherlands", location: "Amsterdam, Netherlands", lat: 52.3728, lon: 4.8936, distance: 3000, theme: "sage", themeLabel: "Sage", fontFamily: "Lato", product: { sizeId: "50x70", orientation: "portrait", frameId: "black" } }),
  p({ id: "london", city: "London", country: "United Kingdom", location: "London, United Kingdom", lat: 51.5072, lon: -0.1276, distance: 5000, theme: "noir", themeLabel: "Noir", fontFamily: "", product: { sizeId: "30x40", orientation: "portrait", frameId: "oak" } }),
  p({ id: "barcelona", city: "Barcelona", country: "Spain", location: "Barcelona, Spain", lat: 41.3874, lon: 2.1686, distance: 3600, theme: "blush", themeLabel: "Blush", fontFamily: "Playfair Display", product: { sizeId: "40x60", orientation: "portrait", frameId: "white" } }),
];

export function getPreset(id: string | null | undefined): DesignPreset | null {
  return DESIGN_PRESETS.find((preset) => preset.id === id) ?? null;
}

export const MOROCCAN_PRESET_IDS = new Set([
  "casablanca",
  "marrakech",
  "chefchaouen",
  "fes",
  "rabat",
  "tangier",
]);
