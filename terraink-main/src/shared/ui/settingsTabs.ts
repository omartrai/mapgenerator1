/**
 * Lets any panel ask the studio shell to open another settings tab (e.g.
 * the Routes panel's "Edit the texts" button opening the Text tab), and
 * optionally scroll to an element in it.
 */
const EVENT = "noria:open-settings-tab";

export interface OpenTabRequest {
  tab: string;
  /** CSS selector to scroll into view once the tab is shown. */
  focus?: string;
}

export function openSettingsTab(request: OpenTabRequest): void {
  window.dispatchEvent(new CustomEvent<OpenTabRequest>(EVENT, { detail: request }));
}

export function onOpenSettingsTab(handler: (request: OpenTabRequest) => void): () => void {
  const listener = (event: Event) => handler((event as CustomEvent<OpenTabRequest>).detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}

/**
 * Scrolls the requested element into view once the tab has rendered. The
 * studio keeps a desktop and a mobile copy of each panel, so it picks the
 * visible one, retrying briefly while a drawer animates open.
 */
export function revealAfterTabChange(selector: string | undefined): void {
  if (!selector) return;
  let tries = 0;
  const attempt = () => {
    const element = [...document.querySelectorAll<HTMLElement>(selector)].find(
      (candidate) => candidate.getClientRects().length > 0 && candidate.offsetParent !== null,
    );
    if (!element) {
      if (tries++ < 10) window.setTimeout(attempt, 80);
      return;
    }
    element.scrollIntoView({ behavior: "smooth", block: "start" });
    element.querySelector<HTMLElement>("input, textarea")?.focus({ preventScroll: true });
  };
  window.setTimeout(attempt, 120);
}
