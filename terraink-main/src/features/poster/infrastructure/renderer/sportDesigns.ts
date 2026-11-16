/**
 * Sport and trail poster designs (race, bold, photorun, topo): everything
 * printed around the route. The live preview draws the same function on a
 * canvas laid over the map, so the preview and the print always match.
 *
 * Positions are ratios of the poster; sizes are ref px on the 3600 px
 * reference (they scale with the poster's shorter side, like textLayout).
 */
import type { ActivityPrint } from "@/features/poster/domain/activityPoster";
import {
  placePhotoCover,
  type PhotoFrame,
  type SportDesignId,
} from "@/features/poster/domain/posterLayout";
import { TEXT_DIMENSION_REFERENCE_PX } from "@/features/poster/domain/textLayout";
import { withAlpha } from "@/shared/utils/color";

export interface SportDesignInput {
  design: SportDesignId;
  /** Event or route title (the City field) and place line (the Country field). */
  title: string;
  place: string;
  print: ActivityPrint | undefined;
  /** Theme text and paper colours. */
  text: string;
  paper: string;
  /** Poster font, already wrapped with fallbacks. */
  titleFont: string;
  bodyFont: string;
}

interface TextOptions {
  size: number; // ref px
  weight?: number;
  align?: CanvasTextAlign;
  color: string;
  alpha?: number;
  font?: string;
  /** Max width, ratio of the poster width. */
  maxWidth?: number;
  /** Letter spacing, em. */
  spacing?: number;
}

export function drawSportDesign(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  input: SportDesignInput,
): void {
  const unit = Math.min(width, height) / TEXT_DIMENSION_REFERENCE_PX;
  const print = input.print;
  const stats = print?.stats ?? [];
  const accent = print?.accent || "#d62f2f";

  const text = (value: string, x: number, y: number, o: TextOptions) => {
    if (!value) return;
    const size = o.size * unit;
    const family = o.font ?? input.titleFont;
    const weight = o.weight ?? 400;
    const hasSpacing = "letterSpacing" in ctx;
    const spacingPx = (o.spacing ?? 0) * size;
    ctx.save();
    if (hasSpacing) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${spacingPx}px`;
    ctx.font = `${weight} ${size}px ${family}`;
    const limit = width * (o.maxWidth ?? 0.86);
    const measured = ctx.measureText(value).width;
    if (measured > limit && measured > 0) {
      const fitted = size * (limit / measured);
      if (hasSpacing) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${(o.spacing ?? 0) * fitted}px`;
      ctx.font = `${weight} ${fitted}px ${family}`;
    }
    ctx.fillStyle = o.color;
    ctx.globalAlpha = o.alpha ?? 1;
    ctx.textAlign = o.align ?? "center";
    ctx.textBaseline = "middle";
    // Canvas letter spacing also trails the last letter: nudge centred text back.
    const shift = hasSpacing && spacingPx && (o.align ?? "center") === "center" ? spacingPx / 2 : 0;
    ctx.fillText(value, width * x + shift, height * y);
    ctx.restore();
  };

  const rule = (x1: number, x2: number, y: number, color: string, alpha: number, weight = 3) => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    const h = Math.max(1, weight * unit);
    ctx.fillRect(width * x1, height * y - h / 2, width * (x2 - x1), h);
    ctx.restore();
  };

  /** Stats in equal columns: label above or below the value. */
  const statRow = (
    items: { value: string; label: string }[],
    box: { x: number; w: number; valueY: number; labelY: number },
    look: { value: number; label: number; color: string; labelAlpha: number; valueWeight: number; labelUpper?: boolean },
    separators?: { y1: number; y2: number },
  ) => {
    const column = box.w / Math.max(1, items.length);
    items.forEach((item, i) => {
      const cx = box.x + column * (i + 0.5);
      text(item.value, cx, box.valueY, {
        size: look.value,
        weight: look.valueWeight,
        color: look.color,
        maxWidth: column - 0.02,
      });
      text(look.labelUpper ? item.label.toUpperCase() : item.label, cx, box.labelY, {
        size: look.label,
        weight: 500,
        color: look.color,
        alpha: look.labelAlpha,
        font: input.bodyFont,
        maxWidth: column - 0.02,
      });
      if (separators && i > 0) {
        ctx.save();
        ctx.fillStyle = look.color;
        ctx.globalAlpha = 0.35;
        const w = Math.max(1, 3 * unit);
        const x = width * (box.x + column * i);
        ctx.fillRect(x - w / 2, height * separators.y1, w, height * (separators.y2 - separators.y1));
        ctx.restore();
      }
    });
  };

  const title = input.title.trim();
  const place = input.place.trim();
  const date = print?.subtitle ?? "";
  const name = print?.name ?? "";
  const bib = print?.bib ?? "";
  const big = print?.big ?? "";

  if (input.design === "race") {
    // The map melts into the paper at the top of its window.
    const top = height * 0.36;
    const fade = ctx.createLinearGradient(0, top, 0, top + height * 0.12);
    fade.addColorStop(0, input.paper);
    fade.addColorStop(1, withAlpha(input.paper, 0));
    ctx.fillStyle = fade;
    ctx.fillRect(0, top - 1, width, height * 0.12 + 1);
    const bottom = height * 0.86;
    const fadeOut = ctx.createLinearGradient(0, bottom - height * 0.08, 0, bottom);
    fadeOut.addColorStop(0, withAlpha(input.paper, 0));
    fadeOut.addColorStop(1, input.paper);
    ctx.fillStyle = fadeOut;
    ctx.fillRect(0, bottom - height * 0.08, width, height * 0.08 + 1);

    text(title, 0.5, 0.1, { size: 230, weight: 800, color: input.text, maxWidth: 0.84 });
    text(place.toUpperCase(), 0.5, 0.152, { size: 52, weight: 500, color: input.text, alpha: 0.7, spacing: 0.18, font: input.bodyFont });
    text(big, 0.5, 0.262, { size: 560, weight: 700, color: input.text, alpha: 0.07, maxWidth: 0.9 });
    text(name.toUpperCase(), 0.5, 0.262, { size: 130, weight: 800, color: accent, maxWidth: 0.8 });
    statRow(
      stats.slice(0, 3),
      { x: 0.08, w: 0.84, valueY: 0.952, labelY: 0.922 },
      { value: 70, label: 44, color: input.text, labelAlpha: 0.7, valueWeight: 700 },
    );
    return;
  }

  if (input.design === "bold") {
    const color = input.text;
    text(big, 0.065, 0.815, { size: 620, weight: 800, align: "left", color, maxWidth: 0.5 });
    text("KM", 0.072, 0.9, { size: 64, weight: 600, align: "left", color, alpha: 0.7, spacing: 0.2, font: input.bodyFont });
    text(title.toUpperCase(), 0.6, 0.77, { size: 110, weight: 800, align: "left", color, maxWidth: 0.35 });
    text(place.toUpperCase(), 0.6, 0.81, { size: 44, weight: 500, align: "left", color, alpha: 0.75, spacing: 0.15, font: input.bodyFont, maxWidth: 0.35 });
    text(date.toUpperCase(), 0.6, 0.845, { size: 44, weight: 600, align: "left", color, alpha: 0.75, font: input.bodyFont, maxWidth: 0.35 });
    text(name, 0.6, 0.9, { size: 56, weight: 600, align: "left", color, maxWidth: 0.35 });
    return;
  }

  if (input.design === "photorun") {
    const white = "#ffffff";
    text(name, 0.08, 0.075, { size: 78, weight: 700, align: "left", color: white, maxWidth: 0.42 });
    text(bib, 0.08, 0.105, { size: 58, weight: 400, align: "left", color: white, alpha: 0.85, maxWidth: 0.42 });
    text(place, 0.92, 0.075, { size: 78, weight: 700, align: "right", color: white, maxWidth: 0.42 });
    text(date, 0.92, 0.105, { size: 58, weight: 400, align: "right", color: white, alpha: 0.85, maxWidth: 0.42 });
    text(big, 0.5, 0.585, { size: 400, weight: 800, color: white, alpha: 0.72, maxWidth: 0.86 });
    rule(0.3, 0.7, 0.637, white, 0.45);
    text(title.toUpperCase(), 0.5, 0.672, { size: 92, weight: 500, color: white, alpha: 0.9, spacing: 0.04, maxWidth: 0.8 });
    rule(0.08, 0.92, 0.87, white, 0.45);
    const [left, right] = stats;
    if (left) {
      text(left.label, 0.08, 0.895, { size: 58, weight: 400, align: "left", color: white, alpha: 0.85, maxWidth: 0.4 });
      text(left.value, 0.08, 0.925, { size: 70, weight: 700, align: "left", color: white, maxWidth: 0.4 });
    }
    if (right) {
      text(right.label, 0.92, 0.895, { size: 58, weight: 400, align: "right", color: white, alpha: 0.85, maxWidth: 0.4 });
      text(right.value, 0.92, 0.925, { size: 70, weight: 700, align: "right", color: white, maxWidth: 0.4 });
    }
    return;
  }

  // Trail (topo): big title, subtitle, contour map, four stats.
  text(title, 0.5, 0.075, { size: 290, weight: 800, color: input.text, maxWidth: 0.86 });
  text(date, 0.5, 0.128, { size: 50, weight: 500, color: input.text, alpha: 0.7, font: input.bodyFont });
  statRow(
    stats.slice(0, 4),
    { x: 0.06, w: 0.88, valueY: 0.907, labelY: 0.937 },
    { value: 78, label: 36, color: input.text, labelAlpha: 0.6, valueWeight: 800 },
    { y1: 0.89, y2: 0.95 },
  );
}

