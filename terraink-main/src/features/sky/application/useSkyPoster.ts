import { useCallback } from "react";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { parseLocalDateTime } from "@/features/sky/domain/astronomy";
import { defaultSkyTime, isSkyPoster } from "./skyOptions";

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

/** Switches between a map poster and a night-sky poster and sets its moment. */
export function useSkyPoster() {
  const { state, dispatch } = usePosterContext();
  const { form } = state;
  const set = useCallback(
    (name: string, value: string | boolean) => dispatch({ type: "SET_FIELD", name, value }),
    [dispatch],
  );

  const setKind = useCallback(
    (kind: "map" | "sky") => {
      if (kind === "sky" && !form.skyTime) set("skyTime", defaultSkyTime());
      set("posterKind", kind);
    },
    [form.skyTime, set],
  );

  const setTime = useCallback((time: string) => set("skyTime", time), [set]);

  return { isSky: isSkyPoster(form), form, setKind, setTime, set };
}
