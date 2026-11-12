/**
 * Poster layouts: where the text sits and what frames it (fades, a double
 * border, a label box or a band under the map). One spec per layout is
 * read by both the live preview (DOM) and the print renderer (canvas), so
 * the two always match.
 *
 * Positions are ratios of the poster height (y) or width (x); sizes marked
 * "ref px" are on the 3600 px reference used by textLayout.ts, i.e. they
 * scale with the poster's shorter side.
 */
import {
  TEXT_CITY_Y_RATIO,
  TEXT_COORDS_Y_RATIO,
  TEXT_COUNTRY_Y_RATIO,
  TEXT_DIVIDER_Y_RATIO,
  TEXT_MESSAGE_Y_RATIO,
} from "./textLayout";

export const POSTER_LAYOUTS = ["classic", "border", "label", "band", "fade"] as const;
export type PosterLayoutId = (typeof POSTER_LAYOUTS)[number];
export const DEFAULT_POSTER_LAYOUT: PosterLayoutId = "classic";

export interface TextSlot {
  x: number;
  y: number;
  align: "center" | "left" | "right";
}

export interface PosterLayoutSpec {
  /** Fade heights (ratio of height) at the top and bottom; 0 = none. */
  fades: { top: number; bottom: number };
  /** Double rule inset from the edges, with the poster colour outside it. */
  border: null | {
    /** Distance from the edge to the outer rule, ratio of the shorter side. */
    inset: number;
    /** Gap between the two rules, ratio of the shorter side. */
    gap: number;
    outerWidth: number; // ref px
    innerWidth: number; // ref px
  };
  /** Solid box behind the text. */
  box: null | { top: number; bottom: number; width: number; fill: string; text: string };
  /** Solid band under the map with a heavy rule on top. */
  band: null | { top: number; rule: number /* ref px */ };
  city: TextSlot;
  country: TextSlot;
  coords: TextSlot;
  message: TextSlot;
  /** Short rule between city and country; null = none. */
  divider: null | { y: number };
  /** Rules on both sides of the country instead of the divider. */
  countryRules: null | { length: number; gap: number /* ratios of the shorter side */ };
  /** Font size multipliers against the classic layout. */
  scale: { city: number; country: number; coords: number; message: number };
  /** Max text line width, ratio of the poster width. */
  maxWidth: number;
}

const center = (y: number): TextSlot => ({ x: 0.5, y, align: "center" });

const CLASSIC: PosterLayoutSpec = {
  fades: { top: 0.25, bottom: 0.25 },
  border: null,
  box: null,
  band: null,
  city: center(TEXT_CITY_Y_RATIO),
  country: center(TEXT_COUNTRY_Y_RATIO),
  coords: center(TEXT_COORDS_Y_RATIO),
  message: center(TEXT_MESSAGE_Y_RATIO),
  divider: { y: TEXT_DIVIDER_Y_RATIO },
  countryRules: null,
  scale: { city: 1, country: 1, coords: 1, message: 1 },
  maxWidth: 0.86,
};

export const POSTER_LAYOUT_SPECS: Record<PosterLayoutId, PosterLayoutSpec> = {
  classic: CLASSIC,

  /** Thin double rule around the map; country between two rules. */
  border: {
    ...CLASSIC,
    fades: { top: 0, bottom: 0.3 },
    border: { inset: 0.022, gap: 0.011, outerWidth: 14, innerWidth: 5 },
    city: center(0.82),
    country: center(0.87),
    coords: center(0.905),
    message: center(0.937),
    divider: null,
    countryRules: { length: 0.11, gap: 0.035 },
    scale: { city: 1, country: 0.85, coords: 0.95, message: 0.95 },
    maxWidth: 0.8,
  },

  /** No fades; a small white label at the bottom carries the text. */
  label: {
    ...CLASSIC,
    fades: { top: 0, bottom: 0 },
    box: { top: 0.835, bottom: 0.955, width: 0.4, fill: "#ffffff", text: "#111111" },
    city: center(0.868),
    country: center(0.898),
    coords: center(0.925),
    message: center(0.945),
    divider: null,
    scale: { city: 0.5, country: 0.5, coords: 0.75, message: 0.6 },
    maxWidth: 0.34,
  },

  /** Map on top, a solid band underneath with the text set flush left. */
  band: {
    ...CLASSIC,
    fades: { top: 0, bottom: 0 },
    band: { top: 0.855, rule: 26 },
    city: { x: 0.045, y: 0.893, align: "left" },
    country: { x: 0.045, y: 0.928, align: "left" },
    coords: { x: 0.045, y: 0.958, align: "left" },
    message: { x: 0.955, y: 0.928, align: "right" },
    divider: null,
    scale: { city: 0.55, country: 0.75, coords: 0.9, message: 0.75 },
    maxWidth: 0.6,
  },

  /** Map melts into the paper at the bottom under a large title. */
  fade: {
    ...CLASSIC,
    fades: { top: 0, bottom: 0.42 },
    city: center(0.835),
    divider: null,
    country: center(0.885),
    coords: center(0.92),
    message: center(0.952),
    scale: { city: 1.1, country: 1, coords: 1, message: 1 },
  },
};

export function getPosterLayout(id: string | undefined | null): PosterLayoutSpec {
  return POSTER_LAYOUT_SPECS[(POSTER_LAYOUTS as readonly string[]).includes(id ?? "") ? (id as PosterLayoutId) : DEFAULT_POSTER_LAYOUT];
}

export function isPosterLayoutId(id: unknown): id is PosterLayoutId {
  return typeof id === "string" && (POSTER_LAYOUTS as readonly string[]).includes(id);
}
