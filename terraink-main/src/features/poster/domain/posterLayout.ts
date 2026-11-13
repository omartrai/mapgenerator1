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

export const POSTER_LAYOUTS = ["classic", "border", "label", "band", "fade", "header", "script", "signature", "activity"] as const;
export type PosterLayoutId = (typeof POSTER_LAYOUTS)[number];
export const DEFAULT_POSTER_LAYOUT: PosterLayoutId = "classic";

export interface TextSlot {
  x: number;
  y: number;
  align: "center" | "left" | "right";
  /** Keep the line centred on y even when it is set larger (see messageCenterY). */
  fixed?: boolean;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** How the city name is set. */
export interface CityStyle {
  /** "spaced": upper case with wide letter spacing; "upper": capitals; "plain": as typed. */
  case: "spaced" | "upper" | "plain";
  /** Font family for the city; null = the poster font chosen by the customer. */
  family: string | null;
  weight: number;
}

/** Script faces (self-hosted, see core/fonts). */
export const SCRIPT_FONTS = { elegant: "Great Vibes", brush: "Caveat Brush" } as const;

export interface PosterLayoutSpec {
  /** The map shows only inside this window; paper fills the rest. null = full bleed. */
  mapWindow: null | Rect;
  cityStyle: CityStyle;
  /** Country set in spaced capitals (header layouts). */
  countrySpaced: boolean;
  /** Sport poster parts (activity layout): accent rules, profile and stats. */
  activity: null | {
    /** Short accent rules under the title and above the closing line. */
    accentRules: number[];
    accentRuleWidth: number; // ratio of width
    subtitleY: number;
    profile: Rect;
    stats: { x: number; w: number; valueY: number; labelY: number };
  };
  /** Full-width hairline rule (header layout); y and x ratios, width in ref px. */
  rule: null | { y: number; x1: number; x2: number; width: number };
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
  mapWindow: null,
  cityStyle: { case: "spaced", family: null, weight: 700 },
  countrySpaced: false,
  activity: null,
  rule: null,
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

  /** Big title over a rule at the top; the map sits in paper margins below. */
  header: {
    ...CLASSIC,
    fades: { top: 0, bottom: 0 },
    mapWindow: { x: 0.045, y: 0.2, w: 0.91, h: 0.765 },
    cityStyle: { case: "plain", family: null, weight: 800 },
    countrySpaced: true,
    rule: { y: 0.138, x1: 0.045, x2: 0.955, width: 5 },
    city: { x: 0.045, y: 0.088, align: "left" },
    country: { x: 0.955, y: 0.1, align: "right" },
    coords: { x: 0.045, y: 0.168, align: "left" },
    message: { x: 0.955, y: 0.168, align: "right" },
    divider: null,
    scale: { city: 1.05, country: 0.6, coords: 0.75, message: 0.7 },
    maxWidth: 0.6,
  },

  /** Handwritten title at the top left, place details at the right. */
  script: {
    ...CLASSIC,
    fades: { top: 0, bottom: 0 },
    mapWindow: { x: 0.045, y: 0.12, w: 0.91, h: 0.845 },
    cityStyle: { case: "plain", family: SCRIPT_FONTS.elegant, weight: 400 },
    countrySpaced: true,
    city: { x: 0.04, y: 0.062, align: "left" },
    country: { x: 0.955, y: 0.048, align: "right" },
    coords: { x: 0.955, y: 0.08, align: "right" },
    message: { x: 0.955, y: 0.105, align: "right" },
    divider: null,
    scale: { city: 0.8, country: 0.6, coords: 0.85, message: 0.6 },
    maxWidth: 0.5,
  },

  /** Map on top in paper margins, a brush-lettered title signed underneath. */
  signature: {
    ...CLASSIC,
    fades: { top: 0, bottom: 0 },
    mapWindow: { x: 0.045, y: 0.045, w: 0.91, h: 0.83 },
    cityStyle: { case: "plain", family: SCRIPT_FONTS.brush, weight: 400 },
    countrySpaced: true,
    city: { x: 0.045, y: 0.935, align: "left" },
    country: { x: 0.955, y: 0.918, align: "right" },
    coords: { x: 0.955, y: 0.948, align: "right" },
    message: { x: 0.5, y: 0.975, align: "center" },
    divider: null,
    scale: { city: 0.95, country: 0.6, coords: 0.85, message: 0.55 },
    maxWidth: 0.5,
  },

