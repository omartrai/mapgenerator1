import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { LuChevronDown, LuFlag, LuUpload } from "react-icons/lu";
import { loadRaceCatalog, type RaceEntry } from "@/core/services";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { useSportRouteInput } from "@/features/routes/application/useSportRouteInput";
import { isTrailLayout } from "@/features/poster/domain/posterLayout";
import { routeLengthMeters } from "@/features/routes/infrastructure/helpers";
import RouteStyleSection from "./RouteStyleSection";
import { useLanguage, type TranslationKey } from "@/shared/i18n/LanguageContext";

type Source = "gpx" | "race";

function formatKm(meters: number, comma: boolean): string {
  if (!Number.isFinite(meters) || meters <= 0) return "";
  const text = (meters / 1000).toFixed(meters < 10_000 ? 2 : 1);
  return `${comma ? text.replace(".", ",") : text} km`;
}

/**
 * Place step of a sport or trail poster: where the route comes from.
 * `compact` is the phone version, under the floating search bar.
 */
export default function SportRouteCard({ compact = false }: { compact?: boolean }) {
  const { t, language } = useLanguage();
  const { state } = usePosterContext();
  const { uploadFile, pickRace } = useSportRouteInput();
  const uid = useId();
  const [source, setSource] = useState<Source>("gpx");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [races, setRaces] = useState<RaceEntry[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const trail = isTrailLayout(state.form.posterLayout);
  const route = state.routes.find((entry) => entry.visible) ?? null;

  useEffect(() => {
    if (source !== "race" || races) return;
    let live = true;
    loadRaceCatalog()
      .then((list) => live && setRaces(list))
      .catch(() => live && setRaces([]));
    return () => {
      live = false;
    };
  }, [races, source]);

  const run = async (task: () => Promise<void>) => {
    setError("");
    setBusy(true);
    try {
      await task();
    } catch (err) {
      const key = err instanceof Error && err.message.startsWith("routes.") ? err.message : "routes.errorUpload";
      setError(t(key as TranslationKey));
    } finally {
      setBusy(false);
    }
  };

  const onFile = (file: File | undefined) => {
    if (file) void run(() => uploadFile(file));
  };

  const shownRaces = (races ?? []).filter((race) => (race.kind ?? "sport") === (trail ? "trail" : "sport"));
  const tabs: { id: Source; label: string }[] = [
    { id: "gpx", label: t("sport.route.gpx") },
    { id: "race", label: t("sport.route.race") },
  ];

  return (
    <section className={`sport-source${compact ? " is-compact" : ""}`} aria-labelledby={`${uid}-title`}>
      <h3 id={`${uid}-title`} className={compact ? "visually-hidden" : "sport-source__title"}>
        {t("sport.route.title")}
      </h3>

      <div className="sport-source__tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={source === tab.id}
            className={`sport-source__tab${source === tab.id ? " is-active" : ""}`}
            onClick={() => {
              setSource(tab.id);
              setError("");
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {source === "gpx" ? (
        <>
          <button
            type="button"
            className={`gpx-drop${dragging ? " is-dragging" : ""}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(event: DragEvent) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event: DragEvent) => {
              event.preventDefault();
              setDragging(false);
              onFile(event.dataTransfer.files?.[0]);
            }}
            disabled={busy}
          >
            <span className="gpx-drop__icon" aria-hidden="true">
              <LuUpload />
            </span>
            <span className="gpx-drop__text">
              <strong>{busy ? t("routes.uploading") : t("routes.dropTitle")}</strong>
              {compact ? null : <small>{t("sport.route.gpxHint")}</small>}
            </span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".gpx,application/gpx+xml,application/xml,text/xml"
            hidden
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              onFile(file);
            }}
          />
        </>
      ) : null}

      {source === "race" ? (
        races === null ? (
          <p className="sport-source__hint">{t("sport.route.loading")}</p>
        ) : shownRaces.length === 0 ? (
          <p className="sport-source__hint">{t("sport.route.racesEmpty")}</p>
        ) : (
          <>
            <p className="sport-source__hint">{t("sport.route.racesHint")}</p>
            <label className="race-select">
              <LuFlag aria-hidden="true" />
              <select
                value={shownRaces.find((race) => race.name === route?.label)?.id ?? ""}
                disabled={busy}
                aria-label={t("sport.route.race")}
                onChange={(event) => {
                  const race = shownRaces.find((entry) => entry.id === event.target.value);
                  if (race) void run(() => pickRace(race));
                }}
              >
                <option value="" disabled>
                  {t("sport.route.racePick")}
                </option>
                {shownRaces.map((race) => (
                  <option key={race.id} value={race.id}>
                    {[race.name, race.distanceKm ? formatKm(race.distanceKm * 1000, language !== "en") : ""]
                      .filter(Boolean)
                      .join(" — ")}
                  </option>
                ))}
              </select>
              <LuChevronDown className="race-select__chevron" aria-hidden="true" />
            </label>
          </>
        )
      ) : null}

      {error ? (
        <p className="routes-section__error" role="alert">
          {error}
        </p>
      ) : null}

      <div className={`sport-source__current${route ? "" : " is-empty"}`}>
        <span className="sport-source__swatch" style={route ? { background: route.color } : undefined} aria-hidden="true" />
        <span className="sport-source__current-text">
          <small>{t("sport.route.current")}</small>
          <strong>{route ? route.label : t("sport.route.none")}</strong>
        </span>
        {route ? <span className="sport-source__km">{formatKm(route.stats?.distanceM || routeLengthMeters(route), language !== "en")}</span> : null}
      </div>
      {route && !compact ? <RouteStyleSection route={route} /> : null}
    </section>
  );
}
