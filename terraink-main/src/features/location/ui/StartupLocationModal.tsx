import { useEffect, useState } from "react";
import {
  DEFAULT_CITY,
  DEFAULT_COUNTRY,
  DEFAULT_DISTANCE_METERS,
  DEFAULT_LAT,
  DEFAULT_LON,
} from "@/core/config";
import { geocodeLocation, reverseGeocodeCoordinates } from "@/core/services";
import { GEOLOCATION_TIMEOUT_MS } from "@/features/map/infrastructure";
import {
  getGeolocationFailureMessage,
  requestCurrentPositionWithRetry,
} from "@/features/location/infrastructure";
import { LuArrowRight, LuLandmark, LuMapPin, LuMapPinned, LuScan } from "react-icons/lu";
import { MyLocationIcon, SearchIcon } from "@/shared/ui/Icons";
import BrandMark, { BrandWordmark } from "@/shared/ui/BrandMark";
import { usePosterDispatch } from "@/features/poster/ui/PosterContext";
import { useLocationAutocomplete } from "@/features/location/application/useLocationAutocomplete";
import {
  recordRecentLocation,
  useRecentLocations,
} from "@/features/location/application/useRecentLocations";
import LocationSuggestionsDropdown from "./LocationSuggestionsDropdown";
import type { SearchResult } from "@/features/location/domain/types";
import { useLanguage, type TranslationKey } from "@/shared/i18n/LanguageContext";

const CLOSE_ANIMATION_MS = 220;
const DEFAULT_LOCATION_LABEL = "Casablanca, Maroc";

type PlaceKind = "city" | "street" | "monument" | "zone";

/** How much of the map each kind of place shows (poster distance, metres). */
const PLACE_KINDS: { id: PlaceKind; distance: number; Icon: typeof LuMapPin }[] = [
  { id: "city", distance: DEFAULT_DISTANCE_METERS, Icon: LuMapPin },
  { id: "street", distance: 1_200, Icon: LuMapPinned },
  { id: "monument", distance: 700, Icon: LuLandmark },
  { id: "zone", distance: 15_000, Icon: LuScan },
];

interface PendingLocation {
  label: string;
  lat: number;
  lon: number;
  city: string;
  country: string;
  continent: string;
}

interface StartupLocationModalProps {
  onComplete?: () => void;
}

