import {
  pinPath,
  twinMapOffsetOf,
  twinPieces,
  type PosterLayoutSpec,
} from "@/features/poster/domain/posterLayout";

/** Red of the heart pins (same as the heart style's pin). */
export const TWIN_PIN_COLOR = "#C8352B";

/**
 * Two-cities poster: draws the second map into the right puzzle piece of
 * the heart. `twinMap` is a full-poster snapshot centred on the second place.
 */
export function drawTwinMap(
  ctx: CanvasRenderingContext2D,
  layout: PosterLayoutSpec,
  width: number,
  height: number,
  twinMap: CanvasImageSource,
): void {
  const pieces = twinPieces(layout, width, height);
  const offset = twinMapOffsetOf(layout, width / height);
  if (!pieces || !offset) return;
  ctx.save();
  ctx.clip(new Path2D(pieces.heartPath));
  ctx.clip(new Path2D(pieces.rightPath));
  ctx.drawImage(twinMap, offset.x * width, offset.y * height);
  ctx.restore();
}

/** The cut between the two pieces (paper colour) and a heart pin on each place. */
export function drawTwinDecor(
  ctx: CanvasRenderingContext2D,
  layout: PosterLayoutSpec,
  width: number,
  height: number,
  paper: string,
): void {
  const pieces = twinPieces(layout, width, height);
  if (!pieces) return;
  ctx.save();
  ctx.clip(new Path2D(pieces.heartPath));
  ctx.strokeStyle = paper;
  ctx.lineWidth = pieces.cutWidth;
  ctx.lineJoin = "round";
  ctx.stroke(new Path2D(pieces.cutPath));
  ctx.restore();

  for (const at of [pieces.leftPin, pieces.rightPin]) {
    const pin = new Path2D(pinPath(at, pieces.pinSize));
    ctx.fillStyle = TWIN_PIN_COLOR;
    ctx.fill(pin);
    ctx.strokeStyle = paper;
    ctx.lineWidth = pieces.pinSize * 0.08;
    ctx.stroke(pin);
  }
}
