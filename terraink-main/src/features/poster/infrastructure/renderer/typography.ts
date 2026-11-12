import { formatCoordinates } from "@/shared/geo/posterBounds";
import type { Coordinate } from "@/shared/geo/types";
import {
  DEFAULT_POSTER_LAYOUT,
  cityText,
  countryText,
  getPosterLayout,
  paperMaskPath,
  ACTIVITY_TYPE,
  type PosterLayoutSpec,
  type TextSlot,
} from "@/features/poster/domain/posterLayout";
import type { ActivityPrint } from "@/features/poster/domain/activityPoster";
import {
  messageCenterY,
  resolveMessageType,
  type MessageLook,
} from "@/features/poster/domain/messageStyle";
import { profileAreaPath } from "@/features/routes/domain/activity";
import { withAlpha } from "@/shared/utils/color";
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
  activity?: ActivityPrint,
  messageLook?: MessageLook,
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

    if (layout.activity) {
      drawActivityParts(ctx, width, height, dimScale, layout.activity, activity, textColor, bodyFontFamily, titleFontFamily);
    }

    if (textParts.divider && layout.divider) {
      ctx.strokeStyle = textColor;
      ctx.lineWidth = 3 * dimScale;
      ctx.beginPath();
      ctx.moveTo(width * 0.4, height * layout.divider.y);
      ctx.lineTo(width * 0.6, height * layout.divider.y);
      ctx.stroke();
    }

    if (textParts.country && !layout.activity) {
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

    if (textParts.coordinates && !layout.activity) {
      ctx.globalAlpha = 0.75;
      ctx.font = `400 ${coordinateFontSize}px ${bodyFontFamily}`;
      ctx.fillText(formatCoordinates(center.lat, center.lon), ...at(layout.coords));
      ctx.globalAlpha = 1;
    }

    const message = textParts.message ? customMessage.trim() : "";
    if (message) {
      const type = resolveMessageType(messageLook, Boolean(layout.activity));
      const baseRefPx = MESSAGE_FONT_BASE_PX * layout.scale.message;
      const sizeRefPx = baseRefPx * type.scale;
      const family = type.family ? `"${type.family}", ${titleFontFamily}` : titleFontFamily;
      const text = type.upper ? message.toUpperCase() : message;
      setFittedFont(
        ctx,
        text,
        type.weight,
        sizeRefPx * dimScale,
        family,
        layout.activity ? maxTextWidth : Math.min(width * 0.8, maxTextWidth),
      );
      if (type.italic) ctx.font = `italic ${ctx.font}`;
      const y = messageCenterY(
        layout.message,
        layout,
        sizeRefPx,
        baseRefPx,
        shortSide / height,
        TEXT_DIMENSION_REFERENCE_PX,
      );
      ctx.textAlign = layout.message.align;
      ctx.fillText(text, width * layout.message.x, height * y);
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

/** Sport layout: accent rules, date line, elevation profile and the stats row. */
function drawActivityParts(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  dimScale: number,
  spec: NonNullable<PosterLayoutSpec["activity"]>,
  activity: ActivityPrint | undefined,
  textColor: string,
  bodyFontFamily: string,
  titleFontFamily: string,
): void {
  const accent = activity?.accent || "#e8622c";
  ctx.save();
  ctx.fillStyle = accent;
  const ruleWidth = width * spec.accentRuleWidth;
  const ruleHeight = ACTIVITY_TYPE.accentRule * dimScale;
  for (const y of spec.accentRules) {
    ctx.fillRect((width - ruleWidth) / 2, height * y - ruleHeight / 2, ruleWidth, ruleHeight);
  }

  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (activity?.subtitle) {
    setFittedFont(ctx, activity.subtitle, 500, ACTIVITY_TYPE.subtitle * dimScale, bodyFontFamily, width * 0.8);
    ctx.fillText(activity.subtitle, width / 2, height * spec.subtitleY);
  }

  const profile = activity?.profile ?? [];
  if (profile.length > 1) {
    const box = {
      x: width * spec.profile.x,
      y: height * spec.profile.y,
      w: width * spec.profile.w,
      h: height * spec.profile.h,
    };
    ctx.fillStyle = withAlpha(accent, 0.9);
    ctx.fill(new Path2D(profileAreaPath(profile, box)));
  }

  const stats = activity?.stats ?? [];
  stats.forEach((stat, index) => {
    const x = width * (spec.stats.x + (spec.stats.w * (index + 0.5)) / stats.length);
    const column = (width * spec.stats.w) / stats.length - width * 0.02;
    ctx.fillStyle = textColor;
    setFittedFont(ctx, stat.value, 600, ACTIVITY_TYPE.statValue * dimScale, titleFontFamily, column);
    ctx.fillText(stat.value, x, height * spec.stats.valueY);
    if (stat.label) {
      ctx.globalAlpha = 0.75;
      setFittedFont(ctx, stat.label, 500, ACTIVITY_TYPE.statLabel * dimScale, titleFontFamily, column);
      ctx.fillText(stat.label, x, height * spec.stats.labelY);
      ctx.globalAlpha = 1;
    }
  });
  ctx.restore();
}
