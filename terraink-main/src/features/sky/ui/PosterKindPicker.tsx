import { LuMap, LuRoute, LuSparkles, LuUpload } from "react-icons/lu";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { useSkyPoster } from "@/features/sky/application/useSkyPoster";
import { useLanguage } from "@/shared/i18n/LanguageContext";
import { openSettingsTab } from "@/shared/ui/settingsTabs";

/** "City map", "Night sky" or "Sport route" switch at the top of the place step. */
export default function PosterKindPicker() {
  const { t } = useLanguage();
  const { state } = usePosterContext();
  const { kind, setKind } = useSkyPoster();
  const route = state.routes.find((entry) => entry.visible);

  const options = [
    { id: "map", Icon: LuMap, label: t("sky.kind.map") },
    { id: "sky", Icon: LuSparkles, label: t("sky.kind.sky") },
    { id: "sport", Icon: LuRoute, label: t("sky.kind.sport") },
  ] as const;

  return (
    <>
      <div className="poster-kind poster-kind--three" role="radiogroup" aria-label={t("sky.kind")}>
        {options.map(({ id, Icon, label }) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={kind === id}
            className={`poster-kind__opt${kind === id ? " is-active" : ""}`}
            onClick={() => setKind(id)}
          >
            <Icon aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {kind === "sport" ? (
        <div className="sport-import">
          <p className="sport-import__title">{route ? t("sport.import.done") : t("sport.import.title")}</p>
          <p className="sport-import__text">{route ? route.label : t("sport.import.text")}</p>
          <button type="button" className="sport-import__cta" onClick={() => openSettingsTab({ tab: "routes" })}>
            <LuUpload aria-hidden="true" />
            {t("sport.import.cta")}
          </button>
        </div>
      ) : null}
    </>
  );
}
