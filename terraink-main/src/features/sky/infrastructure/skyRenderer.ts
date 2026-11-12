import tzlookup from "@photostructure/tz-lookup";
import {
  localSiderealTime,
  parseLocalDateTime,
  projectHorizontal,
  starSize,
  toHorizontal,
} from "@/features/sky/domain/astronomy";
import type { SkyColors, SkyDisc } from "@/features/sky/domain/chart";
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
}

/** Draws the poster background and the round chart of the sky. */
export function drawSkyChart(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  catalog: SkyCatalog,
  options: SkyChartOptions,
): void {
  const { disc, colors } = options;
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

  // The chart disc.
  ctx.beginPath();
  ctx.arc(disc.cx, disc.cy, disc.r, 0, Math.PI * 2);
  ctx.fillStyle = colors.disc;
  ctx.fill();
  ctx.save();
  ctx.clip();

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

  // Rim.
  ctx.beginPath();
  ctx.arc(disc.cx, disc.cy, disc.r, 0, Math.PI * 2);
  ctx.strokeStyle = colors.ring;
  ctx.lineWidth = Math.max(1, unit * 2.2);
  ctx.stroke();
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
