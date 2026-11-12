import { useEffect, useRef, useState } from "react";
import { drawSkyChart, loadSkyCatalog, type SkyCatalog } from "@/core/services";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { skyOptionsFromForm } from "@/features/sky/application/skyOptions";

/**
 * The night-sky poster's background and star chart, drawn on a canvas that
 * covers the poster in the preview (the text overlay sits on top).
 */
export default function SkyPreview() {
  const { state, effectiveTheme } = usePosterContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [catalog, setCatalog] = useState<SkyCatalog | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    let alive = true;
    void loadSkyCatalog().then((loaded) => alive && setCatalog(loaded));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return undefined;
    const observer = new ResizeObserver(() => setSize({ width: parent.clientWidth, height: parent.clientHeight }));
    observer.observe(parent);
    setSize({ width: parent.clientWidth, height: parent.clientHeight });
    return () => observer.disconnect();
  }, []);

  const { form } = state;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size.width) return;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.round(size.width * ratio);
    const height = Math.round(size.height * ratio);
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const options = skyOptionsFromForm(form, effectiveTheme, width, height);
    if (catalog) {
      drawSkyChart(ctx, width, height, catalog, options);
    } else {
      ctx.fillStyle = options.colors.paper;
      ctx.fillRect(0, 0, width, height);
    }
  }, [
    catalog,
    size,
    effectiveTheme,
    form.latitude,
    form.longitude,
    form.skyTime,
    form.skyLines,
    form.skyGrid,
    form.skyMilkyWay,
    form.posterLayout,
  ]);

  return <canvas ref={canvasRef} className="sky-preview" aria-hidden="true" />;
}
