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
 * The room around the studio preview: a sunlit plaster wall, a trailing
 * plant, a mushroom lamp on books, a stoneware vase with an olive branch and
 * a wooden shelf. Purely decorative.
 */
export default function RoomDecor() {
  const { scene } = useStore();
  return (
    <div className={`room-decor room-decor--${scene}`} aria-hidden="true">
      <span className="room-decor__light" />
      <DecorPlant className="room-decor__plant" />
      <div className="room-decor__lamp">
        <span className="room-decor__shade" />
        <span className="room-decor__glow" />
        <span className="room-decor__base" />
        <span className="room-decor__book room-decor__book--1" />
        <span className="room-decor__book room-decor__book--2" />
        <span className="room-decor__book room-decor__book--3" />
      </div>
      <svg className="room-decor__vase" viewBox="0 0 160 340">
        <g fill="none" stroke="#6f6a3c" strokeWidth="2" strokeLinecap="round">
          <path d="M80 190C78 140 70 90 52 30" />
          <path d="M82 190c4-50 14-96 34-150" />
          <path d="M80 160c-14-20-30-30-48-34" />
        </g>
        {[
          [52, 32, -70], [58, 52, 200], [60, 74, -60], [66, 96, 210], [70, 120, -50],
          [114, 42, 250], [110, 64, -20], [104, 88, 240], [98, 112, -10], [92, 136, 230],
          [34, 126, 180], [44, 132, 20], [62, 146, 200],
        ].map(([x, y, rotate], index) => (
          <ellipse
            key={index}
            cx={x}
            cy={y}
            rx="15"
            ry="4.2"
            fill={index % 2 ? "#7d8450" : "#5f6a3a"}
            transform={`rotate(${rotate} ${x} ${y})`}
          />
        ))}
        <defs>
          <radialGradient id="room-vase" cx="0.38" cy="0.4" r="0.75">
            <stop offset="0" stopColor="#f3ebde" />
            <stop offset="0.65" stopColor="#e2d5c2" />
            <stop offset="1" stopColor="#bfae96" />
          </radialGradient>
          <pattern id="room-speckle" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="4" r="0.9" fill="#8c7a63" opacity="0.5" />
            <circle cx="10" cy="9" r="0.7" fill="#8c7a63" opacity="0.45" />
            <circle cx="6" cy="12" r="0.5" fill="#8c7a63" opacity="0.4" />
          </pattern>
        </defs>
        <path d="M62 180h36c0 18 46 40 46 92 0 38-26 62-64 62s-64-24-64-62c0-52 46-74 46-92z" fill="url(#room-vase)" />
        <path d="M62 180h36c0 18 46 40 46 92 0 38-26 62-64 62s-64-24-64-62c0-52 46-74 46-92z" fill="url(#room-speckle)" />
        <ellipse cx="80" cy="181" rx="18" ry="3.5" fill="#cbbba4" />
      </svg>
      <span className="room-decor__shelf" />
    </div>
  );
}
