import { useCallback, useMemo } from "react";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { textPartsFromForm } from "@/features/poster/domain/textLayout";
import { getPosterLayout } from "@/features/poster/domain/posterLayout";
import { activityFromForm } from "@/features/poster/domain/activityPoster";
import { messageLookFromForm, resolveMessageType } from "@/features/poster/domain/messageStyle";
import { localStorageCache } from "@/core/cache/localStorageCache";
import type { ExportFormat } from "@/features/export/domain/types";
import { captureMapAsCanvas } from "@/features/export/infrastructure/mapExporter";
import { renderSkyCanvas } from "@/core/services";
import { isSkyPoster, skyOptionsFromForm } from "@/features/sky/application/skyOptions";
import { skyCoordsLabel } from "@/features/sky/application/useSkyPoster";
import { formatCoordinates } from "@/shared/geo/posterBounds";
import { useLanguage } from "@/shared/i18n/LanguageContext";
import { compositeExport } from "@/features/poster/infrastructure/renderer";
import { resolveCanvasSize } from "@/features/poster/infrastructure/renderer/canvas";
import {
  PRINT_MAX_PIXELS,
  PRINT_MAX_SIDE,
} from "@/features/poster/infrastructure/renderer/constants";
import { getAllMarkerIcons } from "@/features/markers/infrastructure/iconRegistry";
import { ensureFont } from "@/core/services";
import {
  createPngBlob,
  createPdfBlobFromCanvas,
  createLayeredSvgBlobFromMap,
  createPosterFilename,
  triggerDownloadBlob,
} from "@/core/services";
import {
  CM_PER_INCH,
  DEFAULT_POSTER_WIDTH_CM,
  DEFAULT_POSTER_HEIGHT_CM,
} from "@/core/config";
import { trackEvent, setUserProperty } from "@/core/services";

const EXPORT_COUNT_STORAGE_KEY = "noria.poster.count";

export type SupportPromptVariant = "follow";

export interface SupportPromptState {
  posterNumber: number;
  variant: SupportPromptVariant;
}

export const SUPPORT_PROMPT_EVENT = "noria:support-prompt";

// Use a 1-year TTL so the export count persists across sessions.
const EXPORT_COUNT_TTL_MS = 365 * 24 * 60 * 60 * 1000;

// Report time-to-first-export once per session (not per export).
let firstExportTimed = false;

// Timestamp of the last export this session, for measuring the gap between
// exports. Stays null until the first export, so the param is omitted then.
let lastExportAt: number | null = null;

/**
 * Fires the analytics for a successful export: the poster_exported event,
 * the once-per-session time-to-first-export, and the lifetime_export_count
 * user property (the current total, not a per-event log entry).
 */
function reportExportSuccess(
  nextCount: number,
  exportParams: Record<string, string | number | boolean>,
): void {
  trackEvent("poster_exported", exportParams);

  if (!firstExportTimed) {
    firstExportTimed = true;
    trackEvent("time_to_first_export", {
      seconds_to_first_export: Math.round(
        (Date.now() - performance.timeOrigin) / 1000,
      ),
    });
  }

  lastExportAt = Date.now();
  setUserProperty("lifetime_export_count", nextCount);
}

function readPosterExportCount(): number {
  const stored = localStorageCache.read<number>(
    EXPORT_COUNT_STORAGE_KEY,
    EXPORT_COUNT_TTL_MS,
  );
  if (typeof stored === "number" && Number.isFinite(stored) && stored >= 0) {
    return Math.floor(stored);
  }
  return 0;
}

function writePosterExportCount(nextCount: number): void {
  localStorageCache.write(EXPORT_COUNT_STORAGE_KEY, nextCount);
}

/**
 * Provides handlers for exporting the live poster preview as PNG or PDF.
 *
 * Flow:
 * 1. Resize MapLibre container to full export resolution.
 * 2. Wait for tiles at new resolution.
 * 3. Snapshot the WebGL canvas.
 * 4. Composite fades + text onto the snapshot.
 * 5. Download.
 */
