import type { ResolvedTheme } from "@/features/theme/domain/types";
import type {
  MarkerIconDefinition,
  MarkerItem,
  MarkerProjectionInput,
} from "@/features/markers/domain/types";
import type { Route } from "@/features/routes/domain/types";

export interface CanvasSize {
  width: number;
  height: number;
  requestedWidth: number;
  requestedHeight: number;
  downscaleFactor: number;
}

/** Options passed to the export compositor (map snapshot + text overlay). */
export interface ExportOptions {
  theme: ResolvedTheme;
  center: { lat: number; lon: number };
  widthInches: number;
  heightInches: number;
  displayCity: string;
  displayCountry: string;
  displayContinent?: string;
  fontFamily: string;
  showPosterText: boolean;
  customMessage?: string;
  textParts?: import("./textLayout").PosterTextParts;
  /** Poster layout id (see posterLayout.ts). */
  posterLayout?: string;
  /** Map cut-out shape: none, circle, heart or star. */
  mapShape?: string;
  /** Sport layout extras (subtitle, stats, profile, accent). */
  activity?: import("./activityPoster").ActivityPrint;
  /** Size, typeface and style of the personal message. */
  messageLook?: import("./messageStyle").MessageLook;
  /** Text for the coordinates line instead of the coordinates. */
  coordsLabel?: string;
  /** Print the OpenStreetMap credit (default true). */
  mapCredit?: boolean;
  /** Night-sky poster: lays the message out under the star chart. */
  starChart?: boolean;
  /** Photo layout: the customer's photo, loaded, and black and white. */
  photoImage?: CanvasImageSource | null;
  /** Two-cities poster: full-poster snapshot of the second map. */
  twinMap?: CanvasImageSource | null;
  /** Two-cities poster: draw the heart pins on both places. */
  twinPins?: boolean;
  /** Where & when poster: the sky chart (transparent around its circle) and the column text. */
  vennSky?: CanvasImageSource | null;
  vennText?: import("../infrastructure/renderer/venn").VennText | null;
  photoMono?: boolean;
  photoFrame?: import("./posterLayout").PhotoFrame;
  showOverlay?: boolean;
  includeCredits?: boolean;
  markers?: MarkerItem[];
  markerIcons?: MarkerIconDefinition[];
  markerProjection?: MarkerProjectionInput;
  markerScaleX?: number;
  markerScaleY?: number;
  markerSizeScale?: number;
  routes?: Route[];
}

export interface Typography {
  displayCity: string;
  displayCountry: string;
  displayContinent?: string;
  fontFamily: string;
  showPosterText: boolean;
  includeCredits?: boolean;
}
