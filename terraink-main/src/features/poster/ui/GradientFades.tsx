import { withAlpha } from "@/shared/utils/color";

interface GradientFadesProps {
  color: string;
  /** Heights as ratios of the poster height; 0 hides that fade. */
  fades?: { top: number; bottom: number };
}

/**
 * CSS gradient overlays that fade the top and bottom of the poster frame.
 * Matches the canvas-based `applyFades()` behaviour but runs on the GPU.
 */
export default function GradientFades({ color, fades = { top: 0.25, bottom: 0.25 } }: GradientFadesProps) {
  const solid = withAlpha(color, 1);
  const transparent = withAlpha(color, 0);

  return (
    <>
      {fades.top > 0 ? (
        <div
          className="poster-fade poster-fade--top"
          style={{
            height: `${fades.top * 100}%`,
            background: `linear-gradient(to bottom, ${solid}, ${transparent})`,
          }}
        />
      ) : null}
      {fades.bottom > 0 ? (
        <div
          className="poster-fade poster-fade--bottom"
          style={{
            height: `${fades.bottom * 100}%`,
            background: `linear-gradient(to top, ${solid}, ${transparent})`,
          }}
        />
      ) : null}
    </>
  );
}
