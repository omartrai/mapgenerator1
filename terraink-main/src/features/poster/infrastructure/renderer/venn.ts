import { shapePath, vennPieces, VENN_GOLD, type PosterLayoutSpec } from "@/features/poster/domain/posterLayout";

export interface VennText {
  /** Column labels, e.g. "OÙ" and "QUAND". */
  where: string;
  when: string;
  /** The date printed under "when". */
  date: string;
}

/**
 * Where & when poster: gold rings round the map and sky circles, a gold
 * heart where they meet, and the "when" column (label and date) plus the
 * "where" label. The place and coordinates under "where" are ordinary
 * poster text lines. Drawn the same way in the preview and the print.
 */
export function drawVennDecor(
  ctx: CanvasRenderingContext2D,
  layout: PosterLayoutSpec,
  width: number,
  height: number,
  options: { paper: string; text: string; fontFamily?: string; labels: VennText | null },
): void {
  const pieces = vennPieces(layout, width, height);
  if (!pieces) return;
  ctx.save();
  ctx.strokeStyle = VENN_GOLD;
  ctx.lineWidth = pieces.ringWidth;
  for (const circle of [pieces.map, pieces.sky]) {
    ctx.beginPath();
    ctx.arc(circle.cx, circle.cy, circle.r, 0, Math.PI * 2);
    ctx.stroke();
  }

  const size = pieces.heartSize;
  const heart = new Path2D(
    shapePath("heart", { x: pieces.meet.x - size / 2, y: pieces.meet.y - size / 2, w: size, h: size }),
  );
  ctx.fillStyle = VENN_GOLD;
  ctx.fill(heart);
  ctx.strokeStyle = options.paper;
  ctx.lineWidth = size * 0.07;
  ctx.stroke(heart);

  if (options.labels) {
    const family = options.fontFamily
      ? `"${options.fontFamily}", "Space Grotesk", sans-serif`
      : '"Space Grotesk", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = VENN_GOLD;
    ctx.font = `600 ${pieces.labelSize}px ${family}`;
    if ("letterSpacing" in ctx) (ctx as { letterSpacing: string }).letterSpacing = `${pieces.labelSize * 0.25}px`;
    ctx.fillText(options.labels.where.toUpperCase(), pieces.where.x, pieces.where.labelY);
    ctx.fillText(options.labels.when.toUpperCase(), pieces.when.x, pieces.when.labelY);
    if ("letterSpacing" in ctx) (ctx as { letterSpacing: string }).letterSpacing = "0px";
    ctx.fillStyle = options.text;
    ctx.font = `400 ${pieces.dateSize}px ${family}`;
    ctx.fillText(options.labels.date, pieces.when.x, pieces.when.dateY);
  }
  ctx.restore();
}
