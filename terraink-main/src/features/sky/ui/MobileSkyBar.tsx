import { LuCheck } from "react-icons/lu";
import PosterKindPicker from "@/features/sky/ui/PosterKindPicker";
import { useSkyPoster } from "@/features/sky/application/useSkyPoster";
import { useLanguage } from "@/shared/i18n/LanguageContext";

/**
 * Phones: the place step is a floating search bar, so the poster type and
 * the night-sky moment sit right under it in a compact form.
 */
export default function MobileSkyBar() {
  const { t } = useLanguage();
  const { isSky, form, setTime, set } = useSkyPoster();
  const value = form.skyTime ?? "";
  const [date, clock] = value.includes("T") ? value.split("T") : ["", "22:00"];

  return (
    <div className="mobile-sky-bar">
      <PosterKindPicker />
      {isSky ? (
        <>
          <div className="mobile-sky-bar__row">
            <label>
              <span>{t("sky.date")}</span>
              <input
                type="date"
                value={date}
                min="1900-01-01"
                max="2100-12-31"
                onChange={(event) => event.target.value && setTime(`${event.target.value}T${clock || "22:00"}`)}
              />
            </label>
            <label>
              <span>{t("sky.time")}</span>
              <input
                type="time"
                value={clock}
                onChange={(event) => event.target.value && date && setTime(`${date}T${event.target.value}`)}
              />
            </label>
          </div>
          <div className="mobile-sky-bar__toggles">
            {(
              [
                ["skyLines", "sky.lines", form.skyLines !== false],
                ["skyMilkyWay", "sky.milkyWay", form.skyMilkyWay !== false],
                ["skyGrid", "sky.grid", form.skyGrid === true],
              ] as const
            ).map(([name, label, checked]) => (
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
        </>
      ) : null}
    </div>
  );
}
