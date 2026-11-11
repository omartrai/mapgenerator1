import { formatCoordinates } from "@/shared/geo/posterBounds";
import type { Coordinate } from "@/shared/geo/types";
import {
  TEXT_DIMENSION_REFERENCE_PX,
  TEXT_CITY_Y_RATIO,
  TEXT_DIVIDER_Y_RATIO,
  TEXT_COUNTRY_Y_RATIO,
  TEXT_COORDS_Y_RATIO,
  TEXT_MESSAGE_Y_RATIO,
  MESSAGE_FONT_BASE_PX,
  TEXT_EDGE_MARGIN_RATIO,
  CITY_FONT_BASE_PX,
  COUNTRY_FONT_BASE_PX,
  COORDS_FONT_BASE_PX,
  ATTRIBUTION_FONT_BASE_PX,
  isLatinScript,
  formatCityLabel,
  computeCityFontScale,
  computeAttributionColor,
} from "@/features/poster/domain/textLayout";

/** Largest share of the poster width a text line may take. */
const MAX_TEXT_WIDTH_RATIO = 0.86;

/**
 * Sets `weight size family` on the context, shrinking the size until the
 * text fits within maxWidth so wide typefaces and long names never clip.
 */
function setFittedFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  weight: number,
  sizePx: number,
  family: string,
  maxWidth: number,
): void {
  ctx.font = `${weight} ${sizePx}px ${family}`;
  const measured = ctx.measureText(text).width;
  if (measured > maxWidth && measured > 0) {
    ctx.font = `${weight} ${sizePx * (maxWidth / measured)}px ${family}`;
  }
}

export function drawPosterText(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  theme: { ui?: { text?: string }; map?: { land?: string } },
  center: Coordinate,
  city: string,
  country: string,
  fontFamily: string | undefined,
  showPosterText: boolean,
  showOverlay: boolean,
  includeCredits: boolean = true,
  customMessage: string = "",
): void {
  const textColor = theme.ui?.text || "#111111";
  const landColor = theme.map?.land || "#808080";
  const attributionColor = computeAttributionColor(textColor, landColor, showOverlay);
  const attributionAlpha = showOverlay ? 0.55 : 0.9;
  const titleFontFamily = fontFamily
    ? `"${fontFamily}", "Space Grotesk", sans-serif`
    : '"Space Grotesk", sans-serif';
  const bodyFontFamily = fontFamily
    ? `"${fontFamily}", "IBM Plex Mono", monospace`
    : '"IBM Plex Mono", monospace';

  const dimScale = Math.max(
    0.45,
    Math.min(width, height) / TEXT_DIMENSION_REFERENCE_PX,
  );
  const attributionFontSize = ATTRIBUTION_FONT_BASE_PX * dimScale;

  if (showPosterText) {
    const cityLabel = formatCityLabel(city);
    const cityFontSize = CITY_FONT_BASE_PX * dimScale * computeCityFontScale(city);

    const countryFontSize = COUNTRY_FONT_BASE_PX * dimScale;
    const coordinateFontSize = COORDS_FONT_BASE_PX * dimScale;
    const cityY = height * TEXT_CITY_Y_RATIO;
    const lineY = height * TEXT_DIVIDER_Y_RATIO;
    const countryY = height * TEXT_COUNTRY_Y_RATIO;
    const coordinatesY = height * TEXT_COORDS_Y_RATIO;

    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const maxTextWidth = width * MAX_TEXT_WIDTH_RATIO;
    setFittedFont(ctx, cityLabel, 700, cityFontSize, titleFontFamily, maxTextWidth);
    ctx.fillText(cityLabel, width * 0.5, cityY);

    ctx.strokeStyle = textColor;
    ctx.lineWidth = 3 * dimScale;
    ctx.beginPath();
    ctx.moveTo(width * 0.4, lineY);
    ctx.lineTo(width * 0.6, lineY);
    ctx.stroke();

    setFittedFont(ctx, country.toUpperCase(), 300, countryFontSize, titleFontFamily, maxTextWidth);
    ctx.fillText(country.toUpperCase(), width * 0.5, countryY);

    ctx.globalAlpha = 0.75;
    ctx.font = `400 ${coordinateFontSize}px ${bodyFontFamily}`;
    ctx.fillText(
      formatCoordinates(center.lat, center.lon),
      width * 0.5,
      coordinatesY,
    );
    ctx.globalAlpha = 1;

    const message = customMessage.trim();
    if (message) {
      setFittedFont(
        ctx,
        message,
        400,
        MESSAGE_FONT_BASE_PX * dimScale,
        titleFontFamily,
        width * 0.7,
      );
      ctx.font = `italic ${ctx.font}`;
      ctx.fillText(message, width * 0.5, height * TEXT_MESSAGE_Y_RATIO);
    }
  }

  ctx.fillStyle = attributionColor;
  ctx.globalAlpha = attributionAlpha;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.font = `300 ${attributionFontSize}px ${bodyFontFamily}`;
  ctx.fillText(
    "\u00a9 OpenStreetMap contributors",
    width * (1 - TEXT_EDGE_MARGIN_RATIO),
    height * (1 - TEXT_EDGE_MARGIN_RATIO),
  );
  ctx.globalAlpha = 1;

}
