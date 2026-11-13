import { useCallback } from "react";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { DEFAULT_MARKER_SIZE } from "@/features/markers/domain/constants";
import { useActivityPoster } from "@/features/routes/application/useActivityPoster";
import { useLanguage } from "@/shared/i18n/LanguageContext";
import { openSettingsTab } from "@/shared/ui/settingsTabs";

/**
 * Ready-made looks that set the layout, colours, map shape, layers and a
 * heart pin in one tap. The customer can still change any of it afterwards.
 */
export const POSTER_STYLES = ["classic", "love", "heart", "trail"] as const;
export type PosterStyleId = (typeof POSTER_STYLES)[number];

const ALL_LAYERS = {
  includeLandcover: true,
  includeBuildings: true,
  includeWater: true,
  includeParks: true,
  includeAeroway: true,
  includeRail: true,
  includeRoads: true,
  includeRoadPath: true,
  includeRoadMinorLow: true,
  includeRoadOutline: true,
};

const HEART_RED = "#C8352B";

function markerId(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? `marker-${crypto.randomUUID()}`
    : `marker-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function usePosterStyles() {
  const { state, dispatch } = usePosterContext();
  const { t } = useLanguage();
  const { makeTrailPoster } = useActivityPoster();
  const { form } = state;

  /** A red heart at the centre of the map, unless one is already pinned. */
  const pinHeart = useCallback(() => {
    if (state.markers.some((marker) => marker.iconId === "heart")) return;
    const lat = Number(form.latitude);
    const lon = Number(form.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    dispatch({
      type: "ADD_MARKER",
      marker: { id: markerId(), lat, lon, iconId: "heart", size: Math.round(DEFAULT_MARKER_SIZE * 1.15), color: HEART_RED },
    });
  }, [dispatch, form.latitude, form.longitude, state.markers]);

  const apply = useCallback(
    (id: PosterStyleId) => {
      const base = { posterKind: "map", showPosterText: true, showMarkers: true };
      const message = (fallback: string) => (form.customMessage?.trim() ? {} : { customMessage: fallback });

      if (id === "classic") {
        dispatch({
          type: "SET_FORM_FIELDS",
          fields: { ...base, ...ALL_LAYERS, posterLayout: "classic", mapShape: "none", posterStyle: "classic" },
        });
        return;
      }

      if (id === "love") {
        dispatch({ type: "SET_THEME", themeId: "navy_ink" });
        dispatch({
          type: "SET_FORM_FIELDS",
          fields: {
            ...base,
            ...ALL_LAYERS,
            posterLayout: "band",
            mapShape: "none",
            posterStyle: "love",
            messageFont: "poster",
            messageStyle: "regular",
            ...message(t("style.preset.love.message")),
          },
        });
        dispatch({ type: "SET_FIELD", name: "displayCity", value: t("style.preset.love.title") });
        pinHeart();
        return;
      }

      if (id === "heart") {
        dispatch({ type: "SET_THEME", themeId: "monochrome" });
        dispatch({
          type: "SET_FORM_FIELDS",
          fields: {
            ...base,
            ...ALL_LAYERS,
            posterLayout: "classic",
            mapShape: "heart",
            posterStyle: "heart",
            messageFont: "elegant",
            messageSize: "l",
            ...message(t("style.preset.heart.message")),
          },
        });
        pinHeart();
        return;
      }

      // Trail: needs a route; without one, open the Routes tab to import it.
      dispatch({ type: "SET_THEME", themeId: "monochrome" });
      dispatch({ type: "SET_FORM_FIELDS", fields: { ...base, posterStyle: "trail" } });
      const route = state.routes.find((entry) => entry.visible);
      if (route) makeTrailPoster(route);
      else openSettingsTab({ tab: "routes" });
    },
    [dispatch, form.customMessage, makeTrailPoster, pinHeart, state.routes, t],
  );

  const active = (form.posterStyle as PosterStyleId | undefined) ?? null;
  return { apply, active };
}
