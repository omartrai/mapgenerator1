import { useEffect, useState } from "react";

/** Wide enough for the 4-column studio, where size & frame live in the buy panel. */
export const WIDE_STUDIO_QUERY = "(min-width: 1000px) and (hover: hover) and (pointer: fine)";
const QUERY = WIDE_STUDIO_QUERY;

/** True when size & frame are chosen in the buy panel (wide desktop). */
export function useDesktopStudio(): boolean {
  const [matches, setMatches] = useState(() => typeof window !== "undefined" && window.matchMedia(QUERY).matches);
  useEffect(() => {
    const media = window.matchMedia(QUERY);
    const sync = () => setMatches(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  return matches;
}