/** Photorun: the photo covers the poster, darkened at the top and bottom for the text. */
export function drawPhotoBackdrop(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  photo: CanvasImageSource | null,
  frame: PhotoFrame,
  mono: boolean,
): void {
  ctx.save();
  if (photo) {
    const source = photo as HTMLImageElement;
    const sw = source.naturalWidth || (source.width as number);
    const sh = source.naturalHeight || (source.height as number);
    const spot = placePhotoCover(sw, sh, { x: 0, y: 0, w: width, h: height }, frame);
    if (mono) ctx.filter = "grayscale(1)";
    ctx.drawImage(photo, spot.x, spot.y, spot.w, spot.h);
    ctx.filter = "none";
  } else {
    // No photo yet: a dark slate so the white text stays readable.
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, "#5b6066");
    g.addColorStop(1, "#2a2d31");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  }
  const topShade = ctx.createLinearGradient(0, 0, 0, height * 0.22);
  topShade.addColorStop(0, "rgba(0,0,0,0.45)");
  topShade.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = topShade;
  ctx.fillRect(0, 0, width, height * 0.22);
  const bottomShade = ctx.createLinearGradient(0, height * 0.5, 0, height);
  bottomShade.addColorStop(0, "rgba(0,0,0,0)");
  bottomShade.addColorStop(1, "rgba(0,0,0,0.6)");
  ctx.fillStyle = bottomShade;
  ctx.fillRect(0, height * 0.5, width, height * 0.5);
  ctx.restore();
}
