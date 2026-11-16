import { useEffect, useState } from "react";

/** Same breakpoint as the desktop studio layout (side rail + buy panel). */
const QUERY = "(min-width: 769px) and (hover: hover) and (pointer: fine)";

/** True when the studio shows the desktop layout, where size & frame live in the buy panel. */
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
