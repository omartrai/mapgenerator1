import { LuMap, LuMountainSnow, LuSparkles } from "react-icons/lu";
import { FaPersonRunning } from "react-icons/fa6";
import { useSkyPoster, type PosterKind } from "@/features/sky/application/useSkyPoster";
import { useLanguage } from "@/shared/i18n/LanguageContext";

const KINDS: { id: PosterKind; label: "kind.short.map" | "kind.mini.sky" | "kind.short.sport" | "kind.short.trail"; Icon: React.ComponentType }[] = [
  { id: "map", label: "kind.short.map", Icon: LuMap },
  { id: "sky", label: "kind.mini.sky", Icon: LuSparkles },
  { id: "sport", label: "kind.short.sport", Icon: FaPersonRunning },
  { id: "trail", label: "kind.short.trail", Icon: LuMountainSnow },
];

/** Desktop studio: poster type as one horizontal bar above the step. */
export default function PosterTypeBar({ onPick }: { onPick?: (kind: PosterKind) => void }) {
  const { t } = useLanguage();
  const { kind, setKind } = useSkyPoster();
  return (
    <div className="poster-type-bar" role="radiogroup" aria-label={t("sky.kind")}>
      {KINDS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={kind === id}
          className={`poster-type-bar__opt${kind === id ? " is-active" : ""}`}
          onClick={() => {
            setKind(id);
            onPick?.(id);
          }}
        >
          <Icon aria-hidden="true" />
          <span>{t(label)}</span>
        </button>
      ))}
    </div>
  );
}
