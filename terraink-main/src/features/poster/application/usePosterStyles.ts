import { useCallback } from "react";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { DEFAULT_MARKER_SIZE } from "@/features/markers/domain/constants";
import { useLanguage } from "@/shared/i18n/LanguageContext";
import { DEFAULT_TWIN } from "@/features/poster/domain/twinCities";
import { defaultSkyTime } from "@/features/sky/application/skyOptions";

/**
 * Ready-made looks that set the layout, colours, map shape, layers and a
 * heart pin in one tap. The customer can still change any of it afterwards.
 */
export const POSTER_STYLES = ["classic", "heart", "photo", "twin", "venn"] as const;
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
  const { form } = state;

  /** A red heart at the centre of the map, unless one is already pinned. */
  const pinHeart = useCallback((scale = 1.15) => {
    if (state.markers.some((marker) => marker.iconId === "heart")) return;
    const lat = Number(form.latitude);
    const lon = Number(form.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    dispatch({
      type: "ADD_MARKER",
      marker: { id: markerId(), lat, lon, iconId: "heart", size: Math.round(DEFAULT_MARKER_SIZE * scale), color: HEART_RED },
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

      if (id === "twin") {
        // The two pieces carry their own heart pins.
        for (const marker of state.markers) {
          if (marker.iconId === "heart" && marker.color === HEART_RED) {
            dispatch({ type: "REMOVE_MARKER", markerId: marker.id });
          }
        }
        dispatch({
          type: "SET_FORM_FIELDS",
          fields: {
            ...base,
            ...ALL_LAYERS,
            posterLayout: "twin",
            mapShape: "heart",
            posterStyle: "twin",
            // Start with a second place, saved like a chosen one.
            ...(form.twinLat && form.twinLon
              ? {}
              : {
                  twinCity: DEFAULT_TWIN.city,
                  twinCountry: DEFAULT_TWIN.country,
                  twinLat: String(DEFAULT_TWIN.lat),
                  twinLon: String(DEFAULT_TWIN.lon),
                }),
            messageFont: "elegant",
            messageSize: "m",
            messageX: "",
            messageY: "",
            ...message(t("twin.message")),
          },
        });
        return;
      }

      if (id === "venn") {
        if (!form.theme?.startsWith("venn_")) dispatch({ type: "SET_THEME", themeId: "venn_cream" });
        dispatch({
          type: "SET_FORM_FIELDS",
          fields: {
            ...base,
            ...ALL_LAYERS,
            posterLayout: "venn",
            mapShape: "circle",
            posterStyle: "venn",
            messageFont: "elegant",
            messageSize: "l",
            messageX: "",
            messageY: "",
            ...(form.skyTime ? {} : { skyTime: defaultSkyTime() }),
            ...(form.vennNames === undefined ? { vennNames: t("venn.namesDefault") } : {}),
            ...message(t("venn.message")),
          },
        });
        // A small pin: the circle is much smaller than a full map.
        pinHeart(0.55);
        return;
      }

      if (id === "photo") {
        dispatch({ type: "SET_THEME", themeId: "monochrome" });
        dispatch({
          type: "SET_FORM_FIELDS",
          fields: {
            ...base,
            ...ALL_LAYERS,
            posterLayout: "duo",
            mapShape: "heart",
            posterStyle: "photo",
            messageFont: "elegant",
            messageSize: "m",
            messageX: "",
            messageY: "",
            ...(form.photoMono === undefined ? { photoMono: true } : {}),
            ...message(t("style.preset.photo.message")),
          },
        });
        pinHeart();
        return;
      }

    },
    [dispatch, form.customMessage, form.photoMono, form.twinLat, form.twinLon, form.theme, form.skyTime, form.vennNames, pinHeart, state.markers, t],
  );

  /**
   * Leaving the photo & map style: take away what it added (the red heart
   * pin, and its message if the customer kept it as is).
   */
  const leavePhoto = useCallback(() => {
    for (const marker of state.markers) {
      if (marker.iconId === "heart" && marker.color === HEART_RED) {
        dispatch({ type: "REMOVE_MARKER", markerId: marker.id });
      }
    }
    const presetMessages = [t("style.preset.photo.message"), t("style.preset.heart.message"), t("twin.message"), t("venn.message")];
    dispatch({
      type: "SET_FORM_FIELDS",
      fields: {
        posterStyle: "classic",
        ...(presetMessages.includes(form.customMessage?.trim() ?? "") ? { customMessage: "" } : {}),
      },
    });
  }, [dispatch, form.customMessage, state.markers, t]);

  const active = (form.posterStyle as PosterStyleId | undefined) ?? null;
  return { apply, active, leavePhoto };
}
