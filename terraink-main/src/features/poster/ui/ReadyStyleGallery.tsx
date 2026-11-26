import { useId } from "react";
import { usePosterStyles, type PosterStyleId } from "@/features/poster/application/usePosterStyles";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { useLanguage, type TranslationKey } from "@/shared/i18n/LanguageContext";
import PhotoCard from "./PhotoCard";
import TwinCityCard from "./TwinCityCard";
import VennCard from "./VennCard";

const STYLES: { id: PosterStyleId; label: TranslationKey }[] = [
  { id: "classic", label: "style.preset.classic" },
  { id: "heart", label: "style.preset.heart" },
  { id: "photo", label: "style.shape.photo" },
  { id: "twin", label: "style.shape.twin" },
  { id: "venn", label: "style.shape.venn" },
];

/**
 * Theme step, first thing on a map poster: the ready-made styles as small
 * pictures, one tap each. The chosen style's own settings (photo, second
 * city, names and date) open right under it.
 */
export default function ReadyStyleGallery() {
  const { t } = useLanguage();
  const { state } = usePosterContext();
  const { apply } = usePosterStyles();
  const uid = useId();
  const { form } = state;

  const active: PosterStyleId | null =
    form.posterLayout === "duo"
      ? "photo"
      : form.posterLayout === "twin"
        ? "twin"
        : form.posterLayout === "venn"
          ? "venn"
          : form.posterStyle === "heart" && form.mapShape === "heart"
            ? "heart"
            : (form.posterLayout || "classic") === "classic" && (form.mapShape || "none") === "none"
              ? "classic"
              : null;

  return (
    <section className="ready-styles" aria-labelledby={`${uid}-title`}>
      <h3 id={`${uid}-title`} className="style-presets__title">
        {t("style.preset.title")}
      </h3>
      <p className="style-presets__hint">{t("style.preset.hint")}</p>
      <div className="ready-styles__row" role="radiogroup" aria-labelledby={`${uid}-title`}>
        {STYLES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active === id}
            className={`ready-styles__opt${active === id ? " is-active" : ""}`}
            onClick={() => apply(id)}
          >
            <span className="ready-styles__thumb">
              <img src={`/assets/styles/${id}.webp`} alt="" loading="lazy" decoding="async" />
            </span>
            <span className="ready-styles__name">{t(label)}</span>
          </button>
        ))}
      </div>
      {active === "photo" ? <PhotoCard /> : null}
      {active === "twin" ? <TwinCityCard /> : null}
      {active === "venn" ? <VennCard /> : null}
    </section>
  );
}
