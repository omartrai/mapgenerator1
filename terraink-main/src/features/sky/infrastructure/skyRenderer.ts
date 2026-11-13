import tzlookup from "@photostructure/tz-lookup";
import {
  localSiderealTime,
  parseLocalDateTime,
  projectHorizontal,
  starSize,
  toHorizontal,
} from "@/features/sky/domain/astronomy";
import type { SkyColors, SkyDisc, SkyShape } from "@/features/sky/domain/chart";
import { shapePath } from "@/features/poster/domain/posterLayout";
import { withAlpha } from "@/shared/utils/color";

/**
 * Star catalogue (d3-celestial data, BSD licence): stars to magnitude 6 as
 * flat [ra, dec, mag…] triples, constellation lines as flat [ra, dec…]
 * polylines and the Milky Way as rings per brightness level. Loaded only
 * when a night-sky poster is shown.
 */
export interface SkyCatalog {
  stars: number[];
  lines: number[][];
  milkyWay: number[][][];
}

let catalogPromise: Promise<SkyCatalog> | null = null;

export function loadSkyCatalog(): Promise<SkyCatalog> {
  catalogPromise ??= Promise.all([
    import("@/data/sky/stars.json"),
    import("@/data/sky/constellations.json"),
    import("@/data/sky/milkyway.json"),
  ]).then(([stars, lines, milkyWay]) => ({
    stars: stars.default as number[],
    lines: lines.default as number[][],
    milkyWay: milkyWay.default as number[][][],
  }));
  return catalogPromise;
}

/** IANA time zone at a place (e.g. "Africa/Casablanca"). */
export function timeZoneAt(lat: number, lon: number): string {
  try {
    return tzlookup(lat, lon);
  } catch {
    return "UTC";
  }
}

function zoneOffsetMs(time: number, zone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(time));
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"));
  return asUtc - Math.floor(time / 1000) * 1000;
}

/**
 * The instant (UTC ms) of a wall-clock time at a place — "the 12 June 2021
 * at 22:30 in Marrakech" — using that place's time zone and daylight time.
 */
export function skyInstant(localDateTime: string, lat: number, lon: number): number {
  const parts = parseLocalDateTime(localDateTime);
  if (!parts) return Date.now();
  const zone = timeZoneAt(lat, lon);
  const guess = Date.UTC(parts.y, parts.m - 1, parts.d, parts.h, parts.min);
  try {
    const first = guess - zoneOffsetMs(guess, zone);
    return guess - zoneOffsetMs(first, zone);
  } catch {
    return guess - (Math.round(lon / 15) * 3600000);
  }
}

export interface SkyChartOptions {
  lat: number;
  lon: number;
  /** UTC timestamp, ms. */
  time: number;
  disc: SkyDisc;
  colors: SkyColors;
  showLines: boolean;
  showGrid: boolean;
  showMilkyWay: boolean;
  /** Outline of the chart (circle by default). */
  shape?: SkyShape;
}

/**
 * A curled-up newborn, facing right, built from overlapping ellipses in a
 * unit square (x right, y down). Drawn as one shape (non-zero fill).
 * [cx, cy, rx, ry, rotation in degrees]
 */
const BABY_PARTS: [number, number, number, number, number][] = [
  [0.5, 0.19, 0.15, 0.155, 0], // head
  [0.45, 0.35, 0.14, 0.11, -12], // neck and shoulders
  [0.355, 0.56, 0.19, 0.26, -8], // back and belly
  [0.37, 0.785, 0.185, 0.125, 14], // bottom
  [0.55, 0.6, 0.185, 0.115, -40], // thigh, knee up
  [0.6, 0.8, 0.165, 0.07, 14], // lower leg
  [0.755, 0.765, 0.062, 0.043, -40], // foot
  [0.545, 0.43, 0.095, 0.06, 35], // hands at the chin
];

/** Fine lines inside the baby (arm, leg), in the same unit square: M x y Q cx cy x y. */
const BABY_LINES: number[][] = [
  [0.41, 0.385, 0.47, 0.46, 0.585, 0.44], // arm folded to the chin
  [0.39, 0.66, 0.52, 0.6, 0.69, 0.47], // top of the thigh
  [0.47, 0.745, 0.6, 0.76, 0.735, 0.74], // lower leg
  [0.52, 0.205, 0.545, 0.225, 0.575, 0.205], // closed eye
];

