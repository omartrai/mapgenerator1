import { withAlpha } from "@/shared/utils/color";

/** Fades the map into the poster colour; heights are ratios of the poster height. */
export function applyFades(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string,
  fades: { top: number; bottom: number } = { top: 0.25, bottom: 0.25 },
): void {
  if (fades.top > 0) {
    const topHeight = height * fades.top;
    const topGradient = ctx.createLinearGradient(0, 0, 0, topHeight);
    topGradient.addColorStop(0, withAlpha(color, 1));
    topGradient.addColorStop(1, withAlpha(color, 0));
    ctx.fillStyle = topGradient;
    ctx.fillRect(0, 0, width, topHeight);
  }

  if (fades.bottom > 0) {
    const bottomHeight = height * fades.bottom;
    const bottomGradient = ctx.createLinearGradient(0, height, 0, height - bottomHeight);
    bottomGradient.addColorStop(0, withAlpha(color, 1));
    bottomGradient.addColorStop(1, withAlpha(color, 0));
    ctx.fillStyle = bottomGradient;
    ctx.fillRect(0, height - bottomHeight, width, bottomHeight);
  }
}
