import { useCallback } from "react";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { useLanguage } from "@/shared/i18n/LanguageContext";
import { activityStatFields, activitySubtitle, formatDuration, type ActivityStats } from "../domain/activity";
import {
  getPosterLayout,
  isSportLayout,
  isTrailLayout,
  type Rect,
} from "@/features/poster/domain/posterLayout";
import { DEFAULT_ACCENT } from "@/features/poster/domain/activityPoster";
import { boundsCenter, routeBounds } from "../infrastructure/helpers";
import type { Route } from "../domain/types";

/** Sport and trail designs the customer can pick. */
export type SportDesign = "race" | "bib" | "bold" | "green" | "photorun" | "activity" | "topo";

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

/** Trail: contours only, plus water so lakes and coasts still read. */
const TRAIL_LAYERS = {
  ...Object.fromEntries(Object.keys(ALL_LAYERS).map((key) => [key, false])),
  includeWater: true,
};

/** Look of each design: theme, poster font and route line. */
const DESIGN_LOOK: Record<SportDesign, { theme: string; font: string; color: string; width: number }> = {
  race: { theme: "race_white", font: "Montserrat", color: "#D62F2F", width: 5 },
  bib: { theme: "race_grey", font: "Oswald", color: "#E0201B", width: 4 },
  green: { theme: "valencia_green", font: "Montserrat", color: "#F1EBDD", width: 9 },
  bold: { theme: "marrakech_red", font: "Oswald", color: "#141414", width: 5 },
  photorun: { theme: "carbon", font: "Montserrat", color: "#FFFFFF", width: 5 },
  activity: { theme: "carbon", font: "", color: DEFAULT_ACCENT, width: 4 },
  topo: { theme: "topo_cream", font: "Montserrat", color: "#E4572E", width: 4 },
};

const two = (value: number) => String(value).padStart(2, "0");
const decimal = (value: number, digits: number, comma: boolean) => {
  const text = value.toFixed(digits);
  return comma ? text.replace(".", ",") : text;
};

/** The design currently on the poster, if it is a sport or trail one. */
export function currentSportDesign(layout: string | undefined): SportDesign | null {
  return isSportLayout(layout) || isTrailLayout(layout) ? (layout as SportDesign) : null;
}

/**
 * Sport and trail posters from a route: picks the design (layout, colours,
 * font, route line), fits the route in the design's map area and fills the
 * figures each design prints, in the customer's language.
 */