function babyLines(ctx: CanvasRenderingContext2D, box: { x: number; y: number; w: number; h: number }, color: string, width: number) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  for (const [x0, y0, cx, cy, x1, y1] of BABY_LINES) {
    ctx.beginPath();
    ctx.moveTo(box.x + x0 * box.w, box.y + y0 * box.h);
    ctx.quadraticCurveTo(box.x + cx * box.w, box.y + cy * box.h, box.x + x1 * box.w, box.y + y1 * box.h);
    ctx.stroke();
  }
}

function babyBox(disc: SkyDisc) {
  // A little smaller than the disc, so the dotted paper shows around it.
  const grow = -0.02;
  const box = { x: disc.cx - disc.r, y: disc.cy - disc.r, w: disc.r * 2, h: disc.r * 2 };
  return { x: box.x - box.w * grow, y: box.y - box.h * grow, w: box.w * (1 + grow * 2), h: box.h * (1 + grow * 2) };
}

function babyPath(box: { x: number; y: number; w: number; h: number }): Path2D {
  const path = new Path2D();
  for (const [cx, cy, rx, ry, rot] of BABY_PARTS) {
    const x = box.x + cx * box.w;
    const y = box.y + cy * box.h;
    path.moveTo(x + rx * box.w * Math.cos((rot * Math.PI) / 180), y + rx * box.w * Math.sin((rot * Math.PI) / 180));
    path.ellipse(x, y, rx * box.w, ry * box.h, (rot * Math.PI) / 180, 0, Math.PI * 2);
  }
  return path;
}

/** Light paper speckled with tiny dots, the same every time (seeded). */
function stipple(ctx: CanvasRenderingContext2D, area: { x: number; y: number; w: number; h: number }, color: string, unit: number) {
  let seed = 7;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const step = unit * 7;
  ctx.fillStyle = withAlpha(color, 0.55);
  const count = Math.round((area.w * area.h) / (step * step));
  for (let i = 0; i < count; i += 1) {
    ctx.beginPath();
    ctx.arc(area.x + random() * area.w, area.y + random() * area.h, unit * (0.7 + random() * 0.6), 0, Math.PI * 2);
    ctx.fill();
  }
}

const BABY_STAR = "#F1D27C";

/** The chart outline as a canvas path, in the square around the disc. */
function outlinePath(shape: SkyShape, disc: SkyDisc): Path2D {
  const box = { x: disc.cx - disc.r, y: disc.cy - disc.r, w: disc.r * 2, h: disc.r * 2 };
  if (shape === "baby") return babyPath(babyBox(disc));
  if (shape === "square") {
    const path = new Path2D();
    path.rect(box.x, box.y, box.w, box.h);
    return path;
  }
  if (shape === "heart" || shape === "star") {
    // A star needs a little more room than the circle to look as big.
    const grow = shape === "star" ? 0.06 : 0;
    const big = { x: box.x - box.w * grow, y: box.y - box.h * grow, w: box.w * (1 + grow * 2), h: box.h * (1 + grow * 2) };
    return new Path2D(shapePath(shape, big));
  }
  const path = new Path2D();
  path.arc(disc.cx, disc.cy, disc.r, 0, Math.PI * 2);
  return path;
}

