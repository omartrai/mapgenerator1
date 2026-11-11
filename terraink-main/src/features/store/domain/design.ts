/**
 * A frozen, serialisable copy of everything needed to re-create a poster
 * exactly: the editor form (location, framing distance, theme, text, layers),
 * colour overrides, markers, routes, custom icons and map rotation.
 *
 * Stored verbatim with every order so the print file can be regenerated at
 * any time from the same inputs the customer saw.
 */
export const DESIGN_SCHEMA_VERSION = 1;

export interface PosterDesign {
  version: number;
  form: Record<string, string | boolean>;
  customColors: Record<string, string>;
  markers: unknown[];
  routes: unknown[];
  customMarkerIcons: unknown[];
  bearing: number;
}

export interface DesignSummary {
  title: string;
  subtitle: string;
  themeId: string;
  themeName: string;
  fontFamily: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  markerCount: number;
  routeCount: number;
}

export function isPosterDesign(value: unknown): value is PosterDesign {
  if (!value || typeof value !== "object") return false;
  const design = value as Record<string, unknown>;
  return (
    typeof design.version === "number" &&
    !!design.form &&
    typeof design.form === "object" &&
    Array.isArray(design.markers) &&
    Array.isArray(design.routes)
  );
}
