import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import MapPreview from "@/features/map/ui/MapPreview";
import { usePosterContext } from "./PosterContext";
import { pinPath, twinMapOffsetOf, twinPieces, type PosterLayoutSpec } from "@/features/poster/domain/posterLayout";
import { twinPlaceFromForm } from "@/features/poster/application/twinText";

/** Same red as the printed pins (renderer/twin.ts). */
const PIN_COLOR = "#C8352B";

interface TwinMapLayerProps {
  layout: PosterLayoutSpec;
  zoom: number;
  minZoom: number;
  maxZoom: number;
  overzoomScale: number;
  interactive: boolean;
}

/**
 * Two-cities poster: the second place's map in the right puzzle piece of
 * the heart, plus the cut line and the two heart pins. Drag or zoom the
 * piece to frame the second place on its own; rotation follows the first map.
 */
export default function TwinMapLayer({ layout, zoom, minZoom, maxZoom, overzoomScale, interactive }: TwinMapLayerProps) {
  const { state, dispatch, mapStyle, mapRef, twinMapRef } = usePosterContext();
  const place = twinPlaceFromForm(state.form);
  const center = useMemo<[number, number]>(() => [place.lon, place.lat], [place.lon, place.lat]);
  // Its own zoom; until the customer zooms it, it starts at the first map's.
  const ownZoom = Number(state.form.twinZoom);
  const twinZoom = Number.isFinite(ownZoom) && ownZoom > 0 ? ownZoom : zoom;
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = boxRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height }),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Fix the second map's zoom as soon as the style is on, so zooming the
  // first half never moves it.
  useEffect(() => {
    if (!state.form.twinZoom) dispatch({ type: "SET_FIELD", name: "twinZoom", value: zoom.toFixed(3) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rotation follows the first map, live.
  useEffect(() => {
    const main = mapRef.current;
    if (!main) return;
    const follow = () => twinMapRef.current?.setBearing(main.getBearing());
    main.on("rotate", follow);
    follow();
    return () => {
      main.off("rotate", follow);
    };
  }, [mapRef, twinMapRef]);

  // Drag and zoom (wheel, pinch, double tap), but no rotation of its own.
  useEffect(() => {
    const twin = twinMapRef.current;
    if (!twin) return;
    twin.dragRotate.disable();
    twin.touchZoomRotate.disableRotation();
    twin.keyboard.disable();
  }, [interactive, twinMapRef]);

  const pieces = size.width > 0 ? twinPieces(layout, size.width, size.height) : null;
  const offset = twinMapOffsetOf(layout, size.width > 0 ? size.width / size.height : 0.75);
  const clip = (path: string): CSSProperties => ({ clipPath: `path("${path}")` });

  return (
    <div ref={boxRef} className="twin-map" aria-hidden="true">
      {pieces && offset ? (
        <>
          <div className="twin-map__clip" style={clip(pieces.heartPath)}>
            <div className="twin-map__clip" style={clip(pieces.rightPath)}>
              <div
                className="twin-map__map"
                style={{ translate: `${(offset.x * 100).toFixed(3)}% ${(offset.y * 100).toFixed(3)}%` }}
              >
                <MapPreview
                  style={mapStyle}
                  center={center}
                  zoom={twinZoom}
                  mapRef={twinMapRef}
                  interactive={interactive}
                  minZoom={minZoom}
                  maxZoom={maxZoom}
                  overzoomScale={overzoomScale}
                  onMoveEnd={([lon, lat], nextZoom) =>
                    dispatch({
                      type: "SET_FORM_FIELDS",
                      fields: { twinLat: lat.toFixed(6), twinLon: lon.toFixed(6), twinZoom: nextZoom.toFixed(3) },
                    })
                  }
                />
              </div>
            </div>
          </div>
          <svg className="twin-map__decor" viewBox={`0 0 ${size.width} ${size.height}`}>
            <defs>
              <clipPath id="twin-heart-clip">
                <path d={pieces.heartPath} />
              </clipPath>
            </defs>
            <path
              d={pieces.cutPath}
              clipPath="url(#twin-heart-clip)"
              fill="none"
              stroke="var(--poster-bg, #fff)"
              strokeWidth={pieces.cutWidth}
              strokeLinejoin="round"
            />
            {(state.form.twinPins === false ? [] : [pieces.leftPin, pieces.rightPin]).map((at, index) => (
              <path
                key={index}
                d={pinPath(at, pieces.pinSize)}
                fill={PIN_COLOR}
                stroke="var(--poster-bg, #fff)"
                strokeWidth={pieces.pinSize * 0.08}
              />
            ))}
          </svg>
        </>
      ) : null}
    </div>
  );
}
