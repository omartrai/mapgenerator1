import { useState, type ImgHTMLAttributes } from "react";
import { resizedImageUrl } from "@/shared/utils/image";

/**
 * <img> that loads a resized copy of a remote image (2× the given display
 * width, for sharp screens) and falls back to the original if the resizing
 * service is unavailable.
 */
export default function ThumbImage({
  src,
  width,
  ...rest
}: Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "width"> & { src: string; width: number }) {
  const [failed, setFailed] = useState(false);
  const light = resizedImageUrl(src, width * 2);
  return (
    <img
      {...rest}
      src={failed ? src : light}
      onError={(event) => {
        if (!failed && light !== src) setFailed(true);
        rest.onError?.(event);
      }}
    />
  );
}
