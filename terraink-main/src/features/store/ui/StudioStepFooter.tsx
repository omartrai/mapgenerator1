import { LuArrowLeft, LuArrowRight, LuShoppingCart } from "react-icons/lu";
import type { MobileTab } from "@/shared/ui/MobileNavBar";
import { closeSettingsPanel } from "@/shared/ui/settingsTabs";
import { useLanguage, type TranslationKey } from "@/shared/i18n/LanguageContext";
import { useStoreText } from "./storeText";
import { useDesktopStudio } from "./useDesktopStudio";

/** The steps every poster goes through on a phone; the other tabs are options. */
export const MAIN_STEPS: MobileTab[] = ["location", "theme", "style", "size"];
/** On desktop, size & frame are chosen in the buy panel next to the price. */
export const DESKTOP_STEPS: MobileTab[] = ["location", "theme", "style"];

export function useMainSteps(): MobileTab[] {
  return useDesktopStudio() ? DESKTOP_STEPS : MAIN_STEPS;
}

/** Points the customer at the add-to-cart button (desktop box or mobile bar). */
function nudgeCheckout() {
  closeSettingsPanel();
  window.setTimeout(() => {
    const button = [...document.querySelectorAll<HTMLElement>(".studio-buy__cta, .studio-buy-bar__cta")].find(
      (candidate) => candidate.offsetParent !== null,
    );
    if (!button) return;
    button.scrollIntoView({ behavior: "smooth", block: "center" });
    button.classList.remove("is-nudged");
    void button.offsetWidth; // restart the animation
    button.classList.add("is-nudged");
    button.focus({ preventScroll: true });
  }, 150);
}

/** Back / next buttons under each studio tab, so the flow is obvious. */
export default function StudioStepFooter({
  tab,
  setTab,
}: {
  tab: MobileTab;
  setTab: (tab: MobileTab) => void;
}) {
  const { t } = useStoreText();
  const { t: tNav } = useLanguage();
  const steps = useMainSteps();
  const index = steps.indexOf(tab);
  // Short tab names (Lieu, Thème, Texte…) keep the button on one line.
  const title = (step: MobileTab) => tNav(`nav.${step}` as TranslationKey);

  if (index === -1) {
    // Optional tabs (map details, icons, routes): one way back to the flow.
    return (
      <div className="studio-steps-nav">
        <button type="button" className="studio-steps-nav__next" onClick={() => setTab(steps[steps.length - 1])}>
          {t("steps.optionalDone")} <LuArrowRight className="rtl-flip" aria-hidden="true" />
        </button>
      </div>
    );
  }

  const previous = index > 0 ? steps[index - 1] : null;
  const next = index < steps.length - 1 ? steps[index + 1] : null;

  return (
    <div className="studio-steps-nav">
      {previous ? (
        <button
          type="button"
          className="studio-steps-nav__back is-icon"
          onClick={() => setTab(previous)}
          aria-label={t("steps.prev")}
          title={t("steps.prev")}
        >
          <LuArrowLeft className="rtl-flip" aria-hidden="true" />
        </button>
      ) : null}
      {next ? (
        <button type="button" className="studio-steps-nav__next" onClick={() => setTab(next)}>
          {t("steps.next", { title: title(next) })} <LuArrowRight className="rtl-flip" aria-hidden="true" />
        </button>
      ) : (
        <button type="button" className="studio-steps-nav__next is-order" onClick={nudgeCheckout}>
          <LuShoppingCart aria-hidden="true" /> {t("steps.order")}
        </button>
      )}
    </div>
  );
}
