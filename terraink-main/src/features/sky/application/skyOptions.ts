import { getPosterLayout } from "@/features/poster/domain/posterLayout";
import { skyColors, skyDisc } from "@/features/sky/domain/chart";
import { skyInstant, type SkyChartOptions } from "@/core/services";

export interface SkyForm {
  posterKind?: string;
  skyTime?: string;
  skyLines?: boolean;
  skyGrid?: boolean;
  skyMilkyWay?: boolean;
  posterLayout?: string;
  latitude: string;
  longitude: string;
}

export const isSkyPoster = (form: { posterKind?: string }) => form.posterKind === "sky";

/** Today at 22:00, as the default moment for a new night-sky poster. */
export function defaultSkyTime(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T22:00`;
}

/** Everything the sky renderer needs for a poster of the given pixel size. */
export function skyOptionsFromForm(
  form: SkyForm,
  theme: { ui: { bg: string; text: string } },
  width: number,
  height: number,
): SkyChartOptions {
  const lat = Number(form.latitude) || 0;
  const lon = Number(form.longitude) || 0;
  return {
    lat,
    lon,
    time: skyInstant(form.skyTime || defaultSkyTime(), lat, lon),
    disc: skyDisc(getPosterLayout(form.posterLayout), width, height),
    colors: skyColors(theme),
    showLines: form.skyLines !== false,
    showGrid: form.skyGrid === true,
    showMilkyWay: form.skyMilkyWay !== false,
  };
}
