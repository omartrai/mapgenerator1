/**
 * Layout and colours of the round star chart on a night-sky poster,
 * derived from the poster layout and theme so it matches the map posters.
 */
import type { PosterLayoutSpec } from "@/features/poster/domain/posterLayout";
import {
  CITY_FONT_BASE_PX,
  MESSAGE_FONT_BASE_PX,
  TEXT_DIMENSION_REFERENCE_PX,
} from "@/features/poster/domain/textLayout";
import { parseHex } from "@/shared/utils/color";

export interface SkyDisc {
  /** Centre and radius in pixels of the poster. */
  cx: number;
  cy: number;
  r: number;
}

/** Highest point (0–1 of the height) used by the layout's text. */
function textTop(layout: PosterLayoutSpec): number {
  const slots = [layout.city, layout.country, layout.coords];
  const lowSlots = slots.filter((slot) => slot.y > 0.5).map((slot) => slot.y);
  return lowSlots.length ? Math.min(...lowSlots) - (layout.cityStyle.case === "spaced" ? 0.07 : 0.05) : 1;
}

/** Where the star chart sits: inside the layout's map window, above its text. */
export function skyDisc(layout: PosterLayoutSpec, width: number, height: number): SkyDisc {
  const window = layout.mapWindow ?? { x: 0, y: 0, w: 1, h: textTop(layout) };
  const top = layout.mapWindow ? window.y : 0;
  const bottom = layout.mapWindow ? window.y + window.h : Math.min(textTop(layout), layout.band ? layout.band.top : 1);
  const w = window.w * width;
  const h = (bottom - top) * height;
  const r = Math.min(w, h) * 0.43;
  return { cx: (window.x + window.w / 2) * width, cy: (top + (bottom - top) / 2) * height + (layout.mapWindow ? 0 : height * 0.012), r };
}

/** Smallest gap (share of the height) worth putting the message in. */
const MIN_MESSAGE_GAP = 0.035;
/** Share of the gap the message's font size fills at the smallest size. */
const MESSAGE_GAP_FILL = 0.5;

/**
 * Text layout of a night-sky poster: the personal message moves from the
 * small line at the foot of the poster into the space between the star
 * chart and the city name, set large enough to fill it. Layouts without
 * such a space are returned unchanged.
 */
export function skyTextLayout(layout: PosterLayoutSpec, width: number, height: number): PosterLayoutSpec {
  if (!width || !height || layout.activity || layout.city.y < 0.5) return layout;
  const disc = skyDisc(layout, width, height);
  const shortSide = Math.min(width, height);
  const toRef = (heightShare: number) => (heightShare * height * TEXT_DIMENSION_REFERENCE_PX) / shortSide;
  const discBottom = (disc.cy + disc.r) / height;
  const cityPx = (CITY_FONT_BASE_PX * layout.scale.city * shortSide) / TEXT_DIMENSION_REFERENCE_PX;
  const cityTop = layout.city.y - (0.6 * cityPx) / height;
  const gap = cityTop - discBottom;
  if (gap < MIN_MESSAGE_GAP) return layout;
  const scale = Math.min(2.4, Math.max(1, toRef(gap * MESSAGE_GAP_FILL) / MESSAGE_FONT_BASE_PX));
  return {
    ...layout,
    message: { x: 0.5, y: discBottom + gap / 2, align: "center", fixed: true },
    scale: { ...layout.scale, message: scale },
  };
}

/** Outline of the star chart. */
export const SKY_SHAPES = ["circle", "heart", "star", "square"] as const;
export type SkyShape = (typeof SKY_SHAPES)[number];

export function toSkyShape(value: string | undefined): SkyShape {
  return (SKY_SHAPES as readonly string[]).includes(value ?? "") ? (value as SkyShape) : "circle";
}

export interface SkyColors {
  paper: string;
  disc: string;
  star: string;
  ring: string;
}

function brightness(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) return 0.5;
  return (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
}

/**
 * The chart is always a night: its background is the darker of the theme's
 * paper and ink, stars the lighter. Dark themes give a full night poster,
 * light themes a night disc on light paper.
 */
export function skyColors(theme: { ui: { bg: string; text: string } }): SkyColors {
  const { bg, text } = theme.ui;
  const darkFirst = brightness(bg) <= brightness(text);
  return {
    paper: bg,
    disc: darkFirst ? bg : text,
    star: darkFirst ? text : bg,
    ring: text,
  };
}
