import { LuFileUp, LuMap, LuPencil, LuRoute, LuScan, LuSparkles } from "react-icons/lu";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { useActivityPoster } from "@/features/routes/application/useActivityPoster";
import { formatDuration } from "@/features/routes/domain/activity";
import { useSkyPoster } from "@/features/sky/application/useSkyPoster";
import { useLanguage } from "@/shared/i18n/LanguageContext";
import { openSettingsTab } from "@/shared/ui/settingsTabs";

/** Poster type tiles (city map, night sky, sport) at the top of the place step. */
export default function PosterKindPicker() {
  const { t, language } = useLanguage();
  const { state } = usePosterContext();
  const { kind, setKind } = useSkyPoster();
  const { makeSportPoster } = useActivityPoster();
  const route = state.routes.find((entry) => entry.visible);

  const options = [
    { id: "map", Icon: LuMap, label: t("kind.short.map") },
    { id: "sky", Icon: LuSparkles, label: t("kind.short.sky") },
    { id: "sport", Icon: LuRoute, label: t("kind.short.sport") },
  ] as const;

  const km = route?.stats ? route.stats.distanceM / 1000 : 0;
  const distance = km
    ? `${km.toLocaleString(language === "en" ? "en-GB" : "fr-FR", { maximumFractionDigits: km >= 100 ? 0 : 1 })} km`
    : "";
  const duration = route?.stats?.durationS ? formatDuration(Math.round(route.stats.durationS)) : "";
  const meta = [distance, duration].filter(Boolean).join(" · ");

  return (
    <>
      <div className="kind-tiles" role="radiogroup" aria-label={t("sky.kind")}>
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

      {kind === "sport" ? (
        route ? (
          <div className="sport-route">
            <div className="sport-route__head">
              <span className="sport-route__icon" aria-hidden="true">
                <LuRoute />
              </span>
              <span className="sport-route__text">
                <strong>{route.label}</strong>
                {meta ? <span>{meta}</span> : null}
              </span>
            </div>
            <p className="sport-route__hint">{t("sport.route.hint")}</p>
            <div className="sport-route__actions">
              <button type="button" onClick={() => openSettingsTab({ tab: "style", focus: ".sport-fields" })}>
                <LuPencil aria-hidden="true" />
                {t("sport.route.edit")}
              </button>
              <button type="button" onClick={() => makeSportPoster(route)}>
                <LuScan aria-hidden="true" />
                {t("activity.reapply")}
              </button>
              <button type="button" onClick={() => openSettingsTab({ tab: "routes" })}>
                <LuFileUp aria-hidden="true" />
                {t("sport.route.change")}
              </button>
            </div>
          </div>
        ) : (
          <div className="sport-import">
            <p className="sport-import__title">{t("sport.import.title")}</p>
            <p className="sport-import__text">{t("sport.import.text")}</p>
            <button type="button" className="sport-import__cta" onClick={() => openSettingsTab({ tab: "routes" })}>
              <LuFileUp aria-hidden="true" />
              {t("sport.import.cta")}
            </button>
          </div>
        )
      ) : null}
    </>
  );
}
