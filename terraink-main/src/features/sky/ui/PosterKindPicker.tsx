import { LuMap, LuMountainSnow, LuSparkles } from "react-icons/lu";
import { FaPersonRunning } from "react-icons/fa6";
import { useSkyPoster, type PosterKind } from "@/features/sky/application/useSkyPoster";
import { useLanguage } from "@/shared/i18n/LanguageContext";

/**
 * Poster type tiles at the top of the place step. On desktop, sport and
 * trail live in the side rail instead, so the panel passes only map and sky.
 */
export default function PosterKindPicker({ only }: { only?: PosterKind[] }) {
  const { t } = useLanguage();
  const { kind, setKind } = useSkyPoster();

  const all: { id: PosterKind; Icon: React.ComponentType; label: string }[] = [
    { id: "map", Icon: LuMap, label: t("kind.short.map") },
    { id: "sky", Icon: LuSparkles, label: t("kind.short.sky") },
    { id: "sport", Icon: FaPersonRunning, label: t("kind.short.sport") },
    { id: "trail", Icon: LuMountainSnow, label: t("kind.short.trail") },
  ];
  const options = all.filter((option) => !only || only.includes(option.id));

  return (
    <div className={`kind-tiles ${options.length === 4 ? "kind-tiles--four" : "kind-tiles--two"}`} role="radiogroup" aria-label={t("sky.kind")}>
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
