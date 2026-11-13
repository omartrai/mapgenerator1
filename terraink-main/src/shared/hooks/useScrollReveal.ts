import { useEffect } from "react";

/**
 * Blocks that rise into view as the page scrolls. Matching elements get
 * `data-reveal` (hidden, slightly lower) and then `data-reveal="in"` once
 * they enter the viewport. Siblings of one row are staggered. Elements
 * added later (catalogue loading in) are picked up too. Nothing is hidden
 * without JavaScript, and nothing moves with reduced motion.
 */
const SELECTOR = [
  ".row-head",
  ".home-heading",
  ".shop-card",
  ".line-card",
  ".collection-card:not(.is-skeleton)",
  ".faq__item",
  ".track-band",
  ".reviews__empty",
  ".review-card",
  ".store-footer__inner",
  ".page-head",
  ".cart-line",
  ".summary-card",
  ".track-form",
  ".track-result",
  ".empty-state",
].join(",");

const STAGGER_MS = 70;
const MAX_STAGGER = 6;

export function useScrollReveal(routeKey: string): void {
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    // The editor is a full-screen tool; it keeps still.
    if (routeKey === "/create") return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const element = entry.target as HTMLElement;
          element.dataset.reveal = "in";
          observer.unobserve(element);
          const delay = parseFloat(element.style.getPropertyValue("--reveal-delay")) || 0;
          window.setTimeout(() => {
            element.dataset.reveal = "done";
            element.style.removeProperty("--reveal-delay");
          }, delay + 800);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );

    const prepare = () => {
      document.querySelectorAll<HTMLElement>(SELECTOR).forEach((element) => {
        if (element.dataset.reveal) return;
        const siblings = element.parentElement
          ? Array.from(element.parentElement.children).filter((child) => child.matches(SELECTOR))
          : [];
        const index = Math.min(siblings.indexOf(element), MAX_STAGGER);
        element.style.setProperty("--reveal-delay", `${Math.max(0, index) * STAGGER_MS}ms`);
        element.dataset.reveal = "";
        observer.observe(element);
      });
    };

    prepare();
    let frame = 0;
    const mutations = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(prepare);
    });
    mutations.observe(document.getElementById("root") ?? document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(frame);
      mutations.disconnect();
      observer.disconnect();
    };
  }, [routeKey]);
}
