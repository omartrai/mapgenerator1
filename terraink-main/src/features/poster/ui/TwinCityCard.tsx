import { useId, useState } from "react";
import { LuMapPin, LuSearch } from "react-icons/lu";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { useLocationAutocomplete } from "@/features/location/application/useLocationAutocomplete";
import { twinPlaceFromForm } from "@/features/poster/application/twinText";
import { useLanguage } from "@/shared/i18n/LanguageContext";

/** Two-cities poster: choose the second place and the name printed for it. */
export default function TwinCityCard() {
  const { t } = useLanguage();
  const { state, dispatch } = usePosterContext();
  const uid = useId();
  const place = twinPlaceFromForm(state.form);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const { locationSuggestions, isLocationSearching, clearLocationSuggestions } = useLocationAutocomplete(query, focused);
  const showList = focused && query.trim().length >= 2;

  return (
    <div className="twin-card">
      <div className="twin-card__head">
        <LuMapPin aria-hidden="true" className="twin-card__icon" />
        <span>
          <p className="twin-card__title">{t("twin.title")}</p>
          <p className="twin-card__note">{t("twin.note")}</p>
        </span>
      </div>

      <div className="twin-card__search">
        <LuSearch aria-hidden="true" />
        <input
          type="search"
          value={query}
          placeholder={t("twin.search")}
          aria-label={t("twin.search")}
          aria-controls={`${uid}-list`}
          aria-expanded={showList}
          role="combobox"
          autoComplete="off"
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 150)}
        />
      </div>
      {showList ? (
        <ul id={`${uid}-list`} className="twin-card__list" role="listbox">
          {locationSuggestions.length === 0 ? (
            <li className="twin-card__empty">{isLocationSearching ? t("twin.searching") : t("twin.noResult")}</li>
          ) : (
            locationSuggestions.map((result) => (
              <li key={result.id} role="option" aria-selected={false}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    dispatch({
                      type: "SET_FORM_FIELDS",
                      fields: {
                        twinCity: result.city || result.label.split(",")[0],
                        twinCountry: result.country || "",
                        twinLat: result.lat.toFixed(6),
                        twinLon: result.lon.toFixed(6),
                      },
                    });
                    setQuery("");
                    clearLocationSuggestions();
                  }}
                >
                  {result.label}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}

      <label className="twin-card__name">
        {t("twin.name")}
        <input
          className="form-control-tall"
          value={place.city}
          maxLength={30}
          onChange={(event) => dispatch({ type: "SET_FIELD", name: "twinCity", value: event.target.value })}
        />
      </label>
    </div>
  );
}
