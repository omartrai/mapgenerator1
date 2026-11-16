import { LuMap, LuSparkles } from "react-icons/lu";
import { useSkyPoster } from "@/features/sky/application/useSkyPoster";
import { useLanguage } from "@/shared/i18n/LanguageContext";

/**
 * Poster type tiles (city map, night sky) at the top of the place step.
 * Sport posters start from the Routes tab or the home page link instead;
 * they count as a city map here.
 */
export default function PosterKindPicker() {
  const { t } = useLanguage();
  const { kind, setKind } = useSkyPoster();
  const current = kind === "sky" ? "sky" : "map";

  const options = [
    { id: "map", Icon: LuMap, label: t("kind.short.map") },
    { id: "sky", Icon: LuSparkles, label: t("kind.short.sky") },
  ] as const;

  return (
    <div className="kind-tiles kind-tiles--two" role="radiogroup" aria-label={t("sky.kind")}>
      {options.map(({ id, Icon, label }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={current === id}
          className={`kind-tile${current === id ? " is-active" : ""}`}
          onClick={() => setKind(id)}
        >
          <Icon aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
