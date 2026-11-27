import { useState } from "react";
import { LuCalendar, LuCheck, LuClock, LuSlidersHorizontal } from "react-icons/lu";
import PosterKindPicker from "@/features/sky/ui/PosterKindPicker";
import { useSkyPoster } from "@/features/sky/application/useSkyPoster";
import { useLanguage } from "@/shared/i18n/LanguageContext";
import SportRouteCard from "@/features/routes/ui/SportRouteCard";

/**
 * Phones: the place step is a floating search bar, so the poster type and
 * the night-sky moment sit right under it as one slim pill. The chart
 * options (constellations, Milky Way, grid) open from its settings button.
 */
export default function MobileSkyBar() {
  const { t } = useLanguage();
  const { isSky, kind, form, setTime, set } = useSkyPoster();
  const [showOptions, setShowOptions] = useState(false);
  const value = form.skyTime ?? "";
  const [date, clock] = value.includes("T") ? value.split("T") : ["", "22:00"];

  return (
    <div className="mobile-sky-bar">
      <PosterKindPicker mini />
      {kind === "sport" || kind === "trail" ? <SportRouteCard compact /> : null}
      {isSky ? (
        <>
        <div className="mobile-sky-moment">
          <label className="mobile-sky-moment__field mobile-sky-moment__field--date">
            <LuCalendar aria-hidden="true" />
            <span className="sr-only">{t("sky.date")}</span>
            <input
              type="date"
              value={date}
              min="1900-01-01"
              max="2100-12-31"
              onChange={(event) => event.target.value && setTime(`${event.target.value}T${clock || "22:00"}`)}
            />
          </label>
          <span className="mobile-sky-moment__divider" aria-hidden="true" />
          <label className="mobile-sky-moment__field">
            <LuClock aria-hidden="true" />
            <span className="sr-only">{t("sky.time")}</span>
            <input
              type="time"
              value={clock}
              onChange={(event) => event.target.value && date && setTime(`${date}T${event.target.value}`)}
            />
          </label>
          <button
            type="button"
            className={`mobile-sky-moment__more${showOptions ? " is-open" : ""}`}
            aria-expanded={showOptions}
            aria-label={t("sky.show")}
            onClick={() => setShowOptions((open) => !open)}
          >
            <LuSlidersHorizontal aria-hidden="true" />
          </button>
        </div>
        {showOptions ? (
          <div className="mobile-sky-options">
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
                className={`mobile-sky-options__chip${checked ? " is-active" : ""}`}
                onClick={() => set(name, !checked)}
              >
                {checked ? <LuCheck aria-hidden="true" /> : null}
                {t(label)}
              </button>
            ))}
          </div>
        ) : null}
        </>
      ) : null}
    </div>
  );
}
