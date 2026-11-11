import { MAX_PIXELS, MAX_SIDE, OUTPUT_DPI } from "./constants";
import type { CanvasSize } from "../../domain/types";

export function resolveCanvasSize(
  widthInches: number,
  heightInches: number,
  limits: { maxPixels?: number; maxSide?: number } = {},
): CanvasSize {
  const maxPixels = limits.maxPixels ?? MAX_PIXELS;
  const maxSide = limits.maxSide ?? MAX_SIDE;
  const requestedWidth = Math.max(600, Math.round(widthInches * OUTPUT_DPI));
  const requestedHeight = Math.max(600, Math.round(heightInches * OUTPUT_DPI));
  const totalPixels = requestedWidth * requestedHeight;

  const areaFactor =
    totalPixels > maxPixels ? Math.sqrt(maxPixels / totalPixels) : 1;
  const sideFactor =
    Math.max(requestedWidth, requestedHeight) > maxSide
      ? maxSide / Math.max(requestedWidth, requestedHeight)
      : 1;

  const factor = Math.min(areaFactor, sideFactor, 1);
  const width = Math.max(600, Math.round(requestedWidth * factor));
  const height = Math.max(600, Math.round(requestedHeight * factor));

  return {
    width,
    height,
    requestedWidth,
    requestedHeight,
    downscaleFactor: factor,
  };
}
