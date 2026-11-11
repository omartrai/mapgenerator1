import { useState } from "react";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { useFormHandlers } from "@/features/poster/application/useFormHandlers";
import { useLocationAutocomplete } from "@/features/location/application/useLocationAutocomplete";
import { useCurrentLocation } from "@/features/location/application/useCurrentLocation";
import { useRecentLocations } from "@/features/location/application/useRecentLocations";
import LocationSuggestionsDropdown from "@/features/location/ui/LocationSuggestionsDropdown";
import { useMapSync } from "@/features/map/application/useMapSync";
import {
  PLACEHOLDER_LOCATION_SEARCH,
  PLACEHOLDER_EXAMPLE_LATITUDE,
  PLACEHOLDER_EXAMPLE_LONGITUDE,
} from "@/features/location/ui/constants";
import type { SearchResult } from "@/features/location/domain/types";
import { MyLocationIcon, LocationIcon, SearchIcon } from "@/shared/ui/Icons";
import { useLanguage } from "@/shared/i18n/LanguageContext";

/**
 * Desktop floating location bar.
 * Renders a pill-shaped search row with a search icon on the left,
 * a coords-toggle pin button, and a GPS button on the right.
 * Clicking the pin icon shows/hides the lat/lon coordinate fields.
 */
export default function DesktopLocationBar() {
  const { t } = useLanguage();
  const { state, dispatch, mapRef } = usePosterContext();
  const {
    handleChange,
    handleLocationSelect: handleLocationSelectBase,
    handleClearLocation,
    setLocationFocused,
  } = useFormHandlers();
  const { locationSuggestions, isLocationSearching, searchNow } = useLocationAutocomplete(
    state.form.location,
    state.isLocationFocused,
  );
  const { flyToLocation } = useMapSync(state, dispatch, mapRef);
  const { handleUseCurrentLocation, isLocatingUser } =
    useCurrentLocation(flyToLocation);
  const { recent, removeRecent, clearRecent } = useRecentLocations();

  const [showCoords, setShowCoords] = useState(false);

  const hasLocationValue = state.form.location.trim().length > 0;

  const onLocationSelect = (location: SearchResult) => {
    handleLocationSelectBase(location);
    flyToLocation(location.lat, location.lon);
  };

  return (
    <div className={`dsk-loc-bar${showCoords ? " show-coords" : ""}`}>
      <div className="location-autocomplete">
        <div className="location-search-stack">
          <div className="location-search-main-row">
            <div className="location-search-row">
              <span className="location-search-icon" aria-hidden="true">
                <SearchIcon />
              </span>
              <div className="location-input-wrap">
                <input
                  className="input input-bordered form-control-tall"
                  name="location"
                  value={state.form.location}
                  onChange={handleChange}
                  onFocus={() => setLocationFocused(true)}
                  onBlur={() => setLocationFocused(false)}
                  onKeyDown={(e) => { if (e.key === "Enter") void searchNow(e.currentTarget.value); }}
                  placeholder={t("location.searchPlaceholder")}
                  autoComplete="off"
                />
                {hasLocationValue ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-square location-clear-btn"
                    aria-label={t("location.clear")}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleClearLocation}
                  >
                    x
                  </button>
                ) : null}
              </div>
            </div>

            <div className="location-search-icons">
            <button
              type="button"
              className={`btn btn-ghost btn-square icon-only-btn location-row-icon-btn${isLocatingUser ? " is-locating" : ""}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleUseCurrentLocation}
              disabled={isLocatingUser}
              aria-label={t("location.current")}
              title={t("location.current")}
            >
              <MyLocationIcon className="location-current-icon" />
            </button>
            <button
              type="button"
              className={`btn btn-ghost btn-square icon-only-btn location-row-icon-btn${showCoords ? " is-active" : ""}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setShowCoords((v) => !v)}
              aria-label={t("location.coordinates")}
              title={t("location.coordinates")}
            >
              <LocationIcon />
            </button>
            </div>
          </div>

          <LocationSuggestionsDropdown
            query={state.form.location}
            isFocused={state.isLocationFocused}
            suggestions={locationSuggestions}
            isSearching={isLocationSearching}
            onSelect={onLocationSelect}
            recent={recent}
            onRecentSelect={onLocationSelect}
            onRecentRemove={removeRecent}
            onClearRecent={clearRecent}
          />
        </div>

        <div className="dsk-loc-coords">
          <label>
            {t("location.latitudeShort")}
            <input
              className="input input-bordered form-control-tall"
              name="latitude"
              value={state.form.latitude}
              onChange={handleChange}
              placeholder={PLACEHOLDER_EXAMPLE_LATITUDE}
            />
          </label>
          <label>
            {t("location.longitudeShort")}
            <input
              className="input input-bordered form-control-tall"
              name="longitude"
              value={state.form.longitude}
              onChange={handleChange}
              placeholder={PLACEHOLDER_EXAMPLE_LONGITUDE}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
