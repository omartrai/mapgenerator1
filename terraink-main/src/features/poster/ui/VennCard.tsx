import { LuMoonStar } from "react-icons/lu";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { defaultSkyTime } from "@/features/sky/application/skyOptions";
import { useLanguage } from "@/shared/i18n/LanguageContext";

const COLOURWAYS = [
  { id: "venn_cream", label: "venn.cream", paper: "#F7F3EA", ink: "#1F2A44" },
  { id: "venn_navy", label: "venn.navy", paper: "#26355A", ink: "#F4F0E6" },
] as const;

/** Where & when poster: the names, the date (and time) of the sky, and the colourway. */
export default function VennCard() {
  const { t } = useLanguage();
  const { state, dispatch } = usePosterContext();
  const { form } = state;
  const value = form.skyTime || defaultSkyTime();
  const [date, clock] = value.split("T");
  const set = (name: string, next: string) => dispatch({ type: "SET_FIELD", name, value: next });

  return (
    <div className="twin-card venn-card">
      <div className="twin-card__head">
        <LuMoonStar aria-hidden="true" className="twin-card__icon venn-card__icon" />
        <span>
          <p className="twin-card__title">{t("venn.title")}</p>
          <p className="twin-card__note">{t("venn.note")}</p>
        </span>
      </div>

      <label className="twin-card__name">
        {t("venn.names")}
        <input
          className="form-control-tall"
          value={form.vennNames ?? ""}
          maxLength={32}
          onChange={(event) => set("vennNames", event.target.value)}
        />
      </label>

      <div className="venn-card__row">
        <label className="twin-card__name">
          {t("venn.date")}
          <input
            type="date"
            className="form-control-tall"
            value={date}
            min="1900-01-01"
            max="2100-12-31"
            onChange={(event) => event.target.value && set("skyTime", `${event.target.value}T${clock || "22:00"}`)}
          />
        </label>
        <label className="twin-card__name">
          {t("venn.time")}
          <input
            type="time"
            className="form-control-tall"
            value={clock}
            onChange={(event) => event.target.value && set("skyTime", `${date}T${event.target.value}`)}
          />
        </label>
      </div>

      <div className="venn-card__colours" role="radiogroup" aria-label={t("venn.colours")}>
        {COLOURWAYS.map((way) => (
          <button
            key={way.id}
            type="button"
            role="radio"
            aria-checked={form.theme === way.id}
            className={`venn-card__colour${form.theme === way.id ? " is-active" : ""}`}
            onClick={() => dispatch({ type: "SET_THEME", themeId: way.id })}
          >
            <span className="venn-card__swatch" style={{ background: way.paper, borderColor: way.ink }} aria-hidden="true">
              <i style={{ background: way.ink }} />
            </span>
            {t(way.label)}
          </button>
        ))}
      </div>
    </div>
  );
}
