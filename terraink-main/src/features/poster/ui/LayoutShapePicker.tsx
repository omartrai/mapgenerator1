import { useId } from "react";
import { LuBan, LuCircle, LuHeart, LuImage, LuStar } from "react-icons/lu";
import { usePosterStyles } from "@/features/poster/application/usePosterStyles";
import PhotoCard from "./PhotoCard";
import {
  DEFAULT_POSTER_LAYOUT,
  MAP_SHAPES,
  POSTER_LAYOUTS,
  STYLE_ONLY_LAYOUTS,
} from "@/features/poster/domain/posterLayout";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { useLanguage, type TranslationKey } from "@/shared/i18n/LanguageContext";

const SHAPE_ICONS = { none: LuBan, circle: LuCircle, heart: LuHeart, star: LuStar, photo: LuImage } as const;

/** Poster layout and map shape (shown in the Theme step). */
export default function LayoutShapePicker() {
  const { t } = useLanguage();
  const { state, dispatch } = usePosterContext();
  const { form } = state;
  const set = (name: "posterLayout" | "mapShape", value: string) => dispatch({ type: "SET_FIELD", name, value });
  const { apply } = usePosterStyles();
  // The studio renders a desktop and a phone copy of this panel: each needs its own radio groups.
  const uid = useId();
  const isPhoto = form.posterLayout === "duo";
  const layoutId = form.posterLayout || DEFAULT_POSTER_LAYOUT;
  const shapeId = isPhoto ? "photo" : form.mapShape || "none";

  const pickShape = (id: string) => {
    if (id === "photo") return apply("photo");
    // Leaving the photo layout: back to the classic one.
    if (isPhoto) set("posterLayout", DEFAULT_POSTER_LAYOUT);
    set("mapShape", id);
  };

  return (
    <section className="layout-shape" aria-labelledby="layout-shape-title">
      <h3 id="layout-shape-title" className="style-presets__title">
        {t("style.group.layout")}
      </h3>
      <fieldset className="layout-picker">
        <legend>{t("style.layout")}</legend>
        <div className="layout-picker__grid">
          {POSTER_LAYOUTS.filter((id) => !STYLE_ONLY_LAYOUTS.has(id)).map((id) => (
            <label key={id} className="layout-picker__option">
              <input
                type="radio"
                name={`${uid}-layout`}
                value={id}
                checked={layoutId === id}
                onChange={() => set("posterLayout", id)}
              />
              <span className={`layout-thumb layout-thumb--${id}`} aria-hidden="true">
                <i className="layout-thumb__map" />
                <i className="layout-thumb__deco" />
                <i className="layout-thumb__title" />
                <i className="layout-thumb__sub" />
              </span>
              <span className="layout-picker__name">{t(`style.layout.${id}` as TranslationKey)}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="layout-picker shape-picker">
        <legend>{t("style.shape")}</legend>
        <div className="shape-picker__grid">
          {[...MAP_SHAPES, "photo" as const].map((id) => {
            const Icon = SHAPE_ICONS[id];
            return (
              <label key={id} className="shape-picker__option">
                <input
                  type="radio"
                  name={`${uid}-shape`}
                  value={id}
                  checked={shapeId === id}
                  onChange={() => pickShape(id)}
                />
                <span className={`shape-picker__tile shape-picker__tile--${id}`} aria-hidden="true">
                  <Icon />
                </span>
                <span className="layout-picker__name">{t(`style.shape.${id}` as TranslationKey)}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      {isPhoto ? <PhotoCard /> : null}
    </section>
  );
}
