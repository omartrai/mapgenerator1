import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { ensureFont } from "@/core/services";
import { formatCoordinates } from "@/shared/geo/posterBounds";
import {
  cityText,
  countryText,
  getPosterLayout,
  paperMaskPath,
  ACTIVITY_TYPE,
  type TextSlot,
} from "@/features/poster/domain/posterLayout";
import type { ActivityPrint } from "@/features/poster/domain/activityPoster";
import {
  messageCenterY,
  resolveMessageType,
  type MessageLook,
} from "@/features/poster/domain/messageStyle";
import { profileAreaPath } from "@/features/routes/domain/activity";
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

interface PosterTextOverlayProps {
  city: string;
  country: string;
  lat: number;
  lon: number;
  fontFamily: string;
  textColor: string;
  landColor: string;
  /** Poster colour, used by the border and band layouts. */
  paperColor?: string;
  showPosterText: boolean;
  message?: string;
  textParts?: PosterTextParts;
  layout?: string;
  /** Map cut-out shape (none, circle, heart, star). */
  mapShape?: string;
  /** Sport layout extras: date line, stats, elevation profile, accent colour. */
  activity?: ActivityPrint;
  /** Size, typeface and style of the personal message. */
  messageLook?: MessageLook;
  includeCredits: boolean;
  showOverlay: boolean;
}

const pct = (ratio: number) => `${ratio * 100}%`;

/** Absolute placement of one text line from its layout slot. */
function slotStyle(slot: TextSlot): CSSProperties {
  if (slot.align === "left") return { top: pct(slot.y), left: pct(slot.x), right: "auto", textAlign: "left" };
  if (slot.align === "right") return { top: pct(slot.y), right: pct(1 - slot.x), left: "auto", textAlign: "right" };
  return { top: pct(slot.y), left: 0, right: 0, textAlign: "center" };
}

/**
 * Shrinks the font of each [data-fit] line so it fits the layout's max
 * width, the same rule the print renderer applies with measureText.
 */