  /** Sport poster: race title, route map, elevation profile and stats. */
  activity: {
    ...CLASSIC,
    fades: { top: 0, bottom: 0 },
    mapWindow: { x: 0.1, y: 0.185, w: 0.8, h: 0.465 },
    cityStyle: { case: "upper", family: null, weight: 600 },
    city: { x: 0.5, y: 0.082, align: "center" },
    message: { x: 0.5, y: 0.935, align: "center" },
    divider: null,
    scale: { city: 0.4, country: 1, coords: 1, message: 0.62 },
    maxWidth: 0.8,
    activity: {
      accentRules: [0.11, 0.905],
      accentRuleWidth: 0.05,
      subtitleY: 0.135,
      profile: { x: 0.1, y: 0.665, w: 0.8, h: 0.075 },
      stats: { x: 0.1, w: 0.8, valueY: 0.8, labelY: 0.828 },
    },
  },
};

/* ── Map shapes: the map shows only inside a circle, heart or star ── */

export const MAP_SHAPES = ["none", "circle", "heart", "star"] as const;
export type MapShapeId = (typeof MAP_SHAPES)[number];

/** Where a shape sits when the layout has no map window: above the poster text. */
const SHAPE_REGION: Rect = { x: 0.06, y: 0.05, w: 0.88, h: 0.71 };

const n = (value: number) => Math.round(value * 100) / 100;

/** SVG path of the shape, fitted (square) and centred in the box. */
export function shapePath(shape: MapShapeId, box: { x: number; y: number; w: number; h: number }): string {
  const size = Math.min(box.w, box.h);
  const x0 = box.x + (box.w - size) / 2;
  const y0 = box.y + (box.h - size) / 2;
  const cx = x0 + size / 2;
  const cy = y0 + size / 2;
  if (shape === "circle") {
    const r = size / 2;
    return `M${n(cx - r)} ${n(cy)}A${n(r)} ${n(r)} 0 1 0 ${n(cx + r)} ${n(cy)}A${n(r)} ${n(r)} 0 1 0 ${n(cx - r)} ${n(cy)}Z`;
  }
  if (shape === "heart") {
    // Unit heart, 1 wide and 0.92 tall, centred vertically.
    const p = (x: number, y: number) => `${n(x0 + x * size)} ${n(y0 + (y + 0.04) * size)}`;
    return [
      `M${p(0.5, 0.92)}`,
      `C${p(0.2, 0.7)} ${p(0, 0.52)} ${p(0, 0.3)}`,
      `C${p(0, 0.12)} ${p(0.14, 0)} ${p(0.29, 0)}`,
      `C${p(0.4, 0)} ${p(0.47, 0.07)} ${p(0.5, 0.16)}`,
      `C${p(0.53, 0.07)} ${p(0.6, 0)} ${p(0.71, 0)}`,
      `C${p(0.86, 0)} ${p(1, 0.12)} ${p(1, 0.3)}`,
      `C${p(1, 0.52)} ${p(0.8, 0.7)} ${p(0.5, 0.92)}Z`,
    ].join("");
  }
  if (shape === "star") {
    const outer = size / 2;
    const inner = outer * 0.45;
    // Nudge down so the star's visual centre sits in the box.
    const sy = cy + outer * 0.1;
    const points = Array.from({ length: 10 }, (_, i) => {
      const r = i % 2 === 0 ? outer : inner;
      const angle = -Math.PI / 2 + (i * Math.PI) / 5;
      return `${n(cx + r * Math.cos(angle))} ${n(sy + r * Math.sin(angle))}`;
    });
    return `M${points.join("L")}Z`;
  }
  return "";
}

/**
 * Path (in pixels of a width × height poster) covering everything that is
 * paper rather than map: the whole poster minus the map window or shape.
 * Fill it with the paper colour using the even-odd rule. null = full bleed.
 */
export function paperMaskPath(
  layout: PosterLayoutSpec,
  shape: string | undefined,
  width: number,
  height: number,
): string | null {
  const shapeId = (MAP_SHAPES as readonly string[]).includes(shape ?? "") ? (shape as MapShapeId) : "none";
  const window = layout.mapWindow;
  if (shapeId === "none" && !window) return null;
  const outer = `M0 0H${n(width)}V${n(height)}H0Z`;
  const region = window ?? SHAPE_REGION;
  const box = { x: region.x * width, y: region.y * height, w: region.w * width, h: region.h * height };
  if (shapeId === "none") {
    return `${outer}M${n(box.x)} ${n(box.y)}H${n(box.x + box.w)}V${n(box.y + box.h)}H${n(box.x)}Z`;
  }
  return `${outer}${shapePath(shapeId, box)}`;
}

/** Fades only make sense on a full-bleed map. */
export function effectiveFades(layout: PosterLayoutSpec, shape: string | undefined) {
  return layout.mapWindow || (shape && shape !== "none") ? { top: 0, bottom: 0 } : layout.fades;
}

/** City text as printed. */
export function cityText(layout: PosterLayoutSpec, city: string, spaced: (value: string) => string): string {
  if (layout.cityStyle.case === "spaced") return spaced(city);
  return layout.cityStyle.case === "upper" ? city.toUpperCase() : city;
}

/** "MOROCCO" → "M O R O C C O" when the layout spaces it. */
export function countryText(layout: PosterLayoutSpec, country: string): string {
  const upper = country.toUpperCase();
  return layout.countrySpaced ? upper.split("").join(" ") : upper;
}

/** Sport layout type sizes, in ref px (see textLayout.ts). */
export const ACTIVITY_TYPE = {
  subtitle: 46,
  statValue: 92,
  statLabel: 38,
  accentRule: 6,
} as const;

export function getPosterLayout(id: string | undefined | null): PosterLayoutSpec {
  return POSTER_LAYOUT_SPECS[(POSTER_LAYOUTS as readonly string[]).includes(id ?? "") ? (id as PosterLayoutId) : DEFAULT_POSTER_LAYOUT];
}

export function isPosterLayoutId(id: unknown): id is PosterLayoutId {
  return typeof id === "string" && (POSTER_LAYOUTS as readonly string[]).includes(id);
}
