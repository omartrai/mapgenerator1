import type { PosterForm } from "./posterReducer";
import { getPosterLayout } from "@/features/poster/domain/posterLayout";
import { DEFAULT_TWIN, twinLabels } from "@/features/poster/domain/twinCities";
import { formatCoordinates } from "@/shared/geo/posterBounds";

/** Where the second place of a two-cities poster is (the default until one is chosen). */
export function twinPlaceFromForm(form: PosterForm) {
  const lat = Number(form.twinLat);
  const lon = Number(form.twinLon);
  const known = form.twinLat && form.twinLon && Number.isFinite(lat) && Number.isFinite(lon);
  return {
    city: known ? form.twinCity ?? "" : form.twinCity || DEFAULT_TWIN.city,
    country: known ? form.twinCountry ?? "" : form.twinCountry || DEFAULT_TWIN.country,
    lat: known ? lat : DEFAULT_TWIN.lat,
    lon: known ? lon : DEFAULT_TWIN.lon,
  };
}

/** The printed city, country and coordinate lines naming both places; null when not a two-cities poster. */
export function twinTextFromForm(form: PosterForm, city: string, country: string) {
  if (!getPosterLayout(form.posterLayout).twin) return null;
  const second = twinPlaceFromForm(form);
  return twinLabels(
    { city, country, coords: formatCoordinates(Number(form.latitude) || 0, Number(form.longitude) || 0) },
    { city: second.city, country: second.country, coords: formatCoordinates(second.lat, second.lon) },
  );
}