function useFitText(rootRef: RefObject<HTMLDivElement>, maxWidthRatio: number, deps: unknown[]) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const fit = () => {
      root.querySelectorAll<HTMLElement>("[data-fit]").forEach((line) => {
        const limit = root.clientWidth * (Number(line.dataset.fit) || maxWidthRatio);
        const text = line.firstElementChild as HTMLElement | null;
        if (!text) return;
        line.style.setProperty("--fit", "1");
        const width = text.offsetWidth;
        if (width > limit && width > 0) line.style.setProperty("--fit", String(limit / width));
      });
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(root);
    void document.fonts?.ready.then(fit);
    root.addEventListener("fontload", fit);
    return () => {
      observer.disconnect();
      root.removeEventListener("fontload", fit);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * DOM-based poster text overlay (sharp at any resolution, GPU-composited).
 * Renders the layout decorations, city name, divider, country, coordinates
 * and attribution positioned to match the canvas export layout exactly.
 */
export default function PosterTextOverlay({
  city,
  country,
  lat,
  lon,
  fontFamily,
  textColor: themeText,
  landColor,
  paperColor = "#ffffff",
  showPosterText,
  message = "",
  textParts = ALL_TEXT_PARTS,
  layout: layoutId,
  mapShape = "none",
  activity,
  messageLook,
  includeCredits,
  showOverlay,
}: PosterTextOverlayProps) {
  const layout = getPosterLayout(layoutId);
  const rootRef = useRef<HTMLDivElement>(null);
  const toCqMin = (px: number) => (px / TEXT_DIMENSION_REFERENCE_PX) * 100;

  const titleFont = fontFamily
    ? `"${fontFamily}", "Space Grotesk", sans-serif`
    : '"Space Grotesk", sans-serif';
  const bodyFont = fontFamily
    ? `"${fontFamily}", "IBM Plex Mono", monospace`
    : '"IBM Plex Mono", monospace';

  const textColor = layout.box ? layout.box.text : themeText;
  const cityLabel = cityText(layout, city, formatCityLabel);
  const countryLabel = countryText(layout, country);
  const spacedCity = layout.cityStyle.case === "spaced";
  const cityFont = layout.cityStyle.family ? `"${layout.cityStyle.family}", ${titleFont}` : titleFont;

  // The paper mask is an SVG path in pixels, so track the overlay's size.
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const update = () => setSize({ width: root.clientWidth, height: root.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);
  const mask = size.width > 0 ? paperMaskPath(layout, mapShape, size.width, size.height) : null;

  // Script layouts use their own face; load it so the preview shows it.
  useEffect(() => {
    if (layout.cityStyle.family) void ensureFont(layout.cityStyle.family);
  }, [layout.cityStyle.family]);
  const trimmedMessage = message.trim();
  const fitted = (px: number) => `calc(${toCqMin(px)}cqmin * var(--fit, 1))`;
  const cityFontSize = fitted(CITY_FONT_BASE_PX * (spacedCity ? computeCityFontScale(city) : 1) * layout.scale.city);
  const countryFontSize = fitted(COUNTRY_FONT_BASE_PX * layout.scale.country);
  const coordsFontSize = `${toCqMin(COORDS_FONT_BASE_PX * layout.scale.coords)}cqmin`;
  const messageType = resolveMessageType(messageLook, Boolean(layout.activity));
  const messageBasePx = MESSAGE_FONT_BASE_PX * layout.scale.message;
  const messageSizePx = messageBasePx * messageType.scale;
  const messageFontSize = fitted(messageSizePx);
  const messageFont = messageType.family ? `"${messageType.family}", ${titleFont}` : titleFont;
  const messageY =
    size.width > 0
      ? messageCenterY(
          layout.message,
          layout,
          messageSizePx,
          messageBasePx,
          Math.min(size.width, size.height) / size.height,
          TEXT_DIMENSION_REFERENCE_PX,
        )
      : layout.message.y;
  useEffect(() => {
    if (!messageType.family) return;
    void ensureFont(messageType.family).then(() => {
      rootRef.current?.dispatchEvent(new Event("fontload"));
    });
  }, [messageType.family]);
  const attributionFontSize = `${toCqMin(ATTRIBUTION_FONT_BASE_PX)}cqmin`;
  const attributionColor =
    layout.band || layout.border || mapShape !== "none" || layout.mapWindow
      ? themeText
      : computeAttributionColor(themeText, landColor, showOverlay);
  const attributionOpacity = showOverlay ? 0.55 : 0.9;
  const creditInset = layout.border ? `calc(${layout.border.inset * 100}cqmin + ${toCqMin(40)}cqmin)` : "0px";

  const sport = layout.activity;
  const accent = activity?.accent || "#e8622c";
  const stats = activity?.stats ?? [];
  const profile = activity?.profile ?? [];
  const statColumn = sport && stats.length ? sport.stats.w / stats.length : 0;
  useFitText(rootRef, layout.maxWidth, [
    cityLabel,
    countryLabel,
    trimmedMessage,
    messageSizePx,
    messageFont,
    messageType.weight,
    messageType.italic,
    messageType.upper,
    fontFamily,
    layoutId,
    showPosterText,
    activity?.subtitle,
    stats.map((stat) => stat.value + stat.label).join("|"),
  ]);
  // Re-fit once a script face has loaded (it changes the measured width).
  useEffect(() => {
    if (!layout.cityStyle.family) return;
    void document.fonts?.load(`400 32px "${layout.cityStyle.family}"`).then(() => {
      rootRef.current?.dispatchEvent(new Event("fontload"));
    });
  }, [layout.cityStyle.family]);

  const border = layout.border;
  const outer = border ? toCqMin(border.outerWidth) : 0;

  return (
    <div ref={rootRef} className="poster-text-overlay" style={{ color: textColor }}>
      {mask ? (
        <svg className="poster-layout-mask" viewBox={`0 0 ${size.width} ${size.height}`} preserveAspectRatio="none" aria-hidden="true">
          <path d={mask} fill={paperColor} fillRule="evenodd" />
        </svg>
      ) : null}
      {layout.rule && showPosterText ? (
        <div
          className="poster-layout-hrule"
          style={{
            top: pct(layout.rule.y),
            left: pct(layout.rule.x1),
            width: pct(layout.rule.x2 - layout.rule.x1),
            borderTopWidth: `${toCqMin(layout.rule.width)}cqmin`,
            borderTopColor: themeText,
          }}
        />
      ) : null}
      {border ? (
        <>
          <div className="poster-layout-mat" style={{ borderColor: paperColor, borderWidth: `${border.inset * 100}cqmin` }} />
          <div
            className="poster-layout-rule"
            style={{ inset: `${border.inset * 100}cqmin`, borderWidth: `${outer}cqmin`, borderColor: themeText }}
          />
          <div
            className="poster-layout-rule"
            style={{
              inset: `${(border.inset + border.gap) * 100 + outer}cqmin`,
              borderWidth: `${toCqMin(border.innerWidth)}cqmin`,
              borderColor: themeText,
            }}
          />
        </>
      ) : null}
      {layout.band ? (
        <div
          className="poster-layout-band"
          style={{
            top: pct(layout.band.top),
            background: paperColor,
            borderTop: `${toCqMin(layout.band.rule)}cqmin solid ${themeText}`,
          }}
        />
      ) : null}
      {layout.box && showPosterText ? (
        <div
          className="poster-layout-box"
          style={{
            top: pct(layout.box.top),
            height: pct(layout.box.bottom - layout.box.top),
            width: pct(layout.box.width),
            background: layout.box.fill,
          }}
        />
      ) : null}

      {showPosterText && (
        <>
          {textParts.city ? (
            <p
              className="poster-city poster-line"
              data-fit=""
              style={{
                ...slotStyle(layout.city),
                fontFamily: cityFont,
                fontSize: cityFontSize,
                fontWeight: layout.cityStyle.weight,
                textTransform: spacedCity ? "uppercase" : "none",
              }}
            >
              <span>{cityLabel}</span>
            </p>
          ) : null}
          {sport ? (
            <>
              {sport.accentRules.map((y) => (
                <div
                  key={y}
                  className="poster-accent-rule"
                  style={{
                    top: pct(y),
                    width: pct(sport.accentRuleWidth),
                    height: `${toCqMin(ACTIVITY_TYPE.accentRule)}cqmin`,
                    background: accent,
                  }}
                />
              ))}
              {activity?.subtitle ? (
                <p
                  className="poster-activity-sub poster-line"
                  data-fit=""
                  style={{
                    top: pct(sport.subtitleY),
                    left: 0,
                    right: 0,
                    fontFamily: bodyFont,
                    fontSize: fitted(ACTIVITY_TYPE.subtitle),
                  }}
                >
                  <span>{activity.subtitle}</span>
                </p>
              ) : null}
              {profile.length > 1 && size.width > 0 ? (
                <svg className="poster-layout-mask" viewBox={`0 0 ${size.width} ${size.height}`} preserveAspectRatio="none" aria-hidden="true">
                  <path
                    d={profileAreaPath(profile, {
                      x: size.width * sport.profile.x,
                      y: size.height * sport.profile.y,
                      w: size.width * sport.profile.w,
                      h: size.height * sport.profile.h,
                    })}
                    fill={accent}
                    fillOpacity={0.9}
                  />
                </svg>
              ) : null}
              {stats.map((stat, index) => {
                const left = sport.stats.x + statColumn * index;
                const fit = String(Math.max(0.01, statColumn - 0.02));
                return (
                  <div key={index}>
                    <p
                      className="poster-stat poster-line"
                      data-fit={fit}
                      style={{
                        top: pct(sport.stats.valueY),
                        left: pct(left),
                        width: pct(statColumn),
                        fontFamily: titleFont,
                        fontWeight: 600,
                        fontSize: fitted(ACTIVITY_TYPE.statValue),
                      }}
                    >
                      <span>{stat.value}</span>
                    </p>
                    {stat.label ? (
                      <p
                        className="poster-stat poster-line"
                        data-fit={fit}
                        style={{
                          top: pct(sport.stats.labelY),
                          left: pct(left),
                          width: pct(statColumn),
                          fontFamily: titleFont,
                          fontWeight: 500,
                          opacity: 0.75,
                          fontSize: fitted(ACTIVITY_TYPE.statLabel),
                        }}
                      >
                        <span>{stat.label}</span>
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </>
          ) : null}
          {textParts.divider && layout.divider ? (
            <hr
              className="poster-divider"
              style={{ borderColor: textColor, top: pct(layout.divider.y) }}
            />
          ) : null}
          {textParts.country && !sport ? (
            <p
              className="poster-country poster-line"
              data-fit=""
              style={{ ...slotStyle(layout.country), fontFamily: titleFont, fontSize: countryFontSize }}
            >
              <span>
                {layout.countryRules && textParts.divider ? (
                  <span
                    className="poster-country__rule"
                    style={{
                      width: `${layout.countryRules.length * 100}cqmin`,
                      marginInlineEnd: `${layout.countryRules.gap * 100}cqmin`,
                      borderTopWidth: `${toCqMin(3)}cqmin`,
                    }}
                  />
                ) : null}
                {countryLabel}
                {layout.countryRules && textParts.divider ? (
                  <span
                    className="poster-country__rule"
                    style={{
                      width: `${layout.countryRules.length * 100}cqmin`,
                      marginInlineStart: `${layout.countryRules.gap * 100}cqmin`,
                      borderTopWidth: `${toCqMin(3)}cqmin`,
                    }}
                  />
                ) : null}
              </span>
            </p>
          ) : null}
          {textParts.coordinates && !sport ? (
            <p
              className="poster-coords poster-line"
              style={{ ...slotStyle(layout.coords), fontFamily: bodyFont, fontSize: coordsFontSize }}
            >
              {formatCoordinates(lat, lon)}
            </p>
          ) : null}
          {textParts.message && trimmedMessage ? (
            <p
              className="poster-message poster-line"
              data-fit={sport ? "" : String(Math.min(0.8, layout.maxWidth))}
              style={{
                ...slotStyle({ ...layout.message, y: messageY }),
                fontFamily: messageFont,
                fontSize: messageFontSize,
                fontStyle: messageType.italic ? "italic" : "normal",
                fontWeight: messageType.weight,
              }}
            >
              <span>{messageType.upper ? trimmedMessage.toUpperCase() : trimmedMessage}</span>
            </p>
          ) : null}
        </>
      )}

      <span
        className="poster-attribution"
        style={{
          fontFamily: bodyFont,
          color: attributionColor,
          opacity: attributionOpacity,
          fontSize: attributionFontSize,
          bottom: `calc(${TEXT_EDGE_MARGIN_RATIO * 100}% + ${creditInset})`,
          right: `calc(${TEXT_EDGE_MARGIN_RATIO * 100}% + ${creditInset})`,
        }}
      >
        &copy; OpenStreetMap contributors
      </span>
    </div>
  );
}
