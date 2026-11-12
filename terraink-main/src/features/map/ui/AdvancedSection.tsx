import { useEffect, useState } from "react";
import { LuChevronRight, LuLayers, LuPalette, LuRotateCcw } from "react-icons/lu";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { openSettingsTab } from "@/shared/ui/settingsTabs";
import { useLanguage } from "@/shared/i18n/LanguageContext";

/** Event asking the theme panel to open its colour editor. */
export const OPEN_THEME_EDITOR_FOCUS = "theme-editor";

/**
 * "Advanced" tab: precise map rotation, and shortcuts to the detailed
 * colour editor and the map layers for customers who want to fine-tune.
 */
export default function AdvancedSection() {
  const { t } = useLanguage();
  const { mapRef } = usePosterContext();
  const [bearing, setBearing] = useState(() => Math.round(mapRef.current?.getBearing() ?? 0));

  // Follow the map when it is rotated elsewhere (preview buttons, reset…).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;
    const sync = () => setBearing(Math.round(map.getBearing()));
    sync();
    map.on("rotate", sync);
    return () => {
      map.off("rotate", sync);
    };
  }, [mapRef, mapRef.current]);

  const rotateTo = (value: number) => {
    const next = Math.max(-180, Math.min(180, Math.round(value)));
    setBearing(next);
    mapRef.current?.setBearing(next);
  };

  return (
    <div className="advanced-section">
      <section className="advanced-card">
        <div className="advanced-card__head">
          <p className="advanced-card__title">{t("advanced.rotate")}</p>
          <span className="advanced-card__value">{bearing}°</span>
        </div>
        <p className="advanced-card__hint">{t("advanced.rotateHint")}</p>
        <div className="advanced-rotate">
          <input
            type="range"
            min={-180}
            max={180}
            step={1}
            value={bearing}
            onChange={(event) => rotateTo(Number(event.target.value))}
            aria-label={t("advanced.rotate")}
            aria-valuetext={`${bearing}°`}
            className="advanced-rotate__slider"
          />
          <button
            type="button"
            className="advanced-rotate__reset"
            onClick={() => {
              setBearing(0);
              mapRef.current?.rotateTo(0, { duration: 300 });
            }}
            disabled={bearing === 0}
          >
            <LuRotateCcw aria-hidden="true" />
            {t("advanced.reset")}
          </button>
        </div>
        <div className="advanced-rotate__steps" role="group" aria-label={t("advanced.rotate")}>
          {[-90, -45, 45, 90].map((delta) => (
            <button
              key={delta}
              type="button"
              className="advanced-rotate__step"
              onClick={() => rotateTo(bearing + delta > 180 ? bearing + delta - 360 : bearing + delta < -180 ? bearing + delta + 360 : bearing + delta)}
            >
              {delta > 0 ? `+${delta}°` : `${delta}°`}
            </button>
          ))}
        </div>
      </section>

      <button
        type="button"
        className="advanced-link"
        onClick={() => openSettingsTab({ tab: "theme", focus: OPEN_THEME_EDITOR_FOCUS })}
      >
        <LuPalette aria-hidden="true" className="advanced-link__icon" />
        <span className="advanced-link__text">
          <span className="advanced-link__title">{t("advanced.colors")}</span>
          <span className="advanced-link__hint">{t("advanced.colorsHint")}</span>
        </span>
        <LuChevronRight aria-hidden="true" className="advanced-link__chevron rtl-flip" />
      </button>

      <button type="button" className="advanced-link" onClick={() => openSettingsTab({ tab: "layers" })}>
        <LuLayers aria-hidden="true" className="advanced-link__icon" />
        <span className="advanced-link__text">
          <span className="advanced-link__title">{t("advanced.layers")}</span>
          <span className="advanced-link__hint">{t("advanced.layersHint")}</span>
        </span>
        <LuChevronRight aria-hidden="true" className="advanced-link__chevron rtl-flip" />
      </button>
    </div>
  );
}
