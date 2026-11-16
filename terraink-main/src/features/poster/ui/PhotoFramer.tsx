import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { LuRotateCcw } from "react-icons/lu";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import {
  PHOTO_ZOOM_MAX,
  photoFrameFromForm,
  placePhoto,
  shapePath,
} from "@/features/poster/domain/posterLayout";
import { useLanguage } from "@/shared/i18n/LanguageContext";

const PAD = 220;

/**
 * Frame the photo inside its heart: drag it to move, slider to zoom. Shows
 * the same crop as the poster (heart outline over the photo).
 */
export default function PhotoFramer({ photo, mono }: { photo: string; mono: boolean }) {
  const { t } = useLanguage();
  const { state, dispatch } = usePosterContext();
  const frame = photoFrameFromForm(state.form);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const drag = useRef<{ x: number; y: number; fx: number; fy: number } | null>(null);

  useEffect(() => {
    let live = true;
    const image = new Image();
    image.onload = () => live && setSize({ w: image.naturalWidth, h: image.naturalHeight });
    image.src = photo;
    return () => {
      live = false;
    };
  }, [photo]);

  const set = (changes: Partial<typeof frame>) => {
    const next = { ...frame, ...changes };
    dispatch({
      type: "SET_FORM_FIELDS",
      fields: {
        photoZoom: next.zoom.toFixed(3),
        photoX: Math.min(1, Math.max(0, next.x)).toFixed(4),
        photoY: Math.min(1, Math.max(0, next.y)).toFixed(4),
      },
    });
  };

  const box = { x: 0, y: 0, size: PAD };
  const spot = size ? placePhoto(size.w, size.h, box, frame) : null;

  const onDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, fx: frame.x, fy: frame.y };
  };
  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !spot) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const scale = PAD / rect.width;
    // Moving the photo right shows more of its left side.
    set({
      x: drag.current.fx - ((event.clientX - drag.current.x) * scale) / spot.w,
      y: drag.current.fy - ((event.clientY - drag.current.y) * scale) / spot.h,
    });
  };
  const onUp = () => {
    drag.current = null;
  };
  const onKey = (event: KeyboardEvent) => {
    const step = 0.03;
    const moves: Record<string, Partial<typeof frame>> = {
      ArrowLeft: { x: frame.x + step },
      ArrowRight: { x: frame.x - step },
      ArrowUp: { y: frame.y + step },
      ArrowDown: { y: frame.y - step },
    };
    if (!moves[event.key]) return;
    event.preventDefault();
    set(moves[event.key]);
  };

  return (
    <div className="photo-framer">
      <p className="photo-card__title">{t("photo.frame")}</p>
      <p className="photo-card__note">{t("photo.frameHint")}</p>
      <div
        className="photo-framer__pad"
        role="application"
        tabIndex={0}
        aria-label={t("photo.frame")}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKey}
      >
        <svg viewBox={`0 0 ${PAD} ${PAD}`} aria-hidden="true">
          <defs>
            <mask id="photo-framer-mask">
              <rect width={PAD} height={PAD} fill="#fff" />
              <path d={shapePath("heart", { x: 0, y: 0, w: PAD, h: PAD })} fill="#000" />
            </mask>
          </defs>
          {spot ? (
            <image
              href={photo}
              x={spot.x}
              y={spot.y}
              width={spot.w}
              height={spot.h}
              preserveAspectRatio="none"
              style={mono ? { filter: "grayscale(1)" } : undefined}
            />
          ) : null}
          {/* Everything outside the heart is dimmed, like the paper on the poster. */}
          <rect width={PAD} height={PAD} fill="rgba(255,255,255,0.72)" mask="url(#photo-framer-mask)" />
          <path
            d={shapePath("heart", { x: 0, y: 0, w: PAD, h: PAD })}
            fill="none"
            stroke="#1f3b33"
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
        </svg>
      </div>
      <label className="photo-framer__zoom">
        <span>{t("photo.zoom")}</span>
        <input
          type="range"
          min={1}
          max={PHOTO_ZOOM_MAX}
          step={0.01}
          value={frame.zoom}
          onChange={(event) => set({ zoom: Number(event.target.value) })}
        />
      </label>
      <button
        type="button"
        className="photo-card__btn"
        onClick={() => dispatch({ type: "SET_FORM_FIELDS", fields: { photoZoom: "", photoX: "", photoY: "" } })}
      >
        <LuRotateCcw aria-hidden="true" />
        {t("photo.reset")}
      </button>
    </div>
  );
}