export function useExport() {
  const { state, dispatch, effectiveTheme, mapRef } = usePosterContext();
  const { form } = state;
  const { language } = useLanguage();
  const hasVisibleMarkers = form.showMarkers && state.markers.length > 0;
  const visibleRoutes = useMemo(
    () =>
      form.showRoutes
        ? state.routes.filter((route) => route.visible)
        : [],
    [form.showRoutes, state.routes],
  );
  const hasVisibleOverlays = hasVisibleMarkers || visibleRoutes.length > 0;

  const registerSuccessfulExport = useCallback((nextCount: number) => {
    writePosterExportCount(nextCount);

    // Prompt cadence: follow on the first download and every 5th after → 1, 6, 11, …
    // Donate lives in the header; ad interstitials are handled by Google's
    // vignette/Offerwall, not a custom modal.
    let variant: SupportPromptVariant | null = null;
    if ((nextCount - 1) % 5 === 0) variant = "follow";

    if (variant) {
      window.dispatchEvent(
        new CustomEvent(SUPPORT_PROMPT_EVENT, {
          detail: { posterNumber: nextCount, variant },
        }),
      );
    }
  }, []);

  /**
   * Renders the poster (map + fades + overlays + text) onto a canvas of the
   * given pixel size, matching the live preview framing.
   */
  const renderPosterCanvas = useCallback(
    async (width: number, height: number): Promise<HTMLCanvasElement> => {
      const map = mapRef.current;
      if (!map) throw new Error("Map is not ready.");

      if (form.showPosterText && form.fontFamily.trim()) {
        await ensureFont(form.fontFamily.trim());
      }
      // Script layouts draw the city in their own face.
      const layoutFont = getPosterLayout(form.posterLayout).cityStyle.family;
      if (form.showPosterText && layoutFont) await ensureFont(layoutFont);
      const messageFont = resolveMessageType(messageLookFromForm(form), false).family;
      if (form.showPosterText && messageFont) await ensureFont(messageFont);

      const widthCm = Number(form.width) || DEFAULT_POSTER_WIDTH_CM;
      const heightCm = Number(form.height) || DEFAULT_POSTER_HEIGHT_CM;
      const lat = Number(form.latitude) || 0;
      const lon = Number(form.longitude) || 0;

      // Night-sky poster: the star chart replaces the map; no markers or routes.
      const sky = isSkyPoster(form);
      const {
        canvas: mapCanvas,
        markerProjection,
        markerScaleX,
        markerScaleY,
        markerSizeScale,
      } = sky
        ? {
            canvas: await renderSkyCanvas(width, height, skyOptionsFromForm(form, effectiveTheme, width, height)),
            markerProjection: undefined,
            markerScaleX: undefined,
            markerScaleY: undefined,
            markerSizeScale: undefined,
          }
        : await captureMapAsCanvas(map, width, height);
      const withOverlays = hasVisibleOverlays && !sky;

      const { canvas } = await compositeExport(mapCanvas, {
        theme: effectiveTheme,
        center: { lat, lon },
        widthInches: widthCm / CM_PER_INCH,
        heightInches: heightCm / CM_PER_INCH,
        displayCity: form.displayCity || form.location || "",
        displayCountry: form.displayCountry || "",
        fontFamily: form.fontFamily.trim(),
        showPosterText: form.showPosterText,
        showOverlay: form.showMarkers && !sky,
        includeCredits: form.includeCredits && !sky,
        customMessage: form.customMessage || "",
        textParts: textPartsFromForm(form),
        posterLayout: form.posterLayout,
        mapShape: sky ? "none" : form.mapShape,
        activity: activityFromForm(form as unknown as Record<string, unknown>, state.routes),
        messageLook: messageLookFromForm(form),
        ...(sky ? { mapCredit: false, starChart: true, coordsLabel: skyCoordsLabel(form.skyTime ?? "", formatCoordinates(lat, lon), language) } : {}),
        markers: hasVisibleMarkers && !sky ? state.markers : [],
        markerIcons: withOverlays ? getAllMarkerIcons(state.customMarkerIcons) : [],
        markerProjection: withOverlays ? markerProjection : undefined,
        markerScaleX: withOverlays ? markerScaleX : undefined,
        markerScaleY: withOverlays ? markerScaleY : undefined,
        markerSizeScale: withOverlays ? markerSizeScale : undefined,
        routes: sky ? [] : visibleRoutes,
      });
      return canvas;
    },
    [
      mapRef,
      form,
      effectiveTheme,
      hasVisibleMarkers,
      hasVisibleOverlays,
      visibleRoutes,
      state.routes,
      state.markers,
      state.customMarkerIcons,
      language,
    ],
  );

  /** Builds a print-ready file (300 DPI PNG, PDF or layered SVG) without downloading it. */
  const createPosterFile = useCallback(
    async (
      format: ExportFormat,
      options: { profile?: "screen" | "print" } = {},
    ): Promise<{ blob: Blob; filename: string }> => {
      const map = mapRef.current;
      if (!map) throw new Error("Map is not ready.");

      const widthCm = Number(form.width) || DEFAULT_POSTER_WIDTH_CM;
      const heightCm = Number(form.height) || DEFAULT_POSTER_HEIGHT_CM;
      const size = resolveCanvasSize(
        widthCm / CM_PER_INCH,
        heightCm / CM_PER_INCH,
        options.profile === "print"
          ? { maxPixels: PRINT_MAX_PIXELS, maxSide: PRINT_MAX_SIDE }
          : {},
      );
      const filename = createPosterFilename(
        form.displayCity || form.location,
        form.theme,
        format,
      );

      if (format === "svg" && isSkyPoster(form)) {
        throw new Error("SVG is not available for night-sky posters — use PNG or PDF.");
      }
      if (format === "svg") {
        if (form.showPosterText && form.fontFamily.trim()) {
          await ensureFont(form.fontFamily.trim());
        }
        const svgLayoutFont = getPosterLayout(form.posterLayout).cityStyle.family;
        if (form.showPosterText && svgLayoutFont) await ensureFont(svgLayoutFont);
        const svgMessageFont = resolveMessageType(messageLookFromForm(form), false).family;
        if (form.showPosterText && svgMessageFont) await ensureFont(svgMessageFont);
        const blob = await createLayeredSvgBlobFromMap({
          map,
          exportWidth: size.width,
          exportHeight: size.height,
          theme: effectiveTheme,
          center: {
            lat: Number(form.latitude) || 0,
            lon: Number(form.longitude) || 0,
          },
          displayCity: form.displayCity || form.location || "",
          displayCountry: form.displayCountry || "",
          fontFamily: form.fontFamily.trim(),
          showPosterText: form.showPosterText,
          showOverlay: form.showMarkers,
          includeCredits: form.includeCredits,
          customMessage: form.customMessage || "",
        textParts: textPartsFromForm(form),
        posterLayout: form.posterLayout,
        mapShape: form.mapShape,
        activity: activityFromForm(form as unknown as Record<string, unknown>, state.routes),
        messageLook: messageLookFromForm(form),
          markers: hasVisibleMarkers ? state.markers : [],
          markerIcons: hasVisibleOverlays
            ? getAllMarkerIcons(state.customMarkerIcons)
            : [],
          routes: visibleRoutes,
        });
        return { blob, filename };
      }

      const canvas = await renderPosterCanvas(size.width, size.height);
      const blob =
        format === "pdf"
          ? createPdfBlobFromCanvas(canvas, { widthCm, heightCm })
          : await createPngBlob(canvas, 300);
      return { blob, filename };
    },
    [
      mapRef,
      form,
      effectiveTheme,
      hasVisibleMarkers,
      hasVisibleOverlays,
      visibleRoutes,
      state.routes,
      state.markers,
      state.customMarkerIcons,
      renderPosterCanvas,
    ],
  );

  const exportPoster = useCallback(
    async (format: ExportFormat) => {
      if (!mapRef.current) {
        dispatch({ type: "SET_ERROR", error: "Map is not ready." });
        return;
      }

      dispatch({ type: "SET_EXPORT_STATUS", exporting: true });

      try {
        const widthCm = Number(form.width) || DEFAULT_POSTER_WIDTH_CM;
        const heightCm = Number(form.height) || DEFAULT_POSTER_HEIGHT_CM;

        // Aggregate, non-personal export data. Use only the structured city /
        // country — never raw input (form.location) or coordinates.
        const nextCount = readPosterExportCount() + 1;
        const secondsBetweenExports =
          lastExportAt !== null
            ? Math.round((Date.now() - lastExportAt) / 1000)
            : null;
        const exportParams = {
          format,
          poster_city: form.displayCity.trim() || "unknown",
          poster_country: form.displayCountry.trim() || "unknown",
          theme: form.theme,
          poster_size: `${widthCm}x${heightCm}`,
          font: form.fontFamily.trim() || "default",
          has_markers: hasVisibleMarkers,
          has_routes: visibleRoutes.length > 0,
          export_number: nextCount,
          ...(secondsBetweenExports !== null
            ? { seconds_between_exports: secondsBetweenExports }
            : {}),
        };

        const { blob, filename } = await createPosterFile(format);
        await triggerDownloadBlob(blob, filename);

        reportExportSuccess(nextCount, exportParams);
        registerSuccessfulExport(nextCount);
        dispatch({ type: "SET_EXPORT_STATUS", exporting: false });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Export failed.";
        trackEvent("export_failed", { format, reason: message });
        dispatch({ type: "SET_EXPORT_STATUS", exporting: false, error: message });
      }
    },
    [
      mapRef,
      form,
      dispatch,
      hasVisibleMarkers,
      visibleRoutes,
      registerSuccessfulExport,
      createPosterFile,
    ],
  );

  const handleDownloadPng = useCallback(
    () => exportPoster("png"),
    [exportPoster],
  );

  const handleDownloadPdf = useCallback(
    () => exportPoster("pdf"),
    [exportPoster],
  );

  const handleDownloadSvg = useCallback(
    () => exportPoster("svg"),
    [exportPoster],
  );

  return {
    isExporting: state.isExporting,
    exportPoster,
    createPosterFile,
    renderPosterCanvas,
    handleDownloadPng,
    handleDownloadPdf,
    handleDownloadSvg,
  };
}
