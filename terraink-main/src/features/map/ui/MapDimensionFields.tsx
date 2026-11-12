import { MIN_DISTANCE_METERS, MAX_DISTANCE_METERS } from "@/core/config";
import { useLanguage } from "@/shared/i18n/LanguageContext";

interface MapDimensionForm {
  width: string;
  height: string;
  distance: string;
}

interface MapDimensionFieldsProps {
  form: MapDimensionForm;
  minPosterCm: number;
  maxPosterCm: number;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onNumericFieldBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
  showSizeFields?: boolean;
  showDistanceField?: boolean;
}

export default function MapDimensionFields({
  form,
  minPosterCm,
  maxPosterCm,
  onChange,
  onNumericFieldBlur,
  showSizeFields = true,
  showDistanceField = true,
}: MapDimensionFieldsProps) {
  const { t, language } = useLanguage();
  const SLIDER_MIN = 0;
  const SLIDER_MAX = 1000;

  const clampDistance = (value: number) =>
    Math.min(Math.max(value, MIN_DISTANCE_METERS), MAX_DISTANCE_METERS);

  const getDistanceStep = (distanceMeters: number) => {
    if (distanceMeters < 100_000) return 100;
    if (distanceMeters < 1_000_000) return 1_000;
    if (distanceMeters < 10_000_000) return 10_000;
    return 50_000;
  };

  const snapDistanceToAdaptiveStep = (distanceMeters: number) => {
    const bounded = clampDistance(distanceMeters);
    const step = getDistanceStep(bounded);
    return clampDistance(Math.round(bounded / step) * step);
  };

  const distanceToSliderValue = (distanceMeters: number) => {
    const minLog = Math.log(MIN_DISTANCE_METERS);
    const maxLog = Math.log(MAX_DISTANCE_METERS);
    const ratio =
      (Math.log(clampDistance(distanceMeters)) - minLog) / (maxLog - minLog);
    return Math.round(SLIDER_MIN + ratio * (SLIDER_MAX - SLIDER_MIN));
  };

  const sliderValueToDistance = (sliderValue: number) => {
    const minLog = Math.log(MIN_DISTANCE_METERS);
    const maxLog = Math.log(MAX_DISTANCE_METERS);
    const ratio = (sliderValue - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN);
    const distance = Math.exp(minLog + ratio * (maxLog - minLog));
    return snapDistanceToAdaptiveStep(distance);
  };

  /** Plain distances: "500 m", "2,5 km", "1 200 km". */
  const formatDistance = (distanceMeters: number) => {
    const locale = language === "en" ? "en-GB" : language === "ar" ? "ar-MA" : "fr-FR";
    if (distanceMeters < 1000) return `${Math.round(distanceMeters).toLocaleString(locale)} m`;
    const km = distanceMeters / 1000;
    const digits = km < 10 && !Number.isInteger(Math.round(km * 10) / 10) ? 1 : 0;
    return `${km.toLocaleString(locale, { maximumFractionDigits: digits })} km`;
  };

  const emitDistanceChange = (nextDistance: number) => {
    const syntheticEvent = {
      target: {
        name: "distance",
        value: String(snapDistanceToAdaptiveStep(nextDistance)),
        type: "range",
      },
    } as React.ChangeEvent<HTMLInputElement>;

    onChange(syntheticEvent);
  };

  const parsedDistance = Number(form.distance);
  const distanceValue = Number.isFinite(parsedDistance)
    ? clampDistance(parsedDistance)
    : MIN_DISTANCE_METERS;
  const sliderValue = distanceToSliderValue(distanceValue);

  // Only the two ends: the middle marks crowd together on narrow panels.
  const sliderMetaMarks = [MIN_DISTANCE_METERS, MAX_DISTANCE_METERS];

  const sliderPositionPercent = (distanceMeters: number) =>
    ((distanceToSliderValue(distanceMeters) - SLIDER_MIN) /
      (SLIDER_MAX - SLIDER_MIN)) *
    100;

  return (
    <div className="map-dimension-fields">
      {showSizeFields ? (
        <div className="map-size-fields-row">
          <label>
            {t("dimensions.width")}
            <input
              className="form-control-tall"
              name="width"
              type="number"
              min={minPosterCm}
              max={maxPosterCm}
              step="any"
              value={form.width}
              onChange={onChange}
              onBlur={onNumericFieldBlur}
            />
          </label>
          <label>
            {t("dimensions.height")}
            <input
              className="form-control-tall"
              name="height"
              type="number"
              min={minPosterCm}
              max={maxPosterCm}
              step="any"
              value={form.height}
              onChange={onChange}
              onBlur={onNumericFieldBlur}
            />
          </label>
        </div>
      ) : null}

      {showDistanceField ? (
        <label className="distance-slider-field">
          <span>
            <span>{t("dimensions.distance")}</span>
            {/* Plain-language readout instead of a metres box. */}
            <output className="distance-readout" aria-live="polite">
              {t("dimensions.across").replace("{km}", formatDistance(Math.max(0, Number(form.distance) || 0) * 2))}
            </output>
          </span>
          <input
            className="distance-slider"
            name="distance-slider-log"
            type="range"
            min={SLIDER_MIN}
            max={SLIDER_MAX}
            step={1}
            value={sliderValue}
            onChange={(event) =>
              emitDistanceChange(
                sliderValueToDistance(Number(event.target.value)),
              )
            }
            aria-label={t("dimensions.distanceAria")}
          />
          <span className="distance-slider-meta">
            {sliderMetaMarks.map((mark, index) => {
              const isFirst = index === 0;
              const isLast = index === sliderMetaMarks.length - 1;
              const left = sliderPositionPercent(mark);
              return (
                <span
                  key={mark}
                  className="distance-slider-meta-mark"
                  style={{
                    left: `${left}%`,
                    transform: isFirst
                      ? "translateX(0)"
                      : isLast
                        ? "translateX(-100%)"
                        : "translateX(-50%)",
                  }}
                >
                  {formatDistance(mark)}
                </span>
              );
            })}
          </span>
        </label>
      ) : null}
    </div>
  );
}
