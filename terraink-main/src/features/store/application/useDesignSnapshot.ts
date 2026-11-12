import { useCallback } from "react";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import type { MarkerIconDefinition, MarkerItem } from "@/features/markers/domain/types";
import type { Route } from "@/features/routes/domain/types";
import {
  DESIGN_SCHEMA_VERSION,
  type DesignSummary,
  type PosterDesign,
} from "../domain/design";
import type { DesignPreset } from "../domain/presets";
import { resolveDimensions } from "../domain/catalog";

/**
 * Freezes the current editor state into a serialisable design (for the cart
 * and the order) and restores designs/presets back into the editor.
 */
export function useDesignSnapshot() {
  const { state, dispatch, mapRef, effectiveTheme } = usePosterContext();

  const captureDesign = useCallback((): PosterDesign => {
    const referenced = JSON.stringify([state.markers, state.routes]);
    const customMarkerIcons = state.customMarkerIcons
      .filter((icon) => icon.source === "custom" && referenced.includes(`"${icon.id}"`))
      .map(({ component: _component, ...icon }) => icon);

    return {
      version: DESIGN_SCHEMA_VERSION,
      form: { ...state.form },
      customColors: { ...state.customColors },
      markers: state.markers.map((marker) => ({ ...marker })),
      routes: state.routes.map((route) => ({ ...route })),
      customMarkerIcons,
      bearing: mapRef.current?.getBearing() ?? 0,
    };
  }, [state, mapRef]);

  const summarize = useCallback((): DesignSummary => {
    const { form } = state;
    return {
      title: (form.displayCity || form.location || "Custom map").trim(),
      subtitle: (form.displayCountry || "").trim(),
      message: (form.customMessage || "").trim() || undefined,
      themeId: form.theme,
      themeName:
        effectiveTheme.name +
        (Object.keys(state.customColors).length > 0 ? " (custom colours)" : ""),
      fontFamily: form.fontFamily.trim() || "Space Grotesk",
      latitude: Number(form.latitude) || 0,
      longitude: Number(form.longitude) || 0,
      distanceMeters: Number(form.distance) || 0,
      markerCount: form.showMarkers ? state.markers.length : 0,
      routeCount: form.showRoutes ? state.routes.filter((route) => route.visible).length : 0,
    };
  }, [state, effectiveTheme.name]);

  const applyDesign = useCallback(
    (design: PosterDesign) => {
      dispatch({
        type: "LOAD_DESIGN",
        design: {
          form: design.form as Record<string, never>,
          customColors: design.customColors ?? {},
          markers: (design.markers ?? []) as MarkerItem[],
          routes: (design.routes ?? []) as Route[],
          customMarkerIcons: (design.customMarkerIcons ?? []) as MarkerIconDefinition[],
          bearing: Number(design.bearing) || 0,
        },
      });
    },
    [dispatch],
  );

  const applyPreset = useCallback(
    (preset: DesignPreset) => {
      const { widthCm, heightCm } = resolveDimensions(preset.product);
      dispatch({
        type: "LOAD_DESIGN",
        design: {
          form: {
            location: preset.location,
            latitude: preset.lat.toFixed(6),
            longitude: preset.lon.toFixed(6),
            distance: String(preset.distance),
            displayCity: preset.city,
            displayCountry: preset.country,
            theme: preset.theme,
            fontFamily: preset.fontFamily,
            width: String(widthCm),
            height: String(heightCm),
            showPosterText: true,
            posterLayout: "classic",
            showCity: true,
            showDivider: true,
            showCountry: true,
            showCoordinates: true,
            showMessage: true,
            customMessage: "",
          },
          customColors: {},
          markers: [],
          routes: [],
          customMarkerIcons: [],
          bearing: 0,
        },
      });
    },
    [dispatch],
  );

  return { captureDesign, summarize, applyDesign, applyPreset };
}
