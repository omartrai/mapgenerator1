import { LuMap, LuSparkles } from "react-icons/lu";
import { useSkyPoster } from "@/features/sky/application/useSkyPoster";
import { useLanguage } from "@/shared/i18n/LanguageContext";

/** "Map" or "Night sky" switch, plus the moment and chart options for a sky. */
export default function PosterKindPicker() {
  const { t } = useLanguage();
  const { isSky, form, setKind, setTime, set } = useSkyPoster();
  const time = form.skyTime ?? "";
  const [date, clock] = time.includes("T") ? time.split("T") : ["", "22:00"];

  return (
    <div className={`poster-kind${isSky ? " is-sky" : ""}`}>
      <div className="poster-kind__switch" role="radiogroup" aria-label={t("sky.kind")}>
        <button
          type="button"
          role="radio"
          aria-checked={!isSky}
          className={`poster-kind__opt${!isSky ? " is-active" : ""}`}
          onClick={() => setKind("map")}
        >
          <LuMap aria-hidden="true" />
          <span>
            <strong>{t("sky.kind.map")}</strong>
            <small>{t("sky.kind.mapHint")}</small>
          </span>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={isSky}
          className={`poster-kind__opt${isSky ? " is-active" : ""}`}
          onClick={() => setKind("sky")}
        >
          <LuSparkles aria-hidden="true" />
          <span>
            <strong>{t("sky.kind.sky")}</strong>
            <small>{t("sky.kind.skyHint")}</small>
          </span>
        </button>
      </div>

      {isSky ? (
        <div className="sky-moment">
          <p className="sky-moment__title">{t("sky.moment")}</p>
          <div className="sky-moment__row">
            <label>
              <span>{t("sky.date")}</span>
              <input
                type="date"
                className="form-control-tall"
                value={date}
                max="2100-12-31"
                min="1900-01-01"
                onChange={(event) => event.target.value && setTime(`${event.target.value}T${clock || "22:00"}`)}
              />
            </label>
            <label>
              <span>{t("sky.time")}</span>
              <input
                type="time"
                className="form-control-tall"
                value={clock}
                onChange={(event) => event.target.value && date && setTime(`${date}T${event.target.value}`)}
              />
            </label>
          </div>
          <p className="sky-moment__hint">{t("sky.momentHint")}</p>
          <div className="sky-options">
            {(
              [
                ["skyLines", "sky.lines", form.skyLines !== false],
                ["skyMilkyWay", "sky.milkyWay", form.skyMilkyWay !== false],
                ["skyGrid", "sky.grid", form.skyGrid === true],
              ] as const
            ).map(([name, label, checked]) => (
              <label key={name} className="sky-option">
                <input type="checkbox" checked={checked} onChange={(event) => set(name, event.target.checked)} />
                <span>{t(label)}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
