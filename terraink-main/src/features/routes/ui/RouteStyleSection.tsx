import { usePosterContext } from "@/features/poster/ui/PosterContext";
import type { Route } from "@/features/routes/domain/types";
import { MAX_ROUTE_STROKE_WIDTH, MIN_ROUTE_STROKE_WIDTH } from "@/features/routes/domain/constants";
import { useLanguage } from "@/shared/i18n/LanguageContext";

const COLORS = ["#D62F2F", "#E4572E", "#E8622C", "#F2B705", "#2F9E6E", "#2D7FD3", "#141414", "#FFFFFF"];

/**
 * "Style du tracé" in the route step: line colour, thickness, solid or
 * dashed, and the start / finish icons on or off.
 */
export default function RouteStyleSection({ route }: { route: Route }) {
  const { t } = useLanguage();
  const { dispatch } = usePosterContext();
  const update = (changes: Partial<Route>) => dispatch({ type: "UPDATE_ROUTE", routeId: route.id, changes });
  const colors = COLORS.some((c) => c.toLowerCase() === route.color.toLowerCase()) ? COLORS : [route.color, ...COLORS.slice(0, -1)];
  const startOn = route.showEndpoints && !route.startMarker.hidden;
  const finishOn = route.showEndpoints && !route.finishMarker.hidden;

  const setColor = (color: string) =>
    update({
      color,
      startMarker: { ...route.startMarker, color },
      finishMarker: { ...route.finishMarker, color },
    });

  const setEndpoint = (kind: "start" | "finish", on: boolean) => {
    const start = kind === "start" ? on : startOn;
    const finish = kind === "finish" ? on : finishOn;
    update({
      showEndpoints: start || finish,
      startMarker: { ...route.startMarker, hidden: !start },
      finishMarker: { ...route.finishMarker, hidden: !finish },
    });
  };

  return (
    <div className="route-style">
      <p className="route-style__title">{t("sport.route.styleTitle")}</p>

      <div className="route-swatches" role="radiogroup" aria-label={t("common.color")}>
        {colors.map((color) => {
          const active = color.toLowerCase() === route.color.toLowerCase();
          return (
            <button
              key={color}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={color}
              className={`route-swatch${active ? " is-active" : ""}`}
              style={{ backgroundColor: color }}
              onClick={() => setColor(color)}
            />
          );
        })}
      </div>

      <label className="route-style__row">
        <span>{t("common.width")}</span>
        <input
          type="range"
          min={MIN_ROUTE_STROKE_WIDTH}
          max={MAX_ROUTE_STROKE_WIDTH}
          step={1}
          value={route.strokeWidth}
          onChange={(event) => update({ strokeWidth: Number(event.target.value) })}
        />
      </label>

      <div className="route-style__seg" role="radiogroup" aria-label={t("routes.style")}>
        {(["solid", "dashed"] as const).map((style) => (
          <button
            key={style}
            type="button"
            role="radio"
            aria-checked={route.lineStyle === style}
            className={route.lineStyle === style ? "is-active" : undefined}
            onClick={() => update({ lineStyle: style })}
          >
            <svg width="26" height="8" viewBox="0 0 26 8" aria-hidden="true">
              <line x1="1" y1="4" x2="25" y2="4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeDasharray={style === "dashed" ? "4 3" : undefined} />
            </svg>
            {style === "solid" ? t("routes.solid") : t("routes.dashed")}
          </button>
        ))}
      </div>

      <div className="route-style__seg">
        {(["start", "finish"] as const).map((kind) => {
          const on = kind === "start" ? startOn : finishOn;
          return (
            <button
              key={kind}
              type="button"
              aria-pressed={on}
              className={on ? "is-active" : undefined}
              onClick={() => setEndpoint(kind, !on)}
            >
              <span className={`route-style__dot${kind === "finish" ? " is-finish" : ""}`} aria-hidden="true" />
              {kind === "start" ? t("routes.start") : t("routes.finish")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
