import maplibregl from "maplibre-gl";
import mlcontour from "maplibre-contour";
import type { LayerSpecification, SourceSpecification } from "maplibre-gl";

/**
 * Contour lines and hill shading for trail posters, drawn from the open
 * Terrarium elevation tiles (AWS Open Data). The contour vector tiles are
 * made in the browser by maplibre-contour from the same elevation tiles.
 */
const DEM_URL = "https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png";
const DEM_MAX_ZOOM = 13;

let demSource: InstanceType<typeof mlcontour.DemSource> | null = null;

function ensureDemSource() {
  if (!demSource) {
    demSource = new mlcontour.DemSource({ url: DEM_URL, encoding: "terrarium", maxzoom: DEM_MAX_ZOOM, worker: false });
    demSource.setupMaplibre(maplibregl);
  }
  return demSource;
}

/** Sources and layers to add (under the roads) for a contour map in the given ink colour. */
export function contourStyleParts(ink: string, widthScale = 1): {
  sources: Record<string, SourceSpecification>;
  layers: LayerSpecification[];
} {
  const dem = ensureDemSource();
  return {
    sources: {
      "trail-dem": {
        type: "raster-dem",
        tiles: [DEM_URL],
        encoding: "terrarium",
        tileSize: 256,
        maxzoom: DEM_MAX_ZOOM,
      },
      "trail-contours": {
        type: "vector",
        tiles: [
          dem.contourProtocolUrl({
            // [minor, major] metres between lines, by zoom.
            // The poster map is drawn several zoom levels deeper than it looks
            // (see MAP_OVERZOOM_SCALE), hence the high zooms here.
            thresholds: { 9: [200, 1000], 11: [100, 500], 13: [50, 250], 14: [40, 200], 15: [25, 125], 16: [20, 100] },
            elevationKey: "ele",
            levelKey: "level",
            contourLayer: "contours",
          }),
        ],
        maxzoom: 15,
      },
    },
    layers: [
      {
        id: "trail-hillshade",
        type: "hillshade",
        source: "trail-dem",
        paint: {
          "hillshade-exaggeration": 0.12,
          "hillshade-shadow-color": "rgba(60, 52, 40, 0.55)",
          "hillshade-highlight-color": "#ffffff",
          "hillshade-accent-color": "rgba(60, 52, 40, 0.25)",
        },
      },
      {
        id: "trail-contours-minor",
        type: "line",
        source: "trail-contours",
        "source-layer": "contours",
        filter: ["==", ["get", "level"], 0],
        paint: { "line-color": ink, "line-opacity": 0.34, "line-width": 0.7 * widthScale },
      },
      {
        id: "trail-contours-major",
        type: "line",
        source: "trail-contours",
        "source-layer": "contours",
        filter: [">", ["get", "level"], 0],
        paint: { "line-color": ink, "line-opacity": 0.62, "line-width": 1.3 * widthScale },
      },
    ],
  };
}
