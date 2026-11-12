import { LuMap, LuSparkles } from "react-icons/lu";
import { useSkyPoster } from "@/features/sky/application/useSkyPoster";
import { useLanguage } from "@/shared/i18n/LanguageContext";

/** "City map" or "Night sky" switch at the top of the place step. */
export default function PosterKindPicker() {
  const { t } = useLanguage();
  const { isSky, setKind } = useSkyPoster();

  return (
    <div className="poster-kind" role="radiogroup" aria-label={t("sky.kind")}>
      <button
        type="button"
        role="radio"
        aria-checked={!isSky}
        className={`poster-kind__opt${!isSky ? " is-active" : ""}`}
        onClick={() => setKind("map")}
      >
        <LuMap aria-hidden="true" />
        {t("sky.kind.map")}
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={isSky}
        className={`poster-kind__opt${isSky ? " is-active" : ""}`}
        onClick={() => setKind("sky")}
      >
        <LuSparkles aria-hidden="true" />
        {t("sky.kind.sky")}
      </button>
    </div>
  );
}
