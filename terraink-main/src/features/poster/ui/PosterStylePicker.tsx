import { POSTER_STYLES, usePosterStyles } from "@/features/poster/application/usePosterStyles";
import { useLanguage, type TranslationKey } from "@/shared/i18n/LanguageContext";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import PhotoCard from "./PhotoCard";

/** Ready-made styles at the top of the Theme step, each with a small sketch. */
export default function PosterStylePicker() {
  const { t } = useLanguage();
  const { apply, active } = usePosterStyles();
  const { state } = usePosterContext();

  return (
    <section className="style-presets" aria-labelledby="style-presets-title">
      <h3 id="style-presets-title" className="style-presets__title">
        {t("style.preset.title")}
      </h3>
      <p className="style-presets__hint">{t("style.preset.hint")}</p>
      <div className="style-presets__grid">
        {POSTER_STYLES.map((id) => (
          <button
            key={id}
            type="button"
            className={`style-preset${active === id ? " is-active" : ""}`}
            aria-pressed={active === id}
            onClick={() => apply(id)}
          >
            <span className={`style-preset__sketch style-preset__sketch--${id}`} aria-hidden="true">
              <i className="style-preset__photo" />
              <i className="style-preset__map" />
              <i className="style-preset__pin" />
              <i className="style-preset__text" />
            </span>
            <span className="style-preset__name">{t(`style.preset.${id}` as TranslationKey)}</span>
            <span className="style-preset__note">{t(`style.preset.${id}.note` as TranslationKey)}</span>
          </button>
        ))}
      </div>
      {state.form.posterLayout === "duo" ? <PhotoCard /> : null}
    </section>
  );
}
