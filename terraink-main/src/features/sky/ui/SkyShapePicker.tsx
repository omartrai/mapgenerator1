import { LuBaby, LuCircle, LuHeart, LuSquare, LuStar } from "react-icons/lu";
import { SKY_SHAPES, toSkyShape, type SkyShape } from "@/features/sky/domain/chart";
import { useSkyPoster } from "@/features/sky/application/useSkyPoster";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { useLanguage, type TranslationKey } from "@/shared/i18n/LanguageContext";

const ICONS = { circle: LuCircle, heart: LuHeart, star: LuStar, square: LuSquare, baby: LuBaby } as const;

/** Outline of the star chart on a night-sky poster (shown in the Theme tab). */
export default function SkyShapePicker() {
  const { t } = useLanguage();
  const { dispatch } = usePosterContext();
  const { isSky, form, set } = useSkyPoster();
  if (!isSky) return null;
  const active = toSkyShape(form.skyShape);

  const choose = (shape: SkyShape) => {
    set("skyShape", shape);
    if (shape === "baby" && active !== "baby") {
      // Baby sky: name in script, birth details, navy and gold on white.
      set("posterLayout", "nursery");
      set("showCountry", false);
      dispatch({ type: "SET_THEME", themeId: "starry_navy" });
    } else if (shape !== "baby" && active === "baby") {
      set("posterLayout", "classic");
      set("showCountry", true);
    }
  };

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
              onClick={() => choose(shape)}
            >
              <Icon aria-hidden="true" />
              <span>{t(`sky.shape.${shape}` as TranslationKey)}</span>
            </button>
          );
        })}
      </div>

      {active === "baby" ? (
        <fieldset className="baby-fields">
          <legend>{t("sky.baby.title")}</legend>
          <label>
            {t("sky.baby.name")}
            <input
              className="form-control-tall"
              value={form.displayCity ?? ""}
              onChange={(event) => dispatch({ type: "SET_FIELD", name: "displayCity", value: event.target.value })}
            />
          </label>
          <div className="baby-fields__row">
            <label>
              {t("sky.baby.length")}
              <input
                className="form-control-tall"
                inputMode="decimal"
                value={form.babyLength ?? ""}
                onChange={(event) => set("babyLength", event.target.value)}
                placeholder="51"
              />
            </label>
            <label>
              {t("sky.baby.weight")}
              <input
                className="form-control-tall"
                inputMode="numeric"
                value={form.babyWeight ?? ""}
                onChange={(event) => set("babyWeight", event.target.value)}
                placeholder="3400"
              />
            </label>
          </div>
          <p className="baby-fields__hint">{t("sky.baby.hint")}</p>
        </fieldset>
      ) : null}
    </div>
  );
}
