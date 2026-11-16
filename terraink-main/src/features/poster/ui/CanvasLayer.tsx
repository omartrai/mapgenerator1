import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * A canvas the size of the poster preview (sharp on retina screens) that
 * redraws when its inputs change, when it is resized and once web fonts load.
 * Used for the parts drawn by the print renderer itself, so they match.
 */
export default function CanvasLayer({
  draw,
  deps,
  className,
}: {
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
  deps: unknown[];
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [fontTick, setFontTick] = useState(0);

  useLayoutEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const update = () => setSize({ width: canvas.clientWidth, height: canvas.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let live = true;
    const bump = () => live && setFontTick((n) => n + 1);
    void document.fonts?.ready.then(bump);
    document.fonts?.addEventListener?.("loadingdone", bump);
    return () => {
      live = false;
      document.fonts?.removeEventListener?.("loadingdone", bump);
    };
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || size.width === 0) return;
    const ratio = Math.min(3, (window.devicePixelRatio || 1) * 1.5);
    canvas.width = Math.round(size.width * ratio);
    canvas.height = Math.round(size.height * ratio);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    draw(ctx, canvas.width, canvas.height);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height, fontTick, ...deps]);

  return <canvas ref={ref} className={className ?? "poster-canvas-layer"} aria-hidden="true" />;
}
