import { useCallback } from "react";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { parseLocalDateTime } from "@/features/sky/domain/astronomy";
import { defaultSkyTime, isSkyPoster } from "./skyOptions";
import { useActivityPoster } from "@/features/routes/application/useActivityPoster";
import { isSportLayout, isTrailLayout } from "@/features/poster/domain/posterLayout";

/** "12 novembre 2026" in the site language, from "YYYY-MM-DDTHH:mm". */
export function formatSkyDate(value: string, language: string): string {
  const parts = parseLocalDateTime(value);
  if (!parts) return "";
  const locale = language === "ar" ? "ar-MA" : language === "fr" ? "fr-FR" : "en-GB";
  return new Date(Date.UTC(parts.y, parts.m - 1, parts.d, 12)).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Coordinates line of a sky poster: "12 juin 2021 · 23:30 · 31.6295° N / 7.9811° W". */
export function skyCoordsLabel(skyTime: string, coordinates: string, language: string): string {
  const date = formatSkyDate(skyTime, language);
  const clock = skyTime.split("T")[1]?.slice(0, 5) ?? "";
  return [date, clock, coordinates].filter(Boolean).join("  ·  ");
}

export type PosterKind = "map" | "sky" | "sport" | "trail";

const BORN: Record<string, string> = { en: "Born", fr: "Né(e) le", ar: "وُلد في" };

/**
 * Details line under a sky poster's title. A baby sky reads
 * "Né(e) le 19 février 2015 | 51 cm | 3400 g"; other skies show
 * the date, time and coordinates.
 */
export function skyDetailsLabel(
  form: { skyTime?: string; skyShape?: string; babyLength?: string; babyWeight?: string },
  coordinates: string,
  language: string,
): string {
  if (form.skyShape !== "baby") return skyCoordsLabel(form.skyTime ?? "", coordinates, language);
  const date = formatSkyDate(form.skyTime ?? "", language);
  const length = form.babyLength?.trim();
  const weight = form.babyWeight?.trim();
  return [
    date ? `${BORN[language] ?? BORN.en} ${date}` : "",
    length ? `${length} cm` : "",
    weight ? `${weight} g` : "",
  ]
    .filter(Boolean)
    .join("  |  ")
    .toUpperCase();
}

/** Switches between a map, night-sky, sport or trail poster and sets the sky's moment. */
export function useSkyPoster() {
  const { state, dispatch } = usePosterContext();
  const { form } = state;
  const { applyDesign, leaveSport } = useActivityPoster();
  const set = useCallback(
    (name: string, value: string | boolean) => dispatch({ type: "SET_FIELD", name, value }),
    [dispatch],
  );

  const isSky = isSkyPoster(form);
  const kind: PosterKind = isSky
    ? "sky"
    : isSportLayout(form.posterLayout)
      ? "sport"
      : isTrailLayout(form.posterLayout)
        ? "trail"
        : "map";

  const setKind = useCallback(
    (next: PosterKind) => {
      if (next === kind) return;
      if (next === "sport") return applyDesign("race");
      if (next === "trail") return applyDesign("topo");
      if (kind === "sport" || kind === "trail") leaveSport();
      if (next === "sky" && !form.skyTime) set("skyTime", defaultSkyTime());
      set("posterKind", next === "sky" ? "sky" : "map");
    },
    [applyDesign, form.skyTime, kind, leaveSport, set],
  );

  const setTime = useCallback((time: string) => set("skyTime", time), [set]);

  return { isSky, kind, form, setKind, setTime, set };
}
