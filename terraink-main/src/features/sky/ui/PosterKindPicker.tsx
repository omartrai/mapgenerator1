import { LuMap, LuMountainSnow, LuSparkles } from "react-icons/lu";
import { FaPersonRunning } from "react-icons/fa6";
import { useSkyPoster, type PosterKind } from "@/features/sky/application/useSkyPoster";
import { useLanguage } from "@/shared/i18n/LanguageContext";

/** Poster type tiles (city map, night sky, sport, trail) at the top of the place step. */
export default function PosterKindPicker() {
  const { t } = useLanguage();
  const { kind, setKind } = useSkyPoster();

  const options: { id: PosterKind; Icon: React.ComponentType; label: string }[] = [
    { id: "map", Icon: LuMap, label: t("kind.short.map") },
    { id: "sky", Icon: LuSparkles, label: t("kind.short.sky") },
    { id: "sport", Icon: FaPersonRunning, label: t("kind.short.sport") },
    { id: "trail", Icon: LuMountainSnow, label: t("kind.short.trail") },
  ];

  return (
    <div className="kind-tiles kind-tiles--four" role="radiogroup" aria-label={t("sky.kind")}>
      {options.map(({ id, Icon, label }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={kind === id}
          className={`kind-tile${kind === id ? " is-active" : ""}`}
          onClick={() => setKind(id)}
        >
          <Icon aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
