import type { CSSProperties } from "react";
import type { FrameId } from "../domain/catalog";

interface FramedPosterProps {
  src: string;
  alt: string;
  frameId: FrameId;
  /** width / height of the print. */
  ratio: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  loading?: "lazy" | "eager";
}

/** A poster image dressed as the physical product: framed or as a loose print. */
export default function FramedPoster({
  src,
  alt,
  frameId,
  ratio,
  size = "md",
  className = "",
  loading = "lazy",
}: FramedPosterProps) {
  return (
    <figure
      className={`framed-poster framed-poster--${frameId} framed-poster--${size} ${className}`}
      style={{ "--poster-ratio": String(ratio) } as CSSProperties}
    >
      <div className="framed-poster__frame">
        <div className="framed-poster__mat">
          <img className="framed-poster__img" src={src} alt={alt} loading={loading} decoding="async" />
        </div>
      </div>
    </figure>
  );
}