/** Draws the poster background and the round chart of the sky. */
export function drawSkyChart(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  catalog: SkyCatalog,
  options: SkyChartOptions,
): void {
  const shape = options.shape ?? "circle";
  // A baby chart wears warm gold stars, like gilded foil.
  const colors = shape === "baby" ? { ...options.colors, star: BABY_STAR } : options.colors;
  const outline = outlinePath(shape, options.disc);
  // A square shows the whole sky down to the horizon in its corners.
  const disc = shape === "square" ? { ...options.disc, r: options.disc.r * Math.SQRT2 } : options.disc;
  const lst = localSiderealTime({ lat: options.lat, lon: options.lon, time: options.time });
  const project = (ra: number, dec: number) => {
    const { alt, az } = toHorizontal(ra, dec, options.lat, lst);
    const point = projectHorizontal(alt, az);
    return { x: disc.cx + point.x * disc.r, y: disc.cy + point.y * disc.r, alt, r: point.r };
  };
  const unit = disc.r / 400;

  ctx.save();
  ctx.fillStyle = colors.paper;
  ctx.fillRect(0, 0, width, height);

  if (shape === "baby") {
    // Dotted paper around the baby, with a clear margin hugging it.
    const short = Math.min(width, height);
    const dotUnit = short / 900;
    stipple(ctx, { x: width * 0.09, y: height * 0.07, w: width * 0.82, h: height * 0.73 }, colors.disc, dotUnit);
    ctx.strokeStyle = colors.paper;
    ctx.lineWidth = short * 0.03;
    ctx.lineJoin = "round";
    ctx.stroke(outline);
    ctx.fillStyle = colors.paper;
    ctx.fill(outline);
  }

  // The chart area.
  ctx.fillStyle = colors.disc;
  ctx.fill(outline);
  ctx.save();
  ctx.clip(outline);

  if (options.showMilkyWay) {
    ctx.fillStyle = withAlpha(colors.star, 0.045);
    for (const level of catalog.milkyWay) {
      ctx.beginPath();
      for (const ring of level) {
        let first = true;
        for (let i = 0; i < ring.length; i += 2) {
          const p = project(ring[i], ring[i + 1]);
          // Far below the horizon the projection explodes; keep it bounded.
          const scale = p.r > 3 ? 3 / p.r : 1;
          const x = disc.cx + (p.x - disc.cx) * scale;
          const y = disc.cy + (p.y - disc.cy) * scale;
          if (first) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          first = false;
        }
        ctx.closePath();
      }
      ctx.fill("evenodd");
    }
  }

  if (options.showGrid) {
    ctx.strokeStyle = withAlpha(colors.star, 0.14);
    ctx.lineWidth = Math.max(0.6, unit * 0.8);
    for (const alt of [30, 60]) {
      const r = Math.tan(((90 - alt) * Math.PI) / 360) * disc.r;
      ctx.beginPath();
      ctx.arc(disc.cx, disc.cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let az = 0; az < 360; az += 45) {
      const a = (az * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(disc.cx, disc.cy);
      ctx.lineTo(disc.cx - Math.sin(a) * disc.r, disc.cy - Math.cos(a) * disc.r);
      ctx.stroke();
    }
  }

  if (options.showLines) {
    ctx.strokeStyle = withAlpha(colors.star, 0.55);
    ctx.lineWidth = Math.max(0.7, unit * 1.1);
    ctx.lineJoin = "round";
    for (const line of catalog.lines) {
      ctx.beginPath();
      let pen = false;
      for (let i = 0; i < line.length; i += 2) {
        const p = project(line[i], line[i + 1]);
        if (p.alt < -2) {
          pen = false;
          continue;
        }
        if (pen) ctx.lineTo(p.x, p.y);
        else ctx.moveTo(p.x, p.y);
        pen = true;
      }
      ctx.stroke();
    }
  }

  // Stars, faint first so bright ones sit on top.
  ctx.fillStyle = colors.star;
  const stars = catalog.stars;
  for (let i = 0; i < stars.length; i += 3) {
    const mag = stars[i + 2];
    const p = project(stars[i], stars[i + 1]);
    if (p.alt < 0) continue;
    const radius = starSize(mag) * unit * 0.55;
    if (mag < 1.6) {
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 4);
      glow.addColorStop(0, withAlpha(colors.star, 0.35));
      glow.addColorStop(1, withAlpha(colors.star, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.star;
    }
    ctx.globalAlpha = mag > 5 ? 0.7 : 1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(radius, unit * 0.35), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  // Rim (none around the baby: its edge is the paper margin), body lines instead.
  if (shape === "baby") {
    ctx.save();
    ctx.clip(outline);
    babyLines(ctx, babyBox(options.disc), withAlpha(colors.paper, 0.75), Math.max(1, unit * 2.4));
    ctx.restore();
    ctx.restore();
    return;
  }
  ctx.strokeStyle = colors.ring;
  ctx.lineWidth = Math.max(1, unit * 2.2);
  ctx.lineJoin = "round";
  ctx.stroke(outline);
  ctx.restore();
}

/** Renders a whole sky poster background into a new canvas. */
export async function renderSkyCanvas(width: number, height: number, options: SkyChartOptions): Promise<HTMLCanvasElement> {
  const catalog = await loadSkyCatalog();
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available.");
  drawSkyChart(ctx, width, height, catalog, options);
  return canvas;
}
