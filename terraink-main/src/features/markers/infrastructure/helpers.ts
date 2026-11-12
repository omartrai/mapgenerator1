import type {
  MarkerDefaults,
  MarkerIconDefinition,
  MarkerItem,
} from "@/features/markers/domain/types";
import { DEFAULT_MARKER_SIZE } from "@/features/markers/domain/constants";
import { DEFAULT_MARKER_COLOR } from "./constants";
import { featuredMarkerIcons, predefinedMarkerIcons } from "./iconRegistry";

const CUSTOM_ICON_PREFIX = "custom-marker-icon";

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createDefaultMarkerSettings(): MarkerDefaults {
  return {
    size: DEFAULT_MARKER_SIZE,
    color: DEFAULT_MARKER_COLOR,
  };
}

export function createMarkerItem(input: {
  lat: number;
  lon: number;
  defaults: MarkerDefaults;
  iconId?: string;
}): MarkerItem {
  return {
    id: createId("marker"),
    lat: input.lat,
    lon: input.lon,
    iconId: input.iconId ?? featuredMarkerIcons[0]?.id ?? predefinedMarkerIcons[0].id,
    size: input.defaults.size ?? DEFAULT_MARKER_SIZE,
    color: input.defaults.color ?? DEFAULT_MARKER_COLOR,
  };
}

export function createUploadedMarkerIcon(input: {
  label: string;
  dataUrl: string;
  tintWithMarkerColor?: boolean;
}): MarkerIconDefinition {
  return {
    id: createId(CUSTOM_ICON_PREFIX),
    label: input.label,
    source: "custom",
    kind: "image",
    dataUrl: input.dataUrl,
    tintWithMarkerColor: Boolean(input.tintWithMarkerColor),
  };
}

export function getUploadLabel(filename: string) {
  const baseName = filename.replace(/\.[^.]+$/, "").trim();
  return baseName || "Custom Marker";
}

export function isSvgFile(file: File) {
  return file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
}

/** Longest side, in pixels, an uploaded raster icon is stored at. */
const UPLOAD_MAX_PX = 256;

/**
 * Reads an uploaded icon as a data URL. Raster images larger than 256 px are
 * scaled down (PNG keeps transparency) so designs stay light in the cart.
 */
export function readIconFileAsDataUrl(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read icon upload."));
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      if (isSvgFile(file) || typeof document === "undefined") {
        resolve(dataUrl);
        return;
      }
      const image = new Image();
      image.onload = () => {
        const longest = Math.max(image.naturalWidth, image.naturalHeight);
        if (!longest || longest <= UPLOAD_MAX_PX) {
          resolve(dataUrl);
          return;
        }
        const scale = UPLOAD_MAX_PX / longest;
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.naturalWidth * scale);
        canvas.height = Math.round(image.naturalHeight * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      };
      image.onerror = () => reject(new Error("Could not read icon upload."));
      image.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}
