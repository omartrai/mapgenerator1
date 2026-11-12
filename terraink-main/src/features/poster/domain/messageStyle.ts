/**
 * How the personal message is set: size, typeface and style. Shared by the
 * live preview and the print renderer so both draw the same line.
 */
import type { PosterLayoutSpec, TextSlot } from "./posterLayout";

export const MESSAGE_SIZES = [
  { id: "s", scale: 1 },
  { id: "m", scale: 1.4 },
  { id: "l", scale: 1.85 },
  { id: "xl", scale: 2.4 },
] as const;
export type MessageSize = (typeof MESSAGE_SIZES)[number]["id"];

/** family null = the poster's own font. `boost` evens out faces that run small. */
export const MESSAGE_FONTS = [
  { id: "poster", family: null, boost: 1 },
  { id: "elegant", family: "Great Vibes", boost: 1.45 },
  { id: "brush", family: "Caveat Brush", boost: 1.2 },
  { id: "serif", family: "Playfair Display", boost: 1 },
  { id: "sans", family: "Montserrat", boost: 1 },
] as const;
export type MessageFont = (typeof MESSAGE_FONTS)[number]["id"];

export const MESSAGE_STYLES = ["italic", "regular", "bold", "caps"] as const;
export type MessageStyle = (typeof MESSAGE_STYLES)[number];

export interface MessageLook {
  size?: string;
  font?: string;
  style?: string;
}

export interface MessageType {
  /** Multiplier on the layout's message size. */
  scale: number;
  /** Typeface for the message, or null for the poster font. */
  family: string | null;
  weight: number;
  italic: boolean;
  upper: boolean;
}

/** Reads the message look from a form; missing values keep the original look. */
export function messageLookFromForm(form: {
  messageSize?: string;
  messageFont?: string;
  messageStyle?: string;
}): MessageLook {
  return { size: form.messageSize, font: form.messageFont, style: form.messageStyle };
}

export function resolveMessageType(look: MessageLook | undefined, isSport: boolean): MessageType {
  const size = MESSAGE_SIZES.find((item) => item.id === look?.size) ?? MESSAGE_SIZES[0];
  const font = MESSAGE_FONTS.find((item) => item.id === look?.font) ?? MESSAGE_FONTS[0];
  const fallbackStyle: MessageStyle = isSport ? "caps" : "italic";
  const style = (MESSAGE_STYLES as readonly string[]).includes(look?.style ?? "")
    ? (look!.style as MessageStyle)
    : fallbackStyle;
  // Script faces have no italic or bold cut; they are already expressive.
  const script = font.id === "elegant" || font.id === "brush";
  return {
    scale: size.scale * font.boost,
    family: font.family,
    weight: style === "bold" ? 700 : style === "caps" ? (isSport ? 500 : 600) : 400,
    italic: style === "italic" && !script,
    upper: style === "caps",
  };
}

/** Rough half height of a line of text, as a share of its font size. */
const HALF_LINE = 0.55;

/**
 * Vertical centre (0–1 of the poster height) of the message line. A bigger
 * message in the lower text block grows downwards so it never covers the
 * coordinates above it, but stays inside the poster (or the label box).
 *
 * @param fontPx        message font size, in the same unit as `basePx`
 * @param basePx        the layout's normal message size in that unit
 * @param shortOverHeight poster short side divided by poster height
 * @param fontRefPx     the unit's reference length for the short side
 */
export function messageCenterY(
  slot: TextSlot,
  layout: PosterLayoutSpec,
  fontPx: number,
  basePx: number,
  shortOverHeight: number,
  fontRefPx: number,
): number {
  if (slot.y < 0.5 || fontPx <= basePx) return slot.y;
  const toHeight = (px: number) => (px / fontRefPx) * shortOverHeight;
  const grow = toHeight((fontPx - basePx) * HALF_LINE);
  const limit = (layout.box ? layout.box.bottom - 0.006 : 0.988) - toHeight(fontPx * HALF_LINE);
  return Math.max(slot.y, Math.min(slot.y + grow, limit));
}
