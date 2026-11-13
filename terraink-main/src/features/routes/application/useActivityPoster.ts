import { useCallback } from "react";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { useLanguage } from "@/shared/i18n/LanguageContext";
import { activityStatFields, activitySubtitle } from "../domain/activity";
import { getPosterLayout } from "@/features/poster/domain/posterLayout";
import { DEFAULT_ACCENT } from "@/features/poster/domain/activityPoster";
import { boundsCenter, routeBounds } from "../infrastructure/helpers";
import type { Route } from "../domain/types";

/**
 * Sport posters from a GPX route: fills the date line and the four stats
 * (in the customer's language and number format), and can switch the
 * poster to the sport layout in one step.
 */
export function useActivityPoster() {
  const { state, dispatch } = usePosterContext();
  const { t, language } = useLanguage();

  const fillFromRoute = useCallback(
    (route: Route) => {
      if (!route.stats) return;
      const comma = language !== "en";
      const fields = activityStatFields(
        route.stats,
        {
          distance: t("activity.stat.distance"),
          time: t("activity.stat.time"),
          pace: t("activity.stat.pace"),
          speed: t("activity.stat.speed"),
          elevation: t("activity.stat.elevation"),
        },
        comma,
      );
      const values: Record<string, string> = { activitySubtitle: activitySubtitle(route.stats, comma) };
      for (let i = 0; i < 4; i += 1) {
        values[`activityStat${i + 1}`] = fields[i]?.value ?? "";
        values[`activityStat${i + 1}Label`] = fields[i]?.label ?? "";
      }
      dispatch({ type: "SET_FORM_FIELDS", fields: values });
    },
    [dispatch, language, t],
  );

  const makeSportPoster = useCallback(
    (route: Route) => {
      fillFromRoute(route);
      dispatch({ type: "SET_THEME", themeId: "carbon" });
      dispatch({
        type: "SET_FORM_FIELDS",
        fields: {
          posterLayout: "activity",
          mapShape: "none",
          showPosterText: true,
          ...(state.form.customMessage ? {} : { customMessage: t("activity.defaultMessage") }),
          ...fitRouteToWindow(route, Number(state.form.width) || 30, Number(state.form.height) || 40),
        },
      });
      // Typed like a customer edit, so moving the map won't rename it.
      dispatch({ type: "SET_FIELD", name: "displayCity", value: route.label });
      // An accent colour that stands out on the dark paper.
      dispatch({
        type: "UPDATE_ROUTE",
        routeId: route.id,
        changes: {
          color: DEFAULT_ACCENT,
          strokeWidth: Math.max(route.strokeWidth, 4),
          startMarker: { ...route.startMarker, color: DEFAULT_ACCENT },
          finishMarker: { ...route.finishMarker, color: DEFAULT_ACCENT },
        },
      });
    },
    [dispatch, fillFromRoute, state.form.customMessage, state.form.width, state.form.height, t],
  );

  /**
   * Trail poster: only the route on plain paper (no streets, water or
   * buildings), fitted above the title, with the distance and time under it.
   */
  const makeTrailPoster = useCallback(
    (route: Route) => {
      const comma = language !== "en";
      const subtitle = route.stats ? activitySubtitle(route.stats, comma) : "";
      dispatch({
        type: "SET_FORM_FIELDS",
        fields: {
          posterLayout: "classic",
          mapShape: "none",
          showPosterText: true,
          includeLandcover: false,
          includeBuildings: false,
          includeWater: false,
          includeParks: false,
          includeAeroway: false,
          includeRail: false,
          includeRoads: false,
          includeRoadPath: false,
          includeRoadMinorLow: false,
          includeRoadOutline: false,
          showRoutes: true,
          ...(subtitle ? { displayCountry: subtitle } : {}),
          ...fitRouteToWindow(route, Number(state.form.width) || 30, Number(state.form.height) || 40, TRAIL_WINDOW),
        },
      });
      dispatch({ type: "SET_FIELD", name: "displayCity", value: route.label });
      dispatch({
        type: "UPDATE_ROUTE",
        routeId: route.id,
        changes: {
          color: TRAIL_COLOR,
          strokeWidth: 3,
          startMarker: { ...route.startMarker, color: TRAIL_COLOR },
          finishMarker: { ...route.finishMarker, color: TRAIL_COLOR },
        },
      });
    },
    [dispatch, language, state.form.width, state.form.height],
  );

  return { fillFromRoute, makeSportPoster, makeTrailPoster };
}

const METERS_PER_DEGREE = 111_320;
/** Where the route sits on a trail poster: above the title block. */
const TRAIL_WINDOW = { x: 0.1, y: 0.07, w: 0.8, h: 0.66 };
const TRAIL_COLOR = "#1A1A1A";
/** Room around the route inside the map window. */
const FIT_PADDING = 1.15;

/**
 * Map centre and distance (half the poster width, in metres) that show the
 * whole route centred in the sport layout's map window.
 */
function fitRouteToWindow(
  route: Route,
  widthCm: number,
  heightCm: number,
  window: { x: number; y: number; w: number; h: number } | null = getPosterLayout("activity").mapWindow,
): Record<string, string> {
  const bounds = routeBounds(route);
  if (!bounds || !window) return {};
  const center = boundsCenter(bounds);
  const spanX =
    (bounds.maxLon - bounds.minLon) * METERS_PER_DEGREE * Math.cos((center.lat * Math.PI) / 180) * FIT_PADDING;
  const spanY = (bounds.maxLat - bounds.minLat) * METERS_PER_DEGREE * FIT_PADDING;
  const aspect = widthCm / heightCm;
  const halfWidth = Math.max(spanX / (2 * window.w), (spanY * aspect) / (2 * window.h), 300);
  const posterHeightM = (2 * halfWidth) / aspect;
  // Shift the map so the route sits in the window's middle, not the poster's.
  const windowMid = window.y + window.h / 2;
  const lat = center.lat - ((0.5 - windowMid) * posterHeightM) / METERS_PER_DEGREE;
  const lonShift = ((0.5 - (window.x + window.w / 2)) * 2 * halfWidth) / (METERS_PER_DEGREE * Math.cos((center.lat * Math.PI) / 180));
  return {
    latitude: lat.toFixed(6),
    longitude: (center.lon + lonShift).toFixed(6),
    distance: String(Math.round(halfWidth)),
  };
}
