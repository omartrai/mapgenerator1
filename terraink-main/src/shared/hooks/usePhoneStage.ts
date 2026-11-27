import { useEffect, type RefObject } from "react";

/**
 * Phones: measures the room between the top of the poster stage and the
 * price bar (or tab bar) and sets it on the shell as --stage-free, so the
 * poster can be sized to stay whole on screen whatever sits above it (the
 * place bar, the sky's date and time, the sport route card…).
 */
export function usePhoneStage(shellRef: RefObject<HTMLElement | null>, enabled: boolean): void {
  useEffect(() => {
    const shell = shellRef.current;
    if (!enabled || !shell) return;

    let frame = 0;
    const measure = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const stage = shell.querySelector<HTMLElement>(".preview-panel .poster-viewport");
        const floor =
          document.querySelector<HTMLElement>(".studio-buy-bar") ??
          document.querySelector<HTMLElement>(".mobile-nav-wrapper");
        if (!stage || !floor) return;
        const top = stage.getBoundingClientRect().top + window.scrollY;
        const bottom = floor.getBoundingClientRect().top;
        const free = Math.round(bottom - top);
        if (free > 0) shell.style.setProperty("--stage-free", `${free}px`);
      });
    };

    measure();
    // Whatever sits above the stage can change height (poster type, sky
    // date, route card): watch the shell's children and the window.
    const observer = new ResizeObserver(measure);
    for (const child of Array.from(shell.children)) observer.observe(child);
    window.addEventListener("resize", measure);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", measure);
      shell.style.removeProperty("--stage-free");
    };
  }, [enabled, shellRef]);
}
