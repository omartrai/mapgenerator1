import { LuCheck, LuMoonStar } from "react-icons/lu";
import { useSkyPoster } from "@/features/sky/application/useSkyPoster";
import { useLanguage } from "@/shared/i18n/LanguageContext";

const QUICK_TIMES = ["21:00", "22:00", "23:00", "00:00"];

/** Date, time and chart options of a night-sky poster (place step). */
export default function SkyMomentCard() {
  const { t } = useLanguage();
  const { isSky, form, setTime, set } = useSkyPoster();
  if (!isSky) return null;

  const value = form.skyTime ?? "";
  const [date, clock] = value.includes("T") ? value.split("T") : ["", "22:00"];
  const options = [
    ["skyLines", "sky.lines", form.skyLines !== false],
    ["skyMilkyWay", "sky.milkyWay", form.skyMilkyWay !== false],
    ["skyGrid", "sky.grid", form.skyGrid === true],
  ] as const;

  return (
    <section className="sky-moment" aria-labelledby="sky-moment-title">
      <div className="sky-moment__head">
        <span className="sky-moment__icon" aria-hidden="true"><LuMoonStar /></span>
        <div>
          <h3 id="sky-moment-title">{t("sky.moment")}</h3>
          <p>{t("sky.momentHint")}</p>
        </div>
      </div>

      <label className="sky-moment__field">
        <span>{t("sky.date")}</span>
        <input
          type="date"
          className="form-control-tall"
          value={date}
          min="1900-01-01"
          max="2100-12-31"
          onChange={(event) => event.target.value && setTime(`${event.target.value}T${clock || "22:00"}`)}
        />
      </label>

      <div className="sky-moment__field">
        <label htmlFor="sky-time">{t("sky.time")}</label>
        <div className="sky-moment__time">
          <input
            id="sky-time"
            type="time"
            className="form-control-tall"
            value={clock}
            onChange={(event) => event.target.value && date && setTime(`${date}T${event.target.value}`)}
          />
          <div className="sky-moment__quick" role="group" aria-label={t("sky.time")}>
            {QUICK_TIMES.map((quick) => (
              <button
                key={quick}
                type="button"
                className={`sky-chip${clock === quick ? " is-active" : ""}`}
                onClick={() => date && setTime(`${date}T${quick}`)}
              >
                {quick}
              </button>
            ))}
          </div>
        </div>
        <small className="sky-moment__note">{t("sky.timeUnknown")}</small>
      </div>

      <div className="sky-moment__field">
        <span className="sky-moment__label">{t("sky.show")}</span>
        <div className="sky-moment__toggles">
          {options.map(([name, label, checked]) => (
            <button
              key={name}
              type="button"
              aria-pressed={checked}
              className={`sky-chip sky-chip--toggle${checked ? " is-active" : ""}`}
              onClick={() => set(name, !checked)}
            >
              {checked ? <LuCheck aria-hidden="true" /> : null}
              {t(label)}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
