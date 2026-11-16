import { useCallback } from "react";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { gpxParser, loadRaceGpx, type RaceEntry } from "@/core/services";
import { useLanguage } from "@/shared/i18n/LanguageContext";
import { MAX_GPX_FILE_SIZE_BYTES } from "../domain/constants";
import { computeActivityStats } from "../domain/activity";
import type { Route } from "../domain/types";
import { createRoute, getGpxUploadLabel, readFileAsText } from "../infrastructure/helpers";
import { useActivityPoster } from "./useActivityPoster";
import { drawRouteStore } from "./drawRouteStore";

const DRAWN_ROUTE_ID = "route-drawn";
const DRAW_COLOR = "#D62F2F";

/**
 * The three ways to give a sport or trail poster its route: a GPX file,
 * a known race from the catalogue, or points clicked on the poster.
 * Each one becomes the poster's only route, laid out in the current design.
 */
export function useSportRouteInput() {
  const { state, dispatch } = usePosterContext();
  const { t } = useLanguage();
  const { setSportRoute } = useActivityPoster();

  const fromGpxText = useCallback(
    (text: string, fallbackLabel: string, filename?: string) => {
      const parsed = gpxParser.parse(text, fallbackLabel);
      return createRoute({ parsed, defaults: state.routeDefaults, source: "gpx", label: parsed.label, sourceFilename: filename });
    },
    [state.routeDefaults],
  );

  /** Throws with a message key on a wrong file. */
  const uploadFile = useCallback(
    async (file: File) => {
      const isGpx = file.name.toLowerCase().endsWith(".gpx") || file.type === "application/gpx+xml";
      if (!isGpx) throw new Error("routes.errorFileType");
      if (file.size > MAX_GPX_FILE_SIZE_BYTES) throw new Error("routes.errorTooLarge");
      let route: Route;
      try {
        route = fromGpxText(await readFileAsText(file), getGpxUploadLabel(file.name), file.name);
      } catch {
        throw new Error("routes.errorUpload");
      }
      drawRouteStore.set({ active: false, points: [] });
      setSportRoute(route);
    },
    [fromGpxText, setSportRoute],
  );

  const pickRace = useCallback(
    async (race: RaceEntry) => {
      const route = fromGpxText(await loadRaceGpx(race), race.name, race.file);
      route.label = race.name;
      drawRouteStore.set({ active: false, points: [] });
      setSportRoute(route);
      if (race.city) dispatch({ type: "SET_FIELD", name: "displayCountry", value: race.city });
    },
    [dispatch, fromGpxText, setSportRoute],
  );

  /** The drawn route as a Route (distance only: no time or elevation). */
  const drawnRoute = useCallback(
    (points: { lat: number; lon: number }[]): Route => {
      const segments = [points.map(({ lat, lon }) => ({ lat, lon }))];
      const lats = points.map((p) => p.lat);
      const lons = points.map((p) => p.lon);
      const route = createRoute({
        parsed: {
          label: t("sport.route.drawLabel"),
          segments,
          bounds: {
            minLat: Math.min(...lats),
            maxLat: Math.max(...lats),
            minLon: Math.min(...lons),
            maxLon: Math.max(...lons),
          },
          pointCount: points.length,
          stats: computeActivityStats([points]),
        },
        defaults: { ...state.routeDefaults, color: DRAW_COLOR, strokeWidth: 4 },
        source: "manual",
      });
      return { ...route, id: DRAWN_ROUTE_ID };
    },
    [state.routeDefaults, t],
  );

  /** Show the points drawn so far on the poster (no re-fit while drawing). */
  const showDrawn = useCallback(
    (points: { lat: number; lon: number }[]) => {
      if (points.length < 2) {
        if (state.routes.some((route) => route.id === DRAWN_ROUTE_ID)) dispatch({ type: "REPLACE_ROUTES", routes: [] });
        return;
      }
      const previous = state.routes.find((route) => route.id === DRAWN_ROUTE_ID);
      const next = drawnRoute(points);
      dispatch({
        type: "REPLACE_ROUTES",
        routes: [previous ? { ...previous, segments: next.segments, stats: next.stats } : next],
      });
    },
    [dispatch, drawnRoute, state.routes],
  );

  const startDrawing = useCallback(() => {
    const existing = state.routes.find((route) => route.id === DRAWN_ROUTE_ID);
    const points = existing ? existing.segments.flat().map(({ lat, lon }) => ({ lat, lon })) : [];
    if (!existing && state.routes.length) dispatch({ type: "REPLACE_ROUTES", routes: [] });
    drawRouteStore.set({ active: true, points });
  }, [dispatch, state.routes]);

  const addPoint = useCallback(
    (lat: number, lon: number) => {
      const points = [...drawRouteStore.get().points, { lat, lon }];
      drawRouteStore.set({ points });
      showDrawn(points);
    },
    [showDrawn],
  );

  const undoPoint = useCallback(() => {
    const points = drawRouteStore.get().points.slice(0, -1);
    drawRouteStore.set({ points });
    showDrawn(points);
  }, [showDrawn]);

  const clearDrawing = useCallback(() => {
    drawRouteStore.set({ points: [] });
    showDrawn([]);
  }, [showDrawn]);

  /** Done: lay the drawn route out in the design (fit, colours, figures). */
  const finishDrawing = useCallback(() => {
    const { points } = drawRouteStore.get();
    drawRouteStore.set({ active: false });
    if (points.length >= 2) setSportRoute(drawnRoute(points));
  }, [drawnRoute, setSportRoute]);

  return { uploadFile, pickRace, startDrawing, addPoint, undoPoint, clearDrawing, finishDrawing };
}
