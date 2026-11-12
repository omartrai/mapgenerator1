/**
 * Sky geometry for the night-sky poster: where each star stands for an
 * observer at a place and an instant, projected onto a round chart.
 * Catalogue coordinates are J2000 (precession is negligible for a poster).
 */

const RAD = Math.PI / 180;

export interface Observer {
  lat: number;
  lon: number;
  /** The instant, as a UTC timestamp in milliseconds. */
  time: number;
}

/** Julian date of a UTC timestamp. */
export function julianDate(time: number): number {
  return time / 86400000 + 2440587.5;
}

/** Local sidereal time in degrees (0–360). */
export function localSiderealTime(observer: Observer): number {
  const d = julianDate(observer.time) - 2451545.0;
  const gmst = 280.46061837 + 360.98564736629 * d;
  return (((gmst + observer.lon) % 360) + 360) % 360;
}

/**
 * Horizontal position of a star: altitude above the horizon and azimuth
 * from north towards east, both in degrees.
 */
export function toHorizontal(raDeg: number, decDeg: number, lat: number, lst: number): { alt: number; az: number } {
  const ha = (lst - raDeg) * RAD;
  const dec = decDeg * RAD;
  const phi = lat * RAD;
  const sinAlt = Math.sin(dec) * Math.sin(phi) + Math.cos(dec) * Math.cos(phi) * Math.cos(ha);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const az = Math.atan2(-Math.sin(ha) * Math.cos(dec), Math.cos(phi) * Math.sin(dec) - Math.sin(phi) * Math.cos(dec) * Math.cos(ha));
  return { alt: alt / RAD, az: ((az / RAD) + 360) % 360 };
}

/**
 * Stereographic projection of the visible hemisphere seen from below
 * (zenith in the middle, horizon on the rim, north up, east on the left —
 * the way a sky chart is held overhead). Returns coordinates in units of
 * the chart radius; the horizon is at distance 1.
 */
export function projectHorizontal(alt: number, az: number): { x: number; y: number; r: number } {
  const r = Math.tan(((90 - alt) * RAD) / 2);
  const a = az * RAD;
  return { x: -r * Math.sin(a), y: -r * Math.cos(a), r };
}

/** Star radius factor from its magnitude (brighter = larger). */
export function starSize(mag: number): number {
  return Math.pow(Math.max(0.15, 6.4 - mag), 1.45);
}

/** Parses "YYYY-MM-DDTHH:mm" as wall-clock parts (no time zone). */
export function parseLocalDateTime(value: string): { y: number; m: number; d: number; h: number; min: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) return null;
  const [, y, m, d, h, min] = match.map(Number);
  return { y, m, d, h, min };
}
