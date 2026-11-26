import type { MarkerProjectionInput } from "@/features/markers/domain/types";
import { projectMarkerToCanvas } from "@/features/markers/infrastructure/projection";
import { ROUTE_DASH_PATTERN } from "../domain/constants";
import type { Route } from "../domain/types";

export type RoutePointProjector = (
  lat: number,
  lon: number,
) => { x: number; y: number } | null;

interface DrawOptions {
  widthScale?: number;
}

export function drawRoutesWithProjector(
  ctx: CanvasRenderingContext2D,
  routes: Route[],
  project: RoutePointProjector,
  { widthScale = 1 }: DrawOptions = {},
): void {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const marks: { route: Route; width: number }[] = [];

  for (const route of routes) {
    if (!route.visible || route.segments.length === 0) continue;

    const width = Math.max(0.5, route.strokeWidth * widthScale);
    ctx.lineWidth = width;
    ctx.strokeStyle = route.color;
    ctx.globalAlpha = route.opacity;
    if (route.lineStyle === "dashed") {
      ctx.setLineDash([ROUTE_DASH_PATTERN[0] * width, ROUTE_DASH_PATTERN[1] * width]);
    } else {
      ctx.setLineDash([]);
    }

    if (route.kmMarks && route.kmMarks > 0) {
      marks.push({ route, width });
    }

    for (const segment of route.segments) {
      if (segment.length < 2) continue;
      ctx.beginPath();
      let started = false;
      for (const { lat, lon } of segment) {
        const projected = project(lat, lon);
        if (!projected) {
          started = false;
          continue;
        }
        if (!started) {
          ctx.moveTo(projected.x, projected.y);
          started = true;
        } else {
          ctx.lineTo(projected.x, projected.y);
        }
      }
      ctx.stroke();
    }
  }

  // Kilometre dots on top of every line, numbered.
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  for (const { route, width } of marks) drawKmMarks(ctx, route, project, width);

  ctx.restore();
}

const EARTH_RADIUS_M = 6_371_008.8;
function metresBetween(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** A small white dot with a dark ring every route.kmMarks km, and its number beside it. */
function drawKmMarks(ctx: CanvasRenderingContext2D, route: Route, project: RoutePointProjector, width: number): void {
  const base = (route.kmMarks ?? 0) * 1000;
  if (base <= 0) return;
  // A known race keeps its official distance: space the dots along the
  // drawn line in proportion (e.g. a marathon run as two laps of one loop).
  const official = route.stats?.distanceM ?? 0;
  let measured = 0;
  for (const segment of route.segments)
    for (let i = 1; i < segment.length; i += 1) measured += metresBetween(segment[i - 1], segment[i]);
  const ratio = official > 0 && measured > 0 ? measured / official : 1;
  const step = base * ratio;
  const radius = Math.max(2, width * 0.95);
  const fontSize = Math.max(6, width * 2.4);
  let walked = 0;
  let next = step;
  ctx.font = `600 ${fontSize}px "IBM Plex Mono", ui-monospace, monospace`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  for (const segment of route.segments) {
    for (let i = 1; i < segment.length; i += 1) {
      const a = segment[i - 1];
      const b = segment[i];
      const d = metresBetween(a, b);
      while (d > 0 && walked + d >= next) {
        const t = (next - walked) / d;
        const at = project(a.lat + (b.lat - a.lat) * t, a.lon + (b.lon - a.lon) * t);
        if (at) {
          ctx.beginPath();
          ctx.arc(at.x, at.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.fill();
          ctx.lineWidth = Math.max(1, width * 0.4);
          ctx.strokeStyle = "#1a1a1a";
          ctx.stroke();
          const label = String(Math.round(next / ratio / 1000));
          ctx.lineWidth = Math.max(1.5, fontSize * 0.28);
          ctx.strokeStyle = "rgba(255,255,255,0.85)";
          ctx.strokeText(label, at.x + radius * 1.6, at.y);
          ctx.fillStyle = "#1a1a1a";
          ctx.fillText(label, at.x + radius * 1.6, at.y);
        }
        next += step;
      }
      walked += d;
    }
  }
}

export function drawRoutesOnCanvas(
  ctx: CanvasRenderingContext2D,
  routes: Route[],
  projection: MarkerProjectionInput,
  scaleX = 1,
  scaleY = 1,
  sizeScale = 1,
): void {
  const widthScale = ((scaleX + scaleY) / 2) * sizeScale;
  drawRoutesWithProjector(
    ctx,
    routes,
    (lat, lon) => {
      const { x, y } = projectMarkerToCanvas(lat, lon, projection);
      return { x: x * scaleX, y: y * scaleY };
    },
    { widthScale },
  );
}
