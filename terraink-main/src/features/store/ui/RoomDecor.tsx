import { useId } from "react";
import { useStore } from "./StoreContext";

/** A trailing pothos, drawn in SVG; shared by the homepage hero and the studio. */
export function DecorPlant({ className }: { className: string }) {
  const leafId = `leaf-${useId().replace(/:/g, "")}`;
  return (
    <svg className={className} viewBox="0 0 220 420" preserveAspectRatio="xMidYMin meet" aria-hidden="true">
      <defs>
        <path id={leafId} d="M0 0C9-13 30-15 40-3 30 9 12 13 0 0Z" />
      </defs>
      <g fill="none" stroke="#5d7a3a" strokeWidth="2.2" strokeLinecap="round">
        <path d="M70 0C64 60 96 96 84 150s-34 92-16 150 40 70 30 118" />
        <path d="M120 0c10 50-20 80-6 130s30 70 18 120" />
        <path d="M30 0c-6 40 22 70 14 110" />
      </g>
      {[
        [72, 18, 150, "#4f7a2c"], [66, 46, 20, "#6b9a3a"], [80, 78, 160, "#3f6a24"],
        [90, 110, 30, "#5f8f33"], [84, 142, 170, "#4c7d2a"], [70, 176, 10, "#6fa242"],
        [60, 210, 150, "#3d6522"], [62, 244, 40, "#5a8a30"], [70, 276, 165, "#47772a"],
        [80, 306, 25, "#69a03f"], [92, 338, 150, "#40692a"], [96, 372, 50, "#5b8c33"],
        [120, 20, 30, "#5d9034"], [116, 56, 160, "#467526"], [108, 92, 20, "#6aa040"],
        [114, 128, 170, "#3f6a24"], [128, 166, 35, "#5a8d31"], [134, 204, 160, "#4a7a2a"],
        [130, 238, 30, "#64993b"], [32, 16, 160, "#4a7a2a"], [40, 50, 25, "#679c3d"],
        [38, 86, 170, "#3f6a24"],
      ].map(([x, y, rotate, fill], index) => (
        <use
          key={index}
          href={`#${leafId}`}
          fill={String(fill)}
          transform={`translate(${x} ${y}) rotate(${rotate}) scale(${index % 3 === 0 ? 1.15 : 0.95})`}
        />
      ))}
    </svg>
  );
}

/**
 * Backdrop behind the studio preview: plain in "Studio", a furnished room
 * photo in "Au mur" (the poster is placed over the photo's empty frame).
 */
export default function RoomDecor() {
  const { scene } = useStore();
  return <div className={`room-decor room-decor--${scene}`} aria-hidden="true" />;
}
