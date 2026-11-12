import type { Coordinate } from "@/shared/geo/types";
import type { ROUTE_LINE_STYLES } from "./constants";
import type { ActivityStats } from "./activity";

export type RouteLineStyle = (typeof ROUTE_LINE_STYLES)[number];

export type RouteSource = "gpx" | "manual";

export interface RouteEndpointMarker {
  iconId: string;
  color: string;
  size: number;
  /** Hide just this icon (start or finish); missing = shown. */
  hidden?: boolean;
}

export interface Route {
  id: string;
  label: string;
  source: RouteSource;
  sourceFilename?: string;
  segments: Coordinate[][];
  color: string;
  strokeWidth: number;
  opacity: number;
  lineStyle: RouteLineStyle;
  visible: boolean;
  showEndpoints: boolean;
  startMarker: RouteEndpointMarker;
  finishMarker: RouteEndpointMarker;
  /** Sport figures read from the GPX (distance, climb, time, profile). */
  stats?: ActivityStats;
}

export interface RouteDefaults {
  color: string;
  strokeWidth: number;
  opacity: number;
  lineStyle: RouteLineStyle;
  startIconId: string;
  finishIconId: string;
}

export interface RouteBounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export interface ParsedGpx {
  label: string;
  segments: Coordinate[][];
  bounds: RouteBounds;
  pointCount: number;
  stats: ActivityStats;
}
