import { LuCircle, LuHeart, LuSquare, LuStar } from "react-icons/lu";
import { SKY_SHAPES, toSkyShape } from "@/features/sky/domain/chart";
import { useSkyPoster } from "@/features/sky/application/useSkyPoster";
import { useLanguage, type TranslationKey } from "@/shared/i18n/LanguageContext";

const ICONS = { circle: LuCircle, heart: LuHeart, star: LuStar, square: LuSquare } as const;

/** Outline of the star chart on a night-sky poster (shown in the Theme tab). */
export default function SkyShapePicker() {
  const { t } = useLanguage();
  const { isSky, form, set } = useSkyPoster();
  if (!isSky) return null;
  const active = toSkyShape(form.skyShape);

  return (
    <div className="sky-shapes">
      <p className="sky-shapes__title">{t("sky.shape")}</p>
      <div className="sky-shapes__grid" role="radiogroup" aria-label={t("sky.shape")}>
        {SKY_SHAPES.map((shape) => {
          const Icon = ICONS[shape];
          return (
            <button
              key={shape}
              type="button"
              role="radio"
              aria-checked={active === shape}
              className={`sky-shapes__opt${active === shape ? " is-active" : ""}`}
              onClick={() => set("skyShape", shape)}
            >
              <Icon aria-hidden="true" />
              <span>{t(`sky.shape.${shape}` as TranslationKey)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