export default function StartupLocationModal({
  onComplete,
}: StartupLocationModalProps) {
  const { t } = useLanguage();
  const { dispatch } = usePosterDispatch();
  const [isOpen, setIsOpen] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<PendingLocation | null>(null);
  // The picked suggestion backing pendingLocation, if any. Only confirms of an
  // actual suggestion pick are recorded into history — GPS and typed-text
  // geocode fallbacks are not.
  const [pendingSuggestion, setPendingSuggestion] = useState<SearchResult | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [kind, setKind] = useState<PlaceKind>("city");
  const distance = String(
    PLACE_KINDS.find((entry) => entry.id === kind)?.distance ?? DEFAULT_DISTANCE_METERS,
  );
  const [errorMessage, setErrorMessage] = useState("");
  const { locationSuggestions, isLocationSearching, clearLocationSuggestions, searchNow } =
    useLocationAutocomplete(locationInput, isInputFocused);
  const { recent, removeRecent, clearRecent } = useRecentLocations();

  const closeModal = () => {
    setIsClosing(true);
    window.setTimeout(() => {
      setIsOpen(false);
      onComplete?.();
    }, CLOSE_ANIMATION_MS);
  };

  const applyResolvedLocation = (location: PendingLocation | null) => {
    if (!location) {
      dispatch({ type: "SET_USER_LOCATION", location: null });
      dispatch({
        type: "SET_FORM_FIELDS",
        resetDisplayNameOverrides: true,
        fields: {
          location: DEFAULT_LOCATION_LABEL,
          latitude: DEFAULT_LAT.toFixed(6),
          longitude: DEFAULT_LON.toFixed(6),
          distance,
          displayCity: DEFAULT_CITY,
          displayCountry: DEFAULT_COUNTRY,
          displayContinent: "Europe",
        },
      });
      return;
    }

    dispatch({
      type: "SET_FORM_FIELDS",
      resetDisplayNameOverrides: true,
      fields: {
        location: location.label,
        latitude: location.lat.toFixed(6),
        longitude: location.lon.toFixed(6),
        distance,
        displayCity: location.city,
        displayCountry: location.country,
        displayContinent: location.continent,
      },
    });
    dispatch({
      type: "SET_USER_LOCATION",
      location: {
        id: `startup:${location.lat.toFixed(6)},${location.lon.toFixed(6)}`,
        label: location.label,
        city: location.city,
        country: location.country,
        continent: location.continent,
        lat: location.lat,
        lon: location.lon,
      },
    });
  };

  const handleUseMyLocation = () => {
    if (isResolving) {
      return;
    }

    setIsResolving(true);
    setErrorMessage("");
    setPendingSuggestion(null);
    void (async () => {
      const positionResult = await requestCurrentPositionWithRetry({
        timeoutMs: GEOLOCATION_TIMEOUT_MS,
        maxAttempts: 2,
      });

      if ("reason" in positionResult) {
        setErrorMessage(
          getGeolocationFailureMessage(positionResult.reason, {
            includeManualFallback: true,
          }),
        );
        setIsResolving(false);
        return;
      }

      const { lat, lon } = positionResult;
      try {
        const resolved = await reverseGeocodeCoordinates(lat, lon);
        const pending: PendingLocation = {
          label:
            String(resolved.label ?? "").trim() ||
            `${lat.toFixed(6)}, ${lon.toFixed(6)}`,
          lat,
          lon,
          city: String(resolved.city ?? "").trim(),
          country: String(resolved.country ?? "").trim(),
          continent: String(resolved.continent ?? "").trim(),
        };
        setPendingLocation(pending);
        setLocationInput(pending.label);
      } catch {
        const label = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
        const pending: PendingLocation = {
          label,
          lat,
          lon,
          city: "",
          country: "",
          continent: "",
        };
        setPendingLocation(pending);
        setLocationInput(label);
      } finally {
        setIsResolving(false);
      }
    })();
  };

  const onSuggestionSelect = (suggestion: SearchResult) => {
    setPendingLocation({
      label: suggestion.label,
      lat: suggestion.lat,
      lon: suggestion.lon,
      city: suggestion.city,
      country: suggestion.country,
      continent: String(suggestion.continent ?? "").trim(),
    });
    setPendingSuggestion(suggestion);
    setLocationInput(suggestion.label);
    setIsInputFocused(false);
    clearLocationSuggestions();
  };

  const handleConfirm = async () => {
    if (isResolving) {
      return;
    }

    setIsResolving(true);
    setErrorMessage("");

    const query = locationInput.trim();
    if (!query) {
      applyResolvedLocation(null);
      closeModal();
      setIsResolving(false);
      return;
    }

    if (pendingLocation && pendingLocation.label === query) {
      if (pendingSuggestion && pendingSuggestion.label === query) {
        recordRecentLocation(pendingSuggestion);
      }
      applyResolvedLocation(pendingLocation);
      closeModal();
      setIsResolving(false);
      return;
    }

    try {
      const resolved = await geocodeLocation(query);
      applyResolvedLocation({
        label: resolved.label,
        lat: resolved.lat,
        lon: resolved.lon,
        city: resolved.city,
        country: resolved.country,
        continent: String(resolved.continent ?? "").trim(),
      });
      closeModal();
    } catch {
      setErrorMessage(t("startup.resolveError"));
    } finally {
      setIsResolving(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={`startup-modal${isClosing ? " is-closing" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="startup-location-title"
    >
      <div className="startup-modal__card">
        <div className="startup-modal__brand">
          <BrandMark className="startup-modal__logo" />
          <BrandWordmark className="startup-modal__word" />
        </div>
        <p className="startup-modal__eyebrow">{t("startup.eyebrow")}</p>
        <h1 className="startup-modal__title" id="startup-location-title">
          {t("startup.title")}
        </h1>
        <p className="startup-modal__lede">{t("startup.description")}</p>

        <div className="startup-modal__kinds" role="radiogroup" aria-label={t("startup.kinds")}>
          {PLACE_KINDS.map(({ id, Icon }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={kind === id}
              className={`startup-modal__kind${kind === id ? " is-selected" : ""}`}
              onClick={() => setKind(id)}
            >
              <Icon aria-hidden="true" />
              <span>{t(`startup.kind.${id}` as TranslationKey)}</span>
            </button>
          ))}
        </div>

        <label className="startup-modal__sr" htmlFor="startup-location-search">
          {t("startup.searchLabel")}
        </label>
        <div className="startup-modal__search">
          <div className="startup-modal__field">
            <SearchIcon aria-hidden="true" />
            <input
              id="startup-location-search"
              type="text"
              value={locationInput}
              onChange={(event) => {
                setLocationInput(event.target.value);
                setPendingLocation(null);
                setPendingSuggestion(null);
                // Restore focus state when user types after selecting a suggestion
                // (DOM focus may still be on the input, so onFocus won't re-fire).
                if (!isInputFocused) setIsInputFocused(true);
              }}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setTimeout(() => setIsInputFocused(false), 120)}
              onKeyDown={(e) => { if (e.key === "Enter") void searchNow(e.currentTarget.value); }}
              placeholder={t("startup.placeholder")}
              autoComplete="off"
            />
          </div>
          <LocationSuggestionsDropdown
            query={locationInput}
            isFocused={isInputFocused}
            suggestions={locationSuggestions}
            isSearching={isLocationSearching}
            onSelect={onSuggestionSelect}
            recent={recent}
            onRecentSelect={onSuggestionSelect}
            onRecentRemove={removeRecent}
            onClearRecent={clearRecent}
            variant="startup"
          />
        </div>

        <button
          type="button"
          className="startup-modal__geo"
          onClick={handleUseMyLocation}
          disabled={isResolving}
        >
          <MyLocationIcon aria-hidden="true" />
          <span>{isResolving ? t("startup.locating") : t("startup.myLocation")}</span>
        </button>
        <button
          type="button"
          className="startup-modal__start"
          onClick={() => void handleConfirm()}
          disabled={isResolving}
        >
          {t("startup.start")}
          <LuArrowRight className="startup-modal__arrow" aria-hidden="true" />
        </button>
        {errorMessage ? (
          <p className="startup-modal__error" role="status">
            {errorMessage}
          </p>
        ) : null}

        <img className="startup-modal__skyline" src="/assets/startup-skyline.webp" alt="" />
      </div>
    </div>
  );
}
