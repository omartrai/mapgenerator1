/**
 * Two-cities poster: the printed lines name both places, e.g.
 * "CASABLANCA & PARIS" over "Maroc · France".
 */
export interface TwinPlace {
  city: string;
  country: string;
  /** Coordinates already formatted for print. */
  coords: string;
}

/** Names of one country in the site's languages (place search may answer in another one). */
const SAME_COUNTRY = [["maroc", "morocco", "المغرب"]];

function sameCountry(a: string, b: string): boolean {
  const x = a.trim().toLowerCase();
  const y = b.trim().toLowerCase();
  return x === y || SAME_COUNTRY.some((names) => names.includes(x) && names.includes(y));
}

export function twinLabels(first: TwinPlace, second: TwinPlace) {
  const join = (a: string, b: string, glue: string) => [a.trim(), b.trim()].filter(Boolean).join(glue);
  return {
    city: join(first.city, second.city, " & "),
    country: sameCountry(first.country, second.country) ? first.country.trim() : join(first.country, second.country, " · "),
    coords: join(first.coords, second.coords, "   ·   "),
  };
}

/** The second place a new two-cities poster starts with. */
export const DEFAULT_TWIN = { city: "Paris", country: "France", lat: 48.8566, lon: 2.3522 } as const;
