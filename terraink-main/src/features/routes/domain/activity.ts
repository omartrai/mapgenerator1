/**
 * Sport activity figures from a GPX track (run, ride, hike): distance,
 * elevation gain, elapsed time, pace or speed, date, and a resampled
 * elevation profile for the poster. Pure functions only.
 */

export interface TrackPoint {
  lat: number;
  lon: number;
  /** Elevation in metres, when the GPX has <ele>. */
  ele?: number;
  /** Epoch milliseconds, when the GPX has <time>. */
  time?: number;
}

export interface ActivityStats {
  distanceM: number;
  /** Total climb in metres (null without elevation data). */
  elevationGainM: number | null;
  /** Elapsed seconds from first to last timestamp (null without times). */
  durationS: number | null;
  /** ISO date of the first timestamp. */
  startDate: string | null;
  /** Elevation samples evenly spaced by distance (empty without elevation). */
  profile: number[];
}

const PROFILE_SAMPLES = 160;
/** Ignore climbs smaller than this between two counted points (GPS noise). */
const CLIMB_THRESHOLD_M = 3;
const EARTH_RADIUS_M = 6_371_008.8;

function distanceBetween(a: TrackPoint, b: TrackPoint): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function computeActivityStats(segments: TrackPoint[][]): ActivityStats {
  let distanceM = 0;
  let gain = 0;
  let hasEle = false;
  let firstTime: number | null = null;
  let lastTime: number | null = null;
  const samples: { at: number; ele: number }[] = [];

  for (const segment of segments) {
    let anchor: number | null = null; // last elevation counted for the climb
    for (let i = 0; i < segment.length; i += 1) {
      const point = segment[i];
      if (i > 0) distanceM += distanceBetween(segment[i - 1], point);
      if (typeof point.time === "number" && Number.isFinite(point.time)) {
        firstTime = firstTime === null ? point.time : Math.min(firstTime, point.time);
        lastTime = lastTime === null ? point.time : Math.max(lastTime, point.time);
      }
      if (typeof point.ele === "number" && Number.isFinite(point.ele)) {
        hasEle = true;
        samples.push({ at: distanceM, ele: point.ele });
        // Hysteresis: the reference only moves after a real change, so
        // GPS jitter around a level never adds up to climbing.
        if (anchor === null) anchor = point.ele;
        else if (point.ele - anchor >= CLIMB_THRESHOLD_M) {
          gain += point.ele - anchor;
          anchor = point.ele;
        } else if (anchor - point.ele >= CLIMB_THRESHOLD_M) anchor = point.ele;
      }
    }
  }

  return {
    distanceM,
    elevationGainM: hasEle ? Math.round(gain) : null,
    durationS: firstTime !== null && lastTime !== null && lastTime > firstTime ? Math.round((lastTime - firstTime) / 1000) : null,
    startDate: firstTime !== null ? new Date(firstTime).toISOString() : null,
    profile: resampleProfile(samples, distanceM),
  };
}

/** Elevation every 1/PROFILE_SAMPLES of the distance (linear interpolation). */
function resampleProfile(samples: { at: number; ele: number }[], total: number): number[] {
  if (samples.length < 2 || total <= 0) return [];
  const out: number[] = [];
  let j = 0;
  for (let i = 0; i < PROFILE_SAMPLES; i += 1) {
    const at = (total * i) / (PROFILE_SAMPLES - 1);
    while (j < samples.length - 2 && samples[j + 1].at < at) j += 1;
    const a = samples[j];
    const b = samples[j + 1];
    const span = b.at - a.at;
    const t = span > 0 ? Math.min(1, Math.max(0, (at - a.at) / span)) : 0;
    out.push(Math.round((a.ele + (b.ele - a.ele) * t) * 10) / 10);
  }
  return out;
}

/* ── Formatting (poster text) ── */

const decimal = (value: number, digits: number, comma: boolean) => {
  const text = value.toFixed(digits);
  return comma ? text.replace(".", ",") : text;
};

const two = (value: number) => String(value).padStart(2, "0");

/** 13527 → "3:45:27"; 1520 → "25:20". */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h > 0 ? `${h}:${two(m)}:${two(s)}` : `${m}:${two(s)}`;
}

/** Faster than this it is a ride: show speed instead of pace. */
const RIDE_SPEED_KMH = 16;

export interface StatField {
  value: string;
  label: string;
}

export interface StatLabels {
  distance: string;
  time: string;
  pace: string;
  speed: string;
  elevation: string;
}

/** The four stats printed on the poster, in the customer's number format. */
export function activityStatFields(stats: ActivityStats, labels: StatLabels, comma: boolean): StatField[] {
  const km = stats.distanceM / 1000;
  const fields: StatField[] = [{ value: `${decimal(km, km >= 100 ? 1 : 2, comma)} km`, label: labels.distance }];
  if (stats.durationS) {
    fields.push({ value: formatDuration(stats.durationS), label: labels.time });
    const speed = km / (stats.durationS / 3600);
    if (speed >= RIDE_SPEED_KMH) {
      fields.push({ value: `${decimal(speed, 1, comma)} km/h`, label: labels.speed });
    } else if (km > 0) {
      fields.push({ value: `${formatDuration(Math.round(stats.durationS / km))} /km`, label: labels.pace });
    }
  }
  if (stats.elevationGainM !== null) {
    fields.push({ value: `${Math.round(stats.elevationGainM)} m`, label: labels.elevation });
  }
  return fields.slice(0, 4);
}

/** "42,20 KM  |  24.09.2023" */
export function activitySubtitle(stats: ActivityStats, comma: boolean): string {
  const km = stats.distanceM / 1000;
  const parts = [`${decimal(km, km >= 100 ? 1 : 2, comma)} KM`];
  if (stats.startDate) {
    const d = new Date(stats.startDate);
    parts.push(`${two(d.getUTCDate())}.${two(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`);
  }
  return parts.join("  |  ");
}

/**
 * SVG path of the filled elevation profile inside a box (pixels), with a
 * little headroom so flat courses still show some relief.
 */
export function profileAreaPath(
  profile: number[],
  box: { x: number; y: number; w: number; h: number },
): string {
  if (profile.length < 2) return "";
  const min = Math.min(...profile);
  const max = Math.max(...profile);
  const range = Math.max(max - min, 30);
  const base = box.y + box.h;
  const r = (v: number) => Math.round(v * 10) / 10;
  const points = profile.map((ele, i) => {
    const x = box.x + (box.w * i) / (profile.length - 1);
    const y = base - (box.h * 0.92 * (ele - min)) / range - box.h * 0.04;
    return `${r(x)} ${r(y)}`;
  });
  return `M${r(box.x)} ${r(base)}L${points.join("L")}L${r(box.x + box.w)} ${r(base)}Z`;
}
