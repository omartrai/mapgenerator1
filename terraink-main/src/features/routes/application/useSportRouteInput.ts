import { useCallback } from "react";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { gpxParser, loadRaceGpx, type RaceEntry } from "@/core/services";
import { useLanguage } from "@/shared/i18n/LanguageContext";
import { MAX_GPX_FILE_SIZE_BYTES } from "../domain/constants";
import type { Route } from "../domain/types";
import { createRoute, getGpxUploadLabel, readFileAsText } from "../infrastructure/helpers";
import { useActivityPoster } from "./useActivityPoster";


/**
 * The two ways to give a sport or trail poster its route: a GPX file or a
 * known race from the catalogue.
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
      setSportRoute(route);
    },
    [fromGpxText, setSportRoute],
  );

  const pickRace = useCallback(
    async (race: RaceEntry) => {
      const route = fromGpxText(await loadRaceGpx(race), race.name, race.file);
      route.label = race.name;
      setSportRoute(route);
      if (race.city) dispatch({ type: "SET_FIELD", name: "displayCountry", value: race.city });
    },
    [dispatch, fromGpxText, setSportRoute],
  );

  return { uploadFile, pickRace };
}
