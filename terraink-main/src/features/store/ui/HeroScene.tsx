import type { DesignPreset } from "../domain/presets";
import { resolveDimensions } from "../domain/catalog";
import FramedPoster from "./FramedPoster";
import { DecorPlant } from "./RoomDecor";

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

      <DecorPlant className="scene__plant" />

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
