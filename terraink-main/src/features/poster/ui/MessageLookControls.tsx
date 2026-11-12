import { useEffect } from "react";
import { ensureFont } from "@/core/services";
import {
  MESSAGE_FONTS,
  MESSAGE_SIZES,
  MESSAGE_STYLES,
} from "@/features/poster/domain/messageStyle";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { useLanguage, type TranslationKey } from "@/shared/i18n/LanguageContext";

interface MessageLookControlsProps {
  size?: string;
  font?: string;
  style?: string;
  isSport: boolean;
}

/** Size, typeface and style pickers for the personal message. */
export default function MessageLookControls({ size, font, style, isSport }: MessageLookControlsProps) {
  const { t } = useLanguage();
  const { dispatch } = usePosterContext();
  const set = (name: "messageSize" | "messageFont" | "messageStyle", value: string) =>
    dispatch({ type: "SET_FIELD", name, value });

  const activeSize = MESSAGE_SIZES.some((item) => item.id === size) ? size : "s";
  const activeFont = MESSAGE_FONTS.some((item) => item.id === font) ? font : "poster";
  const activeStyle = (MESSAGE_STYLES as readonly string[]).includes(style ?? "")
    ? style
    : isSport
      ? "caps"
      : "italic";
  const scriptFont = activeFont === "elegant" || activeFont === "brush";

  // Load the faces so each chip shows its own lettering.
  useEffect(() => {
    MESSAGE_FONTS.forEach((item) => {
      if (item.family) void ensureFont(item.family).catch(() => undefined);
    });
  }, []);

  return (
    <div className="message-look">
      <p className="message-look__title">{t("style.msg.title")}</p>
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
        <span className="message-look__label">{t("style.msg.font")}</span>
        <div className="message-look__fonts" role="radiogroup" aria-label={t("style.msg.font")}>
          {MESSAGE_FONTS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={activeFont === item.id}
              className={`message-look__font${activeFont === item.id ? " is-active" : ""}`}
              style={item.family ? { fontFamily: `"${item.family}", serif` } : undefined}
              onClick={() => set("messageFont", item.id)}
            >
              <span
                className="message-look__font-sample"
                style={item.boost > 1 ? { fontSize: `${item.boost}em` } : undefined}
              >
                {t(`style.msg.font.${item.id}` as TranslationKey)}
              </span>
            </button>
          ))}
        </div>
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
