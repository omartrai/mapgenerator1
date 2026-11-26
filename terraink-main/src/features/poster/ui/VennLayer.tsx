import { useEffect, useRef, useState } from "react";
import { drawSkyChart, drawVennDecor, loadSkyCatalog, type SkyCatalog } from "@/core/services";
import { usePosterContext } from "./PosterContext";
import type { PosterLayoutSpec } from "@/features/poster/domain/posterLayout";
import { skyOptionsFromForm } from "@/features/sky/application/skyOptions";
import { vennTextFromForm } from "@/features/poster/application/vennText";
import { useLanguage } from "@/shared/i18n/LanguageContext";

/**
 * Where & when poster, in the preview: the night sky of the date in the
 * right circle, the gold rings and heart, and the "when" column. Drawn by
 * the same functions as the print, over the poster text layer.
 */
export default function VennLayer({ layout }: { layout: PosterLayoutSpec }) {
  const { state, effectiveTheme } = usePosterContext();
  const { language } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [catalog, setCatalog] = useState<SkyCatalog | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const { form } = state;

  useEffect(() => {
    let alive = true;
    void loadSkyCatalog().then((loaded) => alive && setCatalog(loaded));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const observer = new ResizeObserver(() => setSize({ width: canvas.clientWidth, height: canvas.clientHeight }));
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

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
    ctx.clearRect(0, 0, width, height);
    if (catalog) drawSkyChart(ctx, width, height, catalog, skyOptionsFromForm(form, effectiveTheme, width, height));
    const text = vennTextFromForm(form, "", "", language);
    drawVennDecor(ctx, layout, width, height, {
      paper: effectiveTheme.ui.bg,
      text: effectiveTheme.ui.text,
      fontFamily: form.fontFamily.trim(),
      labels: form.showPosterText ? text?.labels ?? null : null,
    });
  }, [catalog, size, effectiveTheme, form, layout, language]);

  return <canvas ref={canvasRef} className="venn-layer" aria-hidden="true" />;
}
