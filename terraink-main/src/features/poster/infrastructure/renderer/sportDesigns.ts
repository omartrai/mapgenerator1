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
  /** "31.6295° N / 7.9811° W" of the map centre (bib design). */
  coords?: string;
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

  /** Small line icons for the bib design's stats (calendar, route pin, clock). */
  const icon = (kind: number, cx: number, cy: number, size: number, color: string) => {
    const r = size * unit;
    const x = width * cx;
    const y = height * cy;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, 4 * unit);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    if (kind === 0) {
      // Calendar
      ctx.rect(x - r, y - r * 0.8, r * 2, r * 1.8);
      ctx.moveTo(x - r, y - r * 0.3);
      ctx.lineTo(x + r, y - r * 0.3);
      ctx.moveTo(x - r * 0.5, y - r * 1.1);
      ctx.lineTo(x - r * 0.5, y - r * 0.6);
      ctx.moveTo(x + r * 0.5, y - r * 1.1);
      ctx.lineTo(x + r * 0.5, y - r * 0.6);
      ctx.stroke();
      ctx.fillStyle = color;
      for (let row = 0; row < 2; row += 1)
        for (let col = 0; col < 3; col += 1)
          ctx.fillRect(x - r * 0.62 + col * r * 0.5, y + row * r * 0.48 - r * 0.02, r * 0.24, r * 0.24);
    } else if (kind === 1) {
      // Map pin with a small flag
      ctx.arc(x - r * 0.3, y - r * 0.35, r * 0.5, Math.PI * 0.85, Math.PI * 2.15);
      ctx.lineTo(x - r * 0.3, y + r * 0.9);
      ctx.closePath();
      ctx.moveTo(x + r * 0.45, y + r * 0.9);
      ctx.lineTo(x + r * 0.45, y - r * 0.9);
      ctx.lineTo(x + r * 1.1, y - r * 0.65);
      ctx.lineTo(x + r * 0.45, y - r * 0.4);
      ctx.stroke();
    } else {
      // Clock
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.moveTo(x, y - r * 0.6);
      ctx.lineTo(x, y);
      ctx.lineTo(x + r * 0.45, y + r * 0.25);
      ctx.stroke();
    }
    ctx.restore();
  };

  /** Fixed labels in the site language (the page's lang attribute). */
  const lang = typeof document !== "undefined" ? document.documentElement.lang : "fr";
  const L = (en: string, fr: string, ar: string) => (lang === "en" ? en : lang === "ar" ? ar : fr);
  const profile = print?.profile ?? [];

  /** Elevation profile in a box (ratios): outline only, or filled. */
  const drawProfile = (box: { x: number; y: number; w: number; h: number }, color: string, filled: boolean) => {
    if (profile.length < 2) return;
    const min = Math.min(...profile);
    const max = Math.max(...profile);
    const range = Math.max(max - min, 20);
    const x0 = width * box.x;
    const y0 = height * box.y;
    const w = width * box.w;
    const h = height * box.h;
    ctx.save();
    ctx.beginPath();
    profile.forEach((ele, i) => {
      const x = x0 + (w * i) / (profile.length - 1);
      const y = y0 + h - (h * 0.9 * (ele - min)) / range;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    if (filled) {
      ctx.lineTo(x0 + w, y0 + h);
      ctx.lineTo(x0, y0 + h);
      ctx.closePath();
      ctx.fillStyle = withAlpha(color, 0.28);
      ctx.fill();
    }
    ctx.strokeStyle = withAlpha(color, filled ? 0.7 : 0.55);
    ctx.lineWidth = Math.max(1, 3 * unit);
    ctx.stroke();
    ctx.fillStyle = withAlpha(color, 0.4);
    ctx.fillRect(x0, y0 + h, w, Math.max(1, 2 * unit));
    ctx.restore();
  };
  const elevationRange = () => {
    if (profile.length < 2) return "";
    return `${Math.round(Math.min(...profile))} M ${L("TO", "À", "إلى")} ${Math.round(Math.max(...profile))} M`;
  };
  const clock = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const sec = seconds % 60;
    const two = (v: number) => String(v).padStart(2, "0");
    return h ? `${h}:${two(m)}:${two(sec)}` : `${m}:${two(sec)}`;
  };

  if (input.design === "elevation") {
    const ink = input.text;
    const red = accent;
    // The map melts into the paper above the profile.
    const fadeTop = height * 0.46;
    const fade = ctx.createLinearGradient(0, fadeTop, 0, height * 0.6);
    fade.addColorStop(0, withAlpha(input.paper, 0));
    fade.addColorStop(1, input.paper);
    ctx.fillStyle = fade;
    ctx.fillRect(0, fadeTop, width, height * 0.6 - fadeTop + 1);
    drawProfile({ x: 0.08, y: 0.6, w: 0.84, h: 0.045 }, ink, false);
    text(L("ELEVATION", "ALTITUDE", "الارتفاع"), 0.08, 0.657, { size: 26, weight: 600, align: "left", color: ink, alpha: 0.6, spacing: 0.1, font: input.bodyFont });
    text(elevationRange(), 0.92, 0.657, { size: 26, weight: 600, align: "right", color: ink, alpha: 0.6, spacing: 0.1, font: input.bodyFont });
    text(title.toUpperCase(), 0.5, 0.715, { size: 300, weight: 800, color: ink, spacing: 0.06, maxWidth: 0.86 });
    text(date ? date.toUpperCase() : "", 0.5, 0.765, { size: 44, weight: 500, color: ink, alpha: 0.75, spacing: 0.16, font: input.bodyFont, maxWidth: 0.86 });
    rule(0.465, 0.535, 0.79, red, 1, 5);
    text(name.toUpperCase(), 0.5, 0.82, { size: 96, weight: 700, color: ink, spacing: 0.04, maxWidth: 0.8 });
    text(big, 0.5, 0.865, { size: 170, weight: 700, color: red, maxWidth: 0.8 });
    const when = [print?.date ?? "", bib ? `BIB ${bib.replace(/^#/, "")}` : ""].filter(Boolean).join("   ·   ");
    text(when, 0.5, 0.905, { size: 42, weight: 500, color: ink, alpha: 0.7, spacing: 0.14, font: input.bodyFont, maxWidth: 0.86 });
    text(place.toUpperCase(), 0.5, 0.955, { size: 34, weight: 500, color: ink, alpha: 0.6, spacing: 0.2, font: input.bodyFont, maxWidth: 0.86 });
    return;
  }

  if (input.design === "archive") {
    const ink = input.text;
    const red = accent;
    const mono = input.bodyFont;
    // Header: brand · archive, and the date.
    text(`NORIA   ${L("RACE ARCHIVE", "ARCHIVE DES COURSES", "أرشيف السباقات")}`, 0.07, 0.05, { size: 28, weight: 500, align: "left", color: ink, alpha: 0.7, spacing: 0.08, font: mono });
    text((print?.date ?? "").toUpperCase(), 0.93, 0.05, { size: 30, weight: 600, align: "right", color: ink, spacing: 0.06, font: mono });
    rule(0.07, 0.93, 0.066, ink, 0.8, 3);
    text(title.toUpperCase(), 0.07, 0.115, { size: 330, weight: 800, align: "left", color: ink, maxWidth: 0.86 });
    // City with a red square, then the coordinates.
    const squareX = width * 0.07;
    const squareY = height * 0.162;
    const sq = 22 * unit;
    ctx.fillStyle = red;
    ctx.fillRect(squareX, squareY - sq / 2, sq, sq);
    text(`${place.toUpperCase()}     ${input.coords ?? ""}`, 0.07 + (sq * 1.8) / width, 0.162, { size: 30, weight: 500, align: "left", color: ink, alpha: 0.75, spacing: 0.06, font: mono, maxWidth: 0.8 });
    // Corner ticks round the map, and a north arrow.
    ctx.save();
    ctx.strokeStyle = withAlpha(ink, 0.7);
    ctx.lineWidth = Math.max(1, 3 * unit);
    const box = { x: width * 0.06, y: height * 0.2, w: width * 0.88, h: height * 0.42 };
    const tick = 40 * unit;
    ctx.beginPath();
    for (const [cx, cy, dx, dy] of [
      [box.x, box.y, 1, 1],
      [box.x + box.w, box.y, -1, 1],
      [box.x, box.y + box.h, 1, -1],
      [box.x + box.w, box.y + box.h, -1, -1],
    ]) {
      ctx.moveTo(cx + dx * tick, cy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx, cy + dy * tick);
    }
    ctx.stroke();
    ctx.restore();
    text("N", 0.925, 0.225, { size: 30, weight: 700, color: ink, alpha: 0.7, font: mono });
    // Elevation profile.
    text(L("ELEVATION", "ALTITUDE", "الارتفاع"), 0.07, 0.638, { size: 24, weight: 600, align: "left", color: ink, alpha: 0.6, spacing: 0.1, font: mono });
    text(elevationRange(), 0.93, 0.638, { size: 24, weight: 600, align: "right", color: ink, alpha: 0.6, spacing: 0.06, font: mono });
    drawProfile({ x: 0.07, y: 0.65, w: 0.86, h: 0.05 }, ink, true);
    // Finisher and finish time.
    rule(0.07, 0.93, 0.73, ink, 0.8, 3);
    text(L("FINISHER", "FINISHER", "المتسابق"), 0.07, 0.745, { size: 24, weight: 600, align: "left", color: ink, alpha: 0.55, spacing: 0.1, font: mono });
    text(L("FINISH TIME", "TEMPS FINAL", "الوقت النهائي"), 0.93, 0.745, { size: 24, weight: 600, align: "right", color: ink, alpha: 0.55, spacing: 0.1, font: mono });
    text(name.toUpperCase(), 0.07, 0.785, { size: 130, weight: 800, align: "left", color: ink, maxWidth: 0.5 });
    text(big, 0.93, 0.783, { size: 230, weight: 800, align: "right", color: red, maxWidth: 0.42 });
    rule(0.07, 0.93, 0.822, ink, 0.8, 3);
    // Four results with thin separators.
    const cols = stats.slice(0, 4);
    const colW = 0.86 / Math.max(1, cols.length);
    cols.forEach((stat, i) => {
      const x = 0.07 + colW * i;
      if (i > 0) rule(x - 0.005, x - 0.003, 0.85, ink, 0.5, 60);
      text(stat.label.toUpperCase(), x + 0.008, 0.838, { size: 22, weight: 600, align: "left", color: ink, alpha: 0.55, spacing: 0.08, font: mono, maxWidth: colW - 0.02 });
      text(stat.value.toUpperCase(), x + 0.008, 0.865, { size: 72, weight: 800, align: "left", color: ink, maxWidth: colW - 0.02 });
    });
    // 5 km splits from the GPX.
    const splits = (print?.splits ?? []).slice(0, 8);
    if (splits.length) {
      rule(0.07, 0.93, 0.89, ink, 0.8, 3);
      const sw = 0.86 / splits.length;
      splits.forEach((secs, i) => {
        const x = 0.07 + sw * i + 0.004;
        text(`${(i + 1) * 5}K`, x, 0.905, { size: 22, weight: 600, align: "left", color: ink, alpha: 0.55, font: mono, maxWidth: sw - 0.01 });
        text(clock(secs), x, 0.925, { size: 28, weight: 600, align: "left", color: ink, font: mono, maxWidth: sw - 0.01 });
      });
    }
    return;
  }

  if (input.design === "bib") {
    const ink = input.text;
    text(name.toUpperCase(), 0.5, 0.075, { size: 64, weight: 600, color: ink, spacing: 0.06, maxWidth: 0.7 });
    // The bib number overlaps the top of the map: a paper halo keeps it readable.
    if (big) {
      ctx.save();
      const size = 540 * unit;
      ctx.font = `800 ${size}px ${input.titleFont}`;
      const limit = width * 0.78;
      const measured = ctx.measureText(big).width;
      const fitted = measured > limit ? size * (limit / measured) : size;
      ctx.font = `800 ${fitted}px ${input.titleFont}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";
      ctx.lineWidth = fitted * 0.12;
      ctx.strokeStyle = input.paper;
      ctx.strokeText(big, width / 2, height * 0.165);
      ctx.fillStyle = ink;
      ctx.fillText(big, width / 2, height * 0.165);
      ctx.restore();
    }
    // Title in spaced capitals, on two lines when it is long.
    const words = title.toUpperCase().split(/\s+/).filter(Boolean);
    const lines =
      words.length > 1 && title.length > 14
        ? [words.slice(0, Math.ceil(words.length / 2)).join(" "), words.slice(Math.ceil(words.length / 2)).join(" ")]
        : [words.join(" ")];
    lines.forEach((line, i) => {
      text(line, 0.5, (lines.length > 1 ? 0.725 : 0.745) + i * 0.045, { size: 150, weight: 700, color: ink, spacing: 0.12, maxWidth: 0.82 });
    });
    text(input.coords ?? "", 0.5, 0.815, { size: 40, weight: 400, color: ink, alpha: 0.6, spacing: 0.08, font: input.bodyFont });
    rule(0.36, 0.64, 0.84, ink, 0.9, 6);
    stats.slice(0, 3).forEach((stat, i, list) => {
      const cx = 0.5 + (i - (list.length - 1) / 2) * 0.24;
      icon(i, cx, 0.873, 42, ink);
      text(stat.label.toUpperCase(), cx, 0.913, { size: 54, weight: 700, color: ink, maxWidth: 0.22 });
      text(stat.value, cx, 0.94, { size: 50, weight: 400, color: ink, alpha: 0.65, font: input.bodyFont, maxWidth: 0.22 });
    });
    return;
  }

  if (input.design === "green") {
    const ink = input.text;
    // Soft shade at the top and bottom so the text stays readable on the map.
    const shade = (y0: number, y1: number, fromTop: boolean) => {
      const g = ctx.createLinearGradient(0, height * y0, 0, height * y1);
      g.addColorStop(fromTop ? 0 : 1, withAlpha(input.paper, 0.92));
      g.addColorStop(fromTop ? 1 : 0, withAlpha(input.paper, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, height * y0, width, height * (y1 - y0));
    };
    shade(0, 0.22, true);
    shade(0.76, 1, false);
    text(title.toUpperCase(), 0.07, 0.072, { size: 300, weight: 800, align: "left", color: ink, maxWidth: 0.6 });
    text(place.toUpperCase(), 0.07, 0.122, { size: 110, weight: 700, align: "left", color: ink, alpha: 0.85, maxWidth: 0.6 });
    text(big, 0.93, 0.072, { size: 150, weight: 700, align: "right", color: ink, maxWidth: 0.3 });
    text(date.toUpperCase(), 0.07, 0.162, { size: 42, weight: 600, align: "left", color: ink, alpha: 0.85, spacing: 0.05, font: input.bodyFont, maxWidth: 0.86 });
    stats.slice(0, 3).forEach((stat, i, list) => {
      const cx = 0.5 + (i - (list.length - 1) / 2) * 0.26;
      text(stat.label.toUpperCase(), cx, 0.84, { size: 34, weight: 500, color: ink, alpha: 0.7, spacing: 0.08, font: input.bodyFont, maxWidth: 0.24 });
      text(stat.value, cx, 0.865, { size: 70, weight: 700, color: ink, maxWidth: 0.24 });
    });
    text(name.toUpperCase(), 0.07, 0.93, { size: 100, weight: 800, align: "left", color: ink, maxWidth: 0.55 });
    text(bib ? `BIB ${bib.startsWith("#") ? bib : `#${bib}`}` : "", 0.93, 0.93, { size: 44, weight: 600, align: "right", color: ink, alpha: 0.75, font: input.bodyFont, maxWidth: 0.3 });
    return;
  }

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
