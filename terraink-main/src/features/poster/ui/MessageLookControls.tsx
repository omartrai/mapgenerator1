import { useEffect } from "react";
import { LuMove } from "react-icons/lu";
import { ensureFont } from "@/core/services";
import {
  MESSAGE_FONTS,
  MESSAGE_SIZES,
  MESSAGE_STYLES,
  NAMED_MESSAGE_FONTS,
} from "@/features/poster/domain/messageStyle";
import FontDropdown from "@/shared/ui/FontDropdown";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { useLanguage, type TranslationKey } from "@/shared/i18n/LanguageContext";

interface MessageLookControlsProps {
  x?: string;
  y?: string;
  size?: string;
  font?: string;
  style?: string;
  isSport: boolean;
}

/** Size, typeface and style pickers for the personal message. */
/** One-tap spots for the message (centre, 0–1 of the poster). */
const MESSAGE_SPOTS = [
  { id: "top", x: 0.5, y: 0.07 },
  { id: "middle", x: 0.5, y: 0.5 },
] as const;

export default function MessageLookControls({ x, y, size, font, style, isSport }: MessageLookControlsProps) {
  const { t } = useLanguage();
  const { dispatch } = usePosterContext();
  const set = (
    name: "messageSize" | "messageFont" | "messageStyle" | "messageX" | "messageY",
    value: string,
  ) => dispatch({ type: "SET_FIELD", name, value });
  const moved = Boolean(x && y);
  const placeAt = (spotX: number | null, spotY: number | null) => {
    set("messageX", spotX === null ? "" : String(spotX));
    set("messageY", spotY === null ? "" : String(spotY));
  };
  const activeSpot = moved
    ? MESSAGE_SPOTS.find((spot) => Math.abs(spot.x - Number(x)) < 0.005 && Math.abs(spot.y - Number(y)) < 0.005)?.id ?? "custom"
    : "default";

  const activeSize = MESSAGE_SIZES.some((item) => item.id === size) ? size : "s";
  const activeFont = MESSAGE_FONTS.some((item) => item.id === font) ? font : "poster";
  const activeStyle = (MESSAGE_STYLES as readonly string[]).includes(style ?? "")
    ? style
    : isSport
      ? "caps"
      : "italic";
  const scriptFont = activeFont === "elegant" || activeFont === "brush";

  // Load the faces so each option shows its own lettering.
  useEffect(() => {
    MESSAGE_FONTS.forEach((item) => {
      if (item.family) void ensureFont(item.family).catch(() => undefined);
    });
  }, []);

  return (
    <div className="message-look">
      <p className="message-look__title">{t("style.msg.title")}</p>
      <div className="message-look__row">
        <span className="message-look__label">{t("style.msg.position")}</span>
        <p className="message-look__drag-hint">
          <LuMove aria-hidden="true" />
          {t("style.msg.dragHint")}
        </p>
        <div className="message-look__fonts" role="radiogroup" aria-label={t("style.msg.position")}>
          <button
            type="button"
            role="radio"
            aria-checked={activeSpot === "default"}
            className={`message-look__font${activeSpot === "default" ? " is-active" : ""}`}
            onClick={() => placeAt(null, null)}
          >
            {t("style.msg.pos.default")}
          </button>
          {MESSAGE_SPOTS.map((spot) => (
            <button
              key={spot.id}
              type="button"
              role="radio"
              aria-checked={activeSpot === spot.id}
              className={`message-look__font${activeSpot === spot.id ? " is-active" : ""}`}
              onClick={() => placeAt(spot.x, spot.y)}
            >
              {t(`style.msg.pos.${spot.id}` as TranslationKey)}
            </button>
          ))}
          {activeSpot === "custom" ? (
            <span className="message-look__font is-active" aria-current="true">
              {t("style.msg.pos.custom")}
            </span>
          ) : null}
        </div>
      </div>

      <div className="message-look__row">
        <span className="message-look__label">
          {t("style.msg.size")} ·{" "}
          <span className="message-look__current">{t(`style.msg.size.${activeSize}` as TranslationKey)}</span>
        </span>
        <div className="message-look__seg" role="radiogroup" aria-label={t("style.msg.size")}>
          {MESSAGE_SIZES.map((item) => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={activeSize === item.id}
              className={`message-look__opt${activeSize === item.id ? " is-active" : ""}`}
              aria-label={t(`style.msg.size.${item.id}` as TranslationKey)}
              title={t(`style.msg.size.${item.id}` as TranslationKey)}
              onClick={() => set("messageSize", item.id)}
            >
              <span
                className="message-look__size-glyph"
                style={{ fontSize: `${0.7 + MESSAGE_SIZES.indexOf(item) * 0.2}rem` }}
                aria-hidden="true"
              >
                Aa
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="message-look__row">
        <FontDropdown
          label={t("style.msg.font")}
          value={activeFont}
          onChange={(value) => set("messageFont", value)}
          options={MESSAGE_FONTS.map((item) => ({
            value: item.id,
            label: NAMED_MESSAGE_FONTS.has(item.id)
              ? t(`style.msg.font.${item.id}` as TranslationKey)
              : (item.family ?? item.id),
            family: item.family,
            boost: item.boost > 1 ? item.boost : undefined,
          }))}
        />
      </div>

      <div className="message-look__row">
        <span className="message-look__label">{t("style.msg.style")}</span>
        <div className="message-look__fonts" role="radiogroup" aria-label={t("style.msg.style")}>
          {MESSAGE_STYLES.map((item) => (
            <button
              key={item}
              type="button"
              role="radio"
              aria-checked={activeStyle === item}
              className={`message-look__font message-look__opt--${item}${activeStyle === item ? " is-active" : ""}`}
              onClick={() => set("messageStyle", item)}
            >
              {t(`style.msg.style.${item}` as TranslationKey)}
            </button>
          ))}
        </div>
        {scriptFont ? <p className="message-look__note">{t("style.msg.scriptNote")}</p> : null}
      </div>
    </div>
  );
}
