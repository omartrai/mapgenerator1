import { formatCoordinates } from "@/shared/geo/posterBounds";
import type { Coordinate } from "@/shared/geo/types";
import {
  DEFAULT_POSTER_LAYOUT,
  cityText,
  countryText,
  getPosterLayout,
  paperMaskPath,
  type TextSlot,
} from "@/features/poster/domain/posterLayout";
import {
  TEXT_DIMENSION_REFERENCE_PX,
  MESSAGE_FONT_BASE_PX,
  TEXT_EDGE_MARGIN_RATIO,
  CITY_FONT_BASE_PX,
  COUNTRY_FONT_BASE_PX,
  COORDS_FONT_BASE_PX,
  ATTRIBUTION_FONT_BASE_PX,
  formatCityLabel,
  computeCityFontScale,
  computeAttributionColor,
  ALL_TEXT_PARTS,
  type PosterTextParts,
} from "@/features/poster/domain/textLayout";

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
  theme: { ui?: { text?: string; bg?: string }; map?: { land?: string } },
  center: Coordinate,
  city: string,
  country: string,
  fontFamily: string | undefined,
  showPosterText: boolean,
  showOverlay: boolean,
  includeCredits: boolean = true,
  customMessage: string = "",
  textParts: PosterTextParts = ALL_TEXT_PARTS,
  layoutId: string = DEFAULT_POSTER_LAYOUT,
  mapShape: string = "none",
): void {
  const layout = getPosterLayout(layoutId);
  const themeText = theme.ui?.text || "#111111";
  const paper = theme.ui?.bg || "#ffffff";
  const landColor = theme.map?.land || "#808080";
  const attributionColor = computeAttributionColor(themeText, landColor, showOverlay);
  const attributionAlpha = showOverlay ? 0.55 : 0.9;
  const titleFontFamily = fontFamily
    ? `"${fontFamily}", "Space Grotesk", sans-serif`
    : '"Space Grotesk", sans-serif';
  const bodyFontFamily = fontFamily
    ? `"${fontFamily}", "IBM Plex Mono", monospace`
    : '"IBM Plex Mono", monospace';

  const shortSide = Math.min(width, height);
  // Scales with the poster, like the preview (cqmin), so every render matches it.
  const dimScale = shortSide / TEXT_DIMENSION_REFERENCE_PX;
  const attributionFontSize = ATTRIBUTION_FONT_BASE_PX * dimScale;

  // Layout decorations (drawn whether or not the text is shown).
  const mask = paperMaskPath(layout, mapShape, width, height);
  if (mask) {
    ctx.fillStyle = paper;
    ctx.fill(new Path2D(mask), "evenodd");
  }
  if (layout.rule && showPosterText) {
    ctx.fillStyle = themeText;
    const ruleHeight = layout.rule.width * dimScale;
    ctx.fillRect(width * layout.rule.x1, height * layout.rule.y - ruleHeight / 2, width * (layout.rule.x2 - layout.rule.x1), ruleHeight);
  }
  if (layout.border) {
    const { inset, gap, outerWidth, innerWidth } = layout.border;
    const edge = shortSide * inset;
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, width, edge);
    ctx.fillRect(0, height - edge, width, edge);
    ctx.fillRect(0, 0, edge, height);
    ctx.fillRect(width - edge, 0, edge, height);
    ctx.strokeStyle = themeText;
    const outer = outerWidth * dimScale;
    ctx.lineWidth = outer;
    ctx.strokeRect(edge + outer / 2, edge + outer / 2, width - 2 * edge - outer, height - 2 * edge - outer);
    const inner = innerWidth * dimScale;
    const innerEdge = edge + outer + shortSide * gap;
    ctx.lineWidth = inner;
    ctx.strokeRect(innerEdge + inner / 2, innerEdge + inner / 2, width - 2 * innerEdge - inner, height - 2 * innerEdge - inner);
  }
  if (layout.band) {
    const top = height * layout.band.top;
    ctx.fillStyle = paper;
    ctx.fillRect(0, top, width, height - top);
    ctx.fillStyle = themeText;
    ctx.fillRect(0, top, width, layout.band.rule * dimScale);
  }
  if (layout.box && showPosterText) {
    const boxWidth = width * layout.box.width;
    ctx.fillStyle = layout.box.fill;
    ctx.fillRect((width - boxWidth) / 2, height * layout.box.top, boxWidth, height * (layout.box.bottom - layout.box.top));
  }

  const textColor = layout.box ? layout.box.text : themeText;

  if (showPosterText) {
    const cityLabel = cityText(layout, city, formatCityLabel);
    const spacedCity = layout.cityStyle.case === "spaced";
    const cityFontSize =
      CITY_FONT_BASE_PX * dimScale * (spacedCity ? computeCityFontScale(city) : 1) * layout.scale.city;
    const cityFamily = layout.cityStyle.family
      ? `"${layout.cityStyle.family}", ${titleFontFamily}`
      : titleFontFamily;
    const countryFontSize = COUNTRY_FONT_BASE_PX * dimScale * layout.scale.country;
    const coordinateFontSize = COORDS_FONT_BASE_PX * dimScale * layout.scale.coords;
    const maxTextWidth = width * layout.maxWidth;
    const at = (slot: TextSlot) => {
      ctx.textAlign = slot.align;
      return [width * slot.x, height * slot.y] as const;
    };

    ctx.fillStyle = textColor;
    ctx.textBaseline = "middle";
    if (textParts.city) {
      setFittedFont(ctx, cityLabel, layout.cityStyle.weight, cityFontSize, cityFamily, maxTextWidth);
      ctx.fillText(cityLabel, ...at(layout.city));
    }

    if (textParts.divider && layout.divider) {
      ctx.strokeStyle = textColor;
      ctx.lineWidth = 3 * dimScale;
      ctx.beginPath();
      ctx.moveTo(width * 0.4, height * layout.divider.y);
      ctx.lineTo(width * 0.6, height * layout.divider.y);
      ctx.stroke();
    }

    if (textParts.country) {
      const label = countryText(layout, country);
      setFittedFont(ctx, label, 300, countryFontSize, titleFontFamily, maxTextWidth);
      const [x, y] = at(layout.country);
      ctx.fillText(label, x, y);
      if (layout.countryRules && textParts.divider) {
        const half = ctx.measureText(label).width / 2;
        const gap = shortSide * layout.countryRules.gap;
        const length = shortSide * layout.countryRules.length;
        ctx.strokeStyle = textColor;
        ctx.lineWidth = 3 * dimScale;
        ctx.beginPath();
        ctx.moveTo(x - half - gap - length, y);
        ctx.lineTo(x - half - gap, y);
        ctx.moveTo(x + half + gap, y);
        ctx.lineTo(x + half + gap + length, y);
        ctx.stroke();
      }
    }

    if (textParts.coordinates) {
      ctx.globalAlpha = 0.75;
      ctx.font = `400 ${coordinateFontSize}px ${bodyFontFamily}`;
      ctx.fillText(formatCoordinates(center.lat, center.lon), ...at(layout.coords));
      ctx.globalAlpha = 1;
    }

    const message = textParts.message ? customMessage.trim() : "";
    if (message) {
      setFittedFont(
        ctx,
        message,
        400,
        MESSAGE_FONT_BASE_PX * dimScale * layout.scale.message,
        titleFontFamily,
        Math.min(width * 0.7, maxTextWidth),
      );
      ctx.font = `italic ${ctx.font}`;
      ctx.fillText(message, ...at(layout.message));
    }
  }

  ctx.fillStyle = layout.band || layout.border || mask ? themeText : attributionColor;
  ctx.globalAlpha = attributionAlpha;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.font = `300 ${attributionFontSize}px ${bodyFontFamily}`;
  const creditInset = layout.border ? layout.border.inset * shortSide + 40 * dimScale : 0;
  ctx.fillText(
    "\u00a9 OpenStreetMap contributors",
    width * (1 - TEXT_EDGE_MARGIN_RATIO) - creditInset,
    height * (1 - TEXT_EDGE_MARGIN_RATIO) - creditInset,
  );
  ctx.globalAlpha = 1;
}
