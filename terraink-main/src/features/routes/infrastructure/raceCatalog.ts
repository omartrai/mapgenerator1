/**
 * Known races: official routes shipped as GPX files in public/races/,
 * listed in public/races/races.json:
 *
 *   { "races": [{ "id": "marrakech-marathon", "name": "Marathon de Marrakech",
 *                 "city": "Marrakech", "kind": "sport", "distanceKm": 42.195,
 *                 "file": "marrakech-marathon.gpx" }] }
 *
 * "kind" is "sport" (road races) or "trail" (mountain routes).
 */
export interface RaceEntry {
  id: string;
  name: string;
  city?: string;
  kind?: "sport" | "trail";
  distanceKm?: number;
  file: string;
}

const BASE = "/races/";

export async function loadRaceCatalog(): Promise<RaceEntry[]> {
  const response = await fetch(`${BASE}races.json`, { cache: "no-cache" });
  if (!response.ok) return [];
  const data = (await response.json()) as { races?: RaceEntry[] };
  return Array.isArray(data.races) ? data.races.filter((race) => race && race.id && race.file) : [];
}

export async function loadRaceGpx(race: RaceEntry): Promise<string> {
  const response = await fetch(`${BASE}${encodeURIComponent(race.file)}`);
  if (!response.ok) throw new Error(`Could not load ${race.file}`);
  return response.text();
}
