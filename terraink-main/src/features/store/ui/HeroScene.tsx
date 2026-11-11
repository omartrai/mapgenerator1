import type { DesignPreset } from "../domain/presets";
import { resolveDimensions } from "../domain/catalog";
import FramedPoster from "./FramedPoster";

interface HeroSceneProps {
  posters: DesignPreset[];
  active: number;
  altFor: (preset: DesignPreset) => string;
}

/**
 * A drawn interior for the hero: a sunlit wall with an arch, a trailing
 * plant, a shelf with books and a mushroom lamp, a zellige vase and the
 * framed poster. The posters cross-fade as the slider moves.
 */
export default function HeroScene({ posters, active, altFor }: HeroSceneProps) {
  return (
    <div className="scene">
      <span className="scene__arch" aria-hidden="true" />
      <span className="scene__sun" aria-hidden="true" />

      <svg className="scene__plant" viewBox="0 0 220 420" preserveAspectRatio="xMidYMin meet" aria-hidden="true">
        <defs>
          <path id="scene-leaf" d="M0 0C9-13 30-15 40-3 30 9 12 13 0 0Z" />
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
            href="#scene-leaf"
            fill={String(fill)}
            transform={`translate(${x} ${y}) rotate(${rotate}) scale(${index % 3 === 0 ? 1.15 : 0.95})`}
          />
        ))}
      </svg>

      <div className="scene__poster">
        {posters.map((preset, index) => {
          const { widthCm, heightCm } = resolveDimensions(preset.product);
          return (
            <div
              key={preset.id}
              className={`scene__poster-slide${index === active ? " is-active" : ""}`}
              aria-hidden={index !== active}
            >
              <FramedPoster
                src={preset.image}
                alt={altFor(preset)}
                frameId="black"
                ratio={widthCm / heightCm}
                size="lg"
                loading={index === 0 ? "eager" : "lazy"}
              />
            </div>
          );
        })}
      </div>

      <div className="scene__lamp" aria-hidden="true">
        <span className="scene__lamp-shade" />
        <span className="scene__lamp-stem" />
        <span className="scene__book scene__book--top" />
        <span className="scene__book scene__book--bottom" />
      </div>

      <svg className="scene__vase" viewBox="0 0 140 230" aria-hidden="true">
        <defs>
          <pattern id="scene-zellige" width="28" height="28" patternUnits="userSpaceOnUse">
            <rect width="28" height="28" fill="#f3e6d2" />
            <path
              d="M14 3l3 7 7-3-3 7 7 3-7 3 3 7-7-3-3 7-3-7-7 3 3-7-7-3 7-3-3-7 7 3z"
              fill="#1f3a4a"
            />
            <circle cx="14" cy="14" r="2.6" fill="#c4572e" />
            <path d="M0 0h4v4H0zM24 0h4v4h-4zM0 24h4v4H0zM24 24h4v4h-4z" fill="#2c5a52" />
          </pattern>
          <linearGradient id="scene-vase-shade" x1="0" x2="1">
            <stop offset="0" stopColor="#000" stopOpacity="0.28" />
            <stop offset="0.45" stopColor="#000" stopOpacity="0" />
            <stop offset="0.8" stopColor="#fff" stopOpacity="0.12" />
            <stop offset="1" stopColor="#000" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <path
          d="M50 12h40v20c0 10 40 28 40 86 0 58-28 92-60 106-32-14-60-48-60-106 0-58 40-76 40-86z"
          fill="url(#scene-zellige)"
        />
        <path
          d="M50 12h40v20c0 10 40 28 40 86 0 58-28 92-60 106-32-14-60-48-60-106 0-58 40-76 40-86z"
          fill="url(#scene-vase-shade)"
        />
        <rect x="44" y="6" width="52" height="10" rx="3" fill="#1f3a4a" />
      </svg>

      <span className="scene__shelf" aria-hidden="true" />
    </div>
  );
}
