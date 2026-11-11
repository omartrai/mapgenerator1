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
}

const p = (preset: Omit<DesignPreset, "image">): DesignPreset => ({
  ...preset,
  image: `/showcase/${preset.id}.webp`,
});

export const DESIGN_PRESETS: DesignPreset[] = [
  p({ id: "paris", city: "Paris", country: "France", location: "Paris, Île-de-France, France", lat: 48.8566, lon: 2.3522, distance: 4200, theme: "carrara", themeLabel: "Carrara", fontFamily: "Playfair Display", product: { sizeId: "30x40", orientation: "portrait", frameId: "oak" } }),
  p({ id: "new-york", city: "New York", country: "United States", location: "New York, United States", lat: 40.7484, lon: -73.9857, distance: 5200, theme: "midnight_blue", themeLabel: "Midnight Blue", fontFamily: "", product: { sizeId: "30x40", orientation: "portrait", frameId: "black" } }),
  p({ id: "marrakech", city: "Marrakech", country: "Morocco", location: "Marrakech, Morocco", lat: 31.6295, lon: -7.9811, distance: 3600, theme: "terracotta", themeLabel: "Terracotta", fontFamily: "Montserrat", product: { sizeId: "a3", orientation: "portrait", frameId: "white" } }),
  p({ id: "tokyo", city: "Tokyo", country: "Japan", location: "Tokyo, Japan", lat: 35.6762, lon: 139.7003, distance: 4800, theme: "japanese_ink", themeLabel: "Japanese Ink", fontFamily: "Noto Sans JP", product: { sizeId: "30x40", orientation: "portrait", frameId: "white" } }),
  p({ id: "lisbon", city: "Lisbon", country: "Portugal", location: "Lisbon, Portugal", lat: 38.7139, lon: -9.1394, distance: 3400, theme: "ocean", themeLabel: "Ocean", fontFamily: "Raleway", product: { sizeId: "a4", orientation: "portrait", frameId: "oak" } }),
  p({ id: "amsterdam", city: "Amsterdam", country: "Netherlands", location: "Amsterdam, Netherlands", lat: 52.3728, lon: 4.8936, distance: 3000, theme: "sage", themeLabel: "Sage", fontFamily: "Lato", product: { sizeId: "50x70", orientation: "portrait", frameId: "black" } }),
];

export function getPreset(id: string | null | undefined): DesignPreset | null {
  return DESIGN_PRESETS.find((preset) => preset.id === id) ?? null;
}
