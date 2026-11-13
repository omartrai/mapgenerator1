import type { SearchResult } from "../domain/types";
import type { PosterForm } from "@/features/poster/application/posterReducer";
import { useRecentLocations } from "../application/useRecentLocations";
import LocationSuggestionsDropdown from "./LocationSuggestionsDropdown";
import {
  PLACEHOLDER_LOCATION_SEARCH,
  PLACEHOLDER_EXAMPLE_LATITUDE,
  PLACEHOLDER_EXAMPLE_LONGITUDE,
} from "./constants";
import { MyLocationIcon } from "@/shared/ui/Icons";
import { useLanguage } from "@/shared/i18n/LanguageContext";
import PosterKindPicker from "@/features/sky/ui/PosterKindPicker";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import SkyMomentCard from "@/features/sky/ui/SkyMomentCard";

interface LocationSectionProps {
  form: PosterForm;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLocationFocus: () => void;
  onLocationBlur: () => void;
  searchNow: (query: string) => Promise<void>;
  isLocationFocused: boolean;
  locationSuggestions: SearchResult[];
  isLocationSearching: boolean;
  onLocationSelect: (suggestion: SearchResult) => void;
  onClearLocation: () => void;
  onUseCurrentLocation: () => void;
  isLocatingUser: boolean;
  locationPermissionMessage: string;
}

export default function LocationSection({
  form,
  onChange,
  onLocationFocus,
  onLocationBlur,
  searchNow,
  isLocationFocused,
  locationSuggestions,
  isLocationSearching,
  onLocationSelect,
  onClearLocation,
  onUseCurrentLocation,
  isLocatingUser,
}: LocationSectionProps) {
  const { t } = useLanguage();
  const { recent, removeRecent, clearRecent } = useRecentLocations();
  const hasLocationValue = form.location.trim().length > 0;
  const { state } = usePosterContext();
  // A sport poster with its route needs no place: the map follows the route.
  const routeSetsMap = form.posterLayout === "activity" && state.routes.some((route) => route.visible);

  if (routeSetsMap) {
    return (
      <section className="panel-block">
        <PosterKindPicker />
      </section>
    );
  }

  return (
    <section className="panel-block">
      <PosterKindPicker />
      <h2>{t("nav.location")}</h2>
      <label>
        {t("nav.location")}
        <div className="location-autocomplete">
          <div className="location-search-row">
            <div className="location-input-wrap">
              <input
                className="form-control-tall"
                name="location"
                value={form.location}
                onChange={onChange}
                onFocus={onLocationFocus}
                onBlur={onLocationBlur}
                onKeyDown={(e) => { if (e.key === "Enter") void searchNow(e.currentTarget.value); }}
                placeholder={t("location.searchPlaceholder")}
                autoComplete="off"
              />
              {hasLocationValue ? (
                <button
                  type="button"
                  className="location-clear-btn"
                  aria-label={t("location.clear")}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={onClearLocation}
                >
                  x
                </button>
              ) : null}
            </div>
            <button
              type="button"
              className="location-current-btn"
              onMouseDown={(event) => event.preventDefault()}
              onClick={onUseCurrentLocation}
              disabled={isLocatingUser}
              aria-label={t("location.current")}
              title={t("location.current")}
            >
              <MyLocationIcon />
            </button>
          </div>
          <LocationSuggestionsDropdown
            query={form.location}
            isFocused={isLocationFocused}
            suggestions={locationSuggestions}
            isSearching={isLocationSearching}
            onSelect={onLocationSelect}
            recent={recent}
            onRecentSelect={onLocationSelect}
            onRecentRemove={removeRecent}
            onClearRecent={clearRecent}
          />
        </div>
      </label>
      <SkyMomentCard />
      <details className="advanced-coords">
        <summary>{t("location.coordsToggle")}</summary>
      <div className="field-grid keep-two-mobile">
        <label>
          {t("location.latitude")}
          <input
            className="form-control-tall"
            name="latitude"
            value={form.latitude}
            onChange={onChange}
            placeholder={PLACEHOLDER_EXAMPLE_LATITUDE}
          />
        </label>
        <label>
          {t("location.longitude")}
          <input
            className="form-control-tall"
            name="longitude"
            value={form.longitude}
            onChange={onChange}
            placeholder={PLACEHOLDER_EXAMPLE_LONGITUDE}
          />
        </label>
      </div>
      </details>
    </section>
  );
}
