import type { MutableRefObject } from "react";
import type maplibregl from "maplibre-gl";
import { useDrawRouteState } from "@/features/routes/application/drawRouteStore";
import { useSportRouteInput } from "@/features/routes/application/useSportRouteInput";
import { useLanguage } from "@/shared/i18n/LanguageContext";

/**
 * While the customer draws a route: every click on the poster adds a point
 * (shown as a dot; the line appears from the second point).
 */
export default function DrawRouteLayer({
  mapRef,
  overzoomScale,
}: {
  mapRef: MutableRefObject<maplibregl.Map | null>;
  overzoomScale: number;
}) {
  const { t } = useLanguage();
  const { active, points } = useDrawRouteState();
  const { addPoint } = useSportRouteInput();
  if (!active) return null;

  const map = mapRef.current;
  const dots = map
    ? points.map((point) => {
        const at = map.project([point.lon, point.lat]);
        return { x: at.x / overzoomScale, y: at.y / overzoomScale };
      })
    : [];

  return (
    <div
      className="draw-route-layer"
      role="application"
      aria-label={t("sport.route.drawHint")}
      onPointerDown={(event) => {
        if (event.button > 0 || !mapRef.current) return;
        event.preventDefault();
        event.stopPropagation();
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - bounds.left;
        const y = event.clientY - bounds.top;
        try {
          const position = mapRef.current.unproject([x * overzoomScale, y * overzoomScale]);
          addPoint(position.lat, position.lng);
        } catch {
          // Ignore projection failures.
        }
      }}
    >
      {dots.map((dot, index) => (
        <span
          key={index}
          className={`draw-route-layer__dot${index === dots.length - 1 ? " is-last" : ""}`}
          style={{ left: dot.x, top: dot.y }}
        />
      ))}
      <p className="draw-route-layer__hint">{t("sport.route.drawHint")}</p>
    </div>
  );
}