export function useActivityPoster() {
  const { state, dispatch } = usePosterContext();
  const { t, language } = useLanguage();
  const comma = language !== "en";
  const locale = language === "ar" ? "ar-MA" : language === "fr" ? "fr-FR" : "en-GB";

  /** Text fields of a design from the route's figures. */
  const designFields = useCallback(
    (design: SportDesign, stats: ActivityStats | undefined, label: string): Record<string, string> => {
      const fields: Record<string, string> = {};
      const setStats = (items: { value: string; label: string }[]) => {
        for (let i = 0; i < 4; i += 1) {
          fields[`activityStat${i + 1}`] = items[i]?.value ?? "";
          fields[`activityStat${i + 1}Label`] = items[i]?.label ?? "";
        }
      };
      if (!stats) return fields;
      const km = stats.distanceM / 1000;
      const kmText = decimal(km, km >= 100 ? 1 : 2, comma);
      const date = stats.startDate ? new Date(stats.startDate) : null;
      const time = stats.durationS
        ? (() => {
            const s = stats.durationS!;
            return `${two(Math.floor(s / 3600))}:${two(Math.floor((s % 3600) / 60))}:${two(s % 60)}`;
          })()
        : "";
      const pace = stats.durationS && km > 0 ? `${formatDuration(Math.round(stats.durationS / km))}/km` : "";
      const monthYear = date
        ? date.toLocaleDateString(locale, { month: "short", year: "numeric", timeZone: "UTC" }).replace(".", "").toUpperCase()
        : "";
      const longDate = date
        ? date.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
        : "";
      const shortDate = date
        ? `${two(date.getUTCDate())}.${two(date.getUTCMonth() + 1)}.${String(date.getUTCFullYear()).slice(2)}`
        : "";

      if (design === "race") {
        setStats(
          [
            longDate ? { value: longDate, label: t("sport.stat.date") } : null,
            time ? { value: time, label: t("sport.stat.officialTime") } : null,
            { value: `${kmText} km`, label: t("activity.stat.distance") },
          ].filter(Boolean) as { value: string; label: string }[],
        );
        fields.sportBig = date ? String(date.getUTCFullYear()) : String(new Date().getFullYear());
      } else if (design === "bib") {
        setStats(
          [
            longDate ? { value: longDate, label: t("sport.stat.date") } : null,
            { value: `${kmText} km`, label: t("activity.stat.distance") },
            time ? { value: time, label: t("activity.stat.time") } : null,
          ].filter(Boolean) as { value: string; label: string }[],
        );
      } else if (design === "green") {
        fields.sportBig = time ? formatDuration(stats.durationS!) : "";
        fields.activitySubtitle = [pace, longDate].filter(Boolean).join("  ·  ");
        setStats(
          [
            { value: `${kmText} km`, label: t("activity.stat.distance") },
            stats.elevationGainM !== null ? { value: `+${stats.elevationGainM} m`, label: t("activity.stat.elevation") } : null,
            { value: "", label: t("sport.stat.place") },
          ].filter(Boolean) as { value: string; label: string }[],
        );
      } else if (design === "bold") {
        fields.sportBig = kmText;
        fields.activitySubtitle = monthYear;
        setStats([]);
      } else if (design === "photorun") {
        fields.sportBig = time || `${kmText} km`;
        fields.activitySubtitle = shortDate;
        setStats(
          [
            { value: `${kmText} km`, label: t("activity.stat.distance") },
            pace ? { value: pace, label: t("activity.stat.pace") } : null,
          ].filter(Boolean) as { value: string; label: string }[],
        );
      } else if (design === "topo") {
        const top = stats.profile.length ? Math.round(Math.max(...stats.profile)) : null;
        fields.activitySubtitle = top !== null ? t("sport.summit").replace("{m}", top.toLocaleString(locale)) : "";
        setStats(
          [
            { value: `${kmText} KM`, label: t("activity.stat.distance") },
            stats.durationS ? { value: formatDuration(stats.durationS), label: t("activity.stat.time") } : null,
            stats.elevationGainM !== null ? { value: `+${stats.elevationGainM} M`, label: t("activity.stat.elevation") } : null,
            monthYear ? { value: monthYear, label: t("sport.stat.date") } : null,
          ].filter(Boolean) as { value: string; label: string }[],
        );
      } else {
        fields.activitySubtitle = activitySubtitle(stats, comma);
        setStats(
          activityStatFields(
            stats,
            {
              distance: t("activity.stat.distance"),
              time: t("activity.stat.time"),
              pace: t("activity.stat.pace"),
              speed: t("activity.stat.speed"),
              elevation: t("activity.stat.elevation"),
            },
            comma,
          ),
        );
      }
      if (label && design !== "activity") fields.displayCity = label;
      return fields;
    },
    [comma, locale, t],
  );

  /** Refill the figures of the current design from the route. */
  const fillFromRoute = useCallback(
    (route: Route) => {
      if (!route.stats) return;
      const design = currentSportDesign(state.form.posterLayout) ?? "activity";
      const { displayCity: _title, ...fields } = designFields(design, route.stats, "");
      dispatch({ type: "SET_FORM_FIELDS", fields });
    },
    [designFields, dispatch, state.form.posterLayout],
  );

  /**
   * Switch the poster to a design. With a route, the route is fitted in the
   * design's map area and its figures fill the texts.
   */
  const applyDesign = useCallback(
    (design: SportDesign, route?: Route | null) => {
      const target = route ?? state.routes.find((entry) => entry.visible) ?? null;
      const look = DESIGN_LOOK[design];
      const layout = getPosterLayout(design);
      const form = state.form;
      dispatch({ type: "SET_THEME", themeId: look.theme });
      dispatch({
        type: "SET_FORM_FIELDS",
        fields: {
          posterKind: "map",
          posterLayout: design,
          mapShape: "none",
          showPosterText: true,
          showRoutes: true,
          showContours: design === "topo",
          ...(design === "topo" ? TRAIL_LAYERS : ALL_LAYERS),
          ...(look.font || design !== "activity" ? { fontFamily: look.font } : {}),
          ...(design === "photorun" && !form.photo ? { photoMono: false } : {}),
          ...(design === "activity" && !form.customMessage ? { customMessage: t("activity.defaultMessage") } : {}),
          ...(form.sportName ? {} : { sportName: t("sport.namePlaceholder") }),
          ...(target ? designFields(design, target.stats, "") : {}),
          ...(target
            ? fitRouteToWindow(
                target,
                Number(form.width) || 30,
                Number(form.height) || 40,
                layout.routeBox ?? layout.mapWindow ?? FULL,
              )
            : {}),
        },
      });
      if (target) {
        // Typed like a customer edit, so moving the map won't rename it.
        if (!currentSportDesign(form.posterLayout)) {
          dispatch({ type: "SET_FIELD", name: "displayCity", value: target.label });
        }
        // A route just passed in may not be in state yet (same tick).
        for (const entry of route ? [route] : state.routes) {
          dispatch({
            type: "UPDATE_ROUTE",
            routeId: entry.id,
            changes: {
              color: look.color,
              strokeWidth: look.width,
              opacity: 1,
              lineStyle: "solid",
              showEndpoints: ["topo", "race", "bib", "green"].includes(design),
              startMarker: {
                ...entry.startMarker,
                iconId: "circle",
                color: look.color,
                size: 16,
                hidden: design === "green" || design === "bib",
              },
              finishMarker: {
                ...entry.finishMarker,
                iconId: design === "race" ? "flag" : "circle",
                color: design === "green" ? "#E2B12C" : look.color,
                size: design === "race" ? 22 : 16,
                hidden: false,
              },
            },
          });
        }
      }
    },
    [designFields, dispatch, state.form, state.routes, t],
  );

  /** Make the route the poster's only route and lay it out in the current design. */
  const setSportRoute = useCallback(
    (route: Route, design?: SportDesign) => {
      dispatch({ type: "REPLACE_ROUTES", routes: [route] });
      dispatch({ type: "SET_FIELD", name: "displayCity", value: route.label });
      applyDesign(design ?? currentSportDesign(state.form.posterLayout) ?? "race", route);
    },
    [applyDesign, dispatch, state.form.posterLayout],
  );

  /** Kept for the Routes tab: sport poster in the current (or default) design. */
  const makeSportPoster = useCallback(
    (route: Route) => applyDesign(currentSportDesign(state.form.posterLayout) ?? "race", route),
    [applyDesign, state.form.posterLayout],
  );

  /** Leave sport/trail: back to an ordinary city map. */
  const leaveSport = useCallback(() => {
    dispatch({
      type: "SET_FORM_FIELDS",
      fields: { posterLayout: "classic", showContours: false, ...ALL_LAYERS },
    });
  }, [dispatch]);

  return { fillFromRoute, applyDesign, setSportRoute, makeSportPoster, leaveSport };
}

const METERS_PER_DEGREE = 111_320;
const FULL: Rect = { x: 0.1, y: 0.1, w: 0.8, h: 0.8 };
/** Room around the route inside the map window. */
const FIT_PADDING = 1.15;

/**
 * Map centre and distance (half the poster width, in metres) that show the
 * whole route centred in the given window of the poster.
 */
function fitRouteToWindow(
  route: Route,
  widthCm: number,
  heightCm: number,
  window: Rect,
): Record<string, string> {
  const bounds = routeBounds(route);
  if (!bounds) return {};
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
  const lonShift =
    ((0.5 - (window.x + window.w / 2)) * 2 * halfWidth) / (METERS_PER_DEGREE * Math.cos((center.lat * Math.PI) / 180));
  return {
    latitude: lat.toFixed(6),
    longitude: (center.lon + lonShift).toFixed(6),
    distance: String(Math.round(halfWidth)),
  };
}
