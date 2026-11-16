import { useEffect, useState } from "react";
import { drawPhotoBackdrop } from "@/core/services";
import { photoFrameFromForm } from "@/features/poster/domain/posterLayout";
import { usePosterContext } from "./PosterContext";
import CanvasLayer from "./CanvasLayer";

/** Photorun preview: the runner's photo over the map, under the route. */
export default function PhotoBackdrop() {
  const { state } = usePosterContext();
  const { form } = state;
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!form.photo) return setImage(null);
    let live = true;
    const next = new Image();
    next.onload = () => live && setImage(next);
    next.src = form.photo;
    return () => {
      live = false;
    };
  }, [form.photo]);

  const frame = photoFrameFromForm(form);
  const mono = form.photoMono !== false;
  return (
    <CanvasLayer
      className="poster-canvas-layer poster-photo-backdrop"
      draw={(ctx, width, height) => drawPhotoBackdrop(ctx, width, height, image, frame, mono)}
      deps={[image, frame.zoom, frame.x, frame.y, mono]}
    />
  );
}
