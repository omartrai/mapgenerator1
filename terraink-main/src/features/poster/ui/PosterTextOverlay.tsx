import { useLayoutEffect, useRef, type CSSProperties, type RefObject } from "react";
import { formatCoordinates } from "@/shared/geo/posterBounds";
import { getPosterLayout, type TextSlot } from "@/features/poster/domain/posterLayout";
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
      const limit = root.clientWidth * maxWidthRatio;
      root.querySelectorAll<HTMLElement>("[data-fit]").forEach((line) => {
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
    return () => observer.disconnect();
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
  const cityLabel = formatCityLabel(city);
  const countryLabel = country.toUpperCase();
  const trimmedMessage = message.trim();
  const fitted = (px: number) => `calc(${toCqMin(px)}cqmin * var(--fit, 1))`;
  const cityFontSize = fitted(CITY_FONT_BASE_PX * computeCityFontScale(city) * layout.scale.city);
  const countryFontSize = fitted(COUNTRY_FONT_BASE_PX * layout.scale.country);
  const coordsFontSize = `${toCqMin(COORDS_FONT_BASE_PX * layout.scale.coords)}cqmin`;
  const messageFontSize = fitted(MESSAGE_FONT_BASE_PX * layout.scale.message);
  const attributionFontSize = `${toCqMin(ATTRIBUTION_FONT_BASE_PX)}cqmin`;
  const attributionColor =
    layout.band || layout.border ? themeText : computeAttributionColor(themeText, landColor, showOverlay);
  const attributionOpacity = showOverlay ? 0.55 : 0.9;
  const creditInset = layout.border ? `calc(${layout.border.inset * 100}cqmin + ${toCqMin(40)}cqmin)` : "0px";

  useFitText(rootRef, layout.maxWidth, [cityLabel, countryLabel, trimmedMessage, fontFamily, layoutId, showPosterText]);

  const border = layout.border;
  const outer = border ? toCqMin(border.outerWidth) : 0;

  return (
    <div ref={rootRef} className="poster-text-overlay" style={{ color: textColor }}>
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
              style={{ ...slotStyle(layout.city), fontFamily: titleFont, fontSize: cityFontSize }}
            >
              <span>{cityLabel}</span>
            </p>
          ) : null}
          {textParts.divider && layout.divider ? (
            <hr
              className="poster-divider"
              style={{ borderColor: textColor, top: pct(layout.divider.y) }}
            />
          ) : null}
          {textParts.country ? (
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
          {textParts.coordinates ? (
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
              data-fit=""
              style={{ ...slotStyle(layout.message), fontFamily: titleFont, fontSize: messageFontSize }}
            >
              <span>{trimmedMessage}</span>
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
