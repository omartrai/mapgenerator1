import { LuArrowLeft, LuArrowRight, LuShoppingCart } from "react-icons/lu";
import type { MobileTab } from "@/shared/ui/MobileNavBar";
import { closeSettingsPanel } from "@/shared/ui/settingsTabs";
import { useLanguage, type TranslationKey } from "@/shared/i18n/LanguageContext";
import { useStoreText } from "./storeText";

/** The four steps every poster goes through; the other tabs are options. */
export const MAIN_STEPS: MobileTab[] = ["location", "theme", "style", "size"];

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
  const index = MAIN_STEPS.indexOf(tab);
  // Short tab names (Lieu, Thème, Texte…) keep the button on one line.
  const title = (step: MobileTab) => tNav(`nav.${step}` as TranslationKey);

  if (index === -1) {
    // Optional tabs (map details, icons, routes): one way back to the flow.
    return (
      <div className="studio-steps-nav">
        <button type="button" className="studio-steps-nav__next" onClick={() => setTab("size")}>
          {t("steps.optionalDone")} <LuArrowRight className="rtl-flip" aria-hidden="true" />
        </button>
      </div>
    );
  }

  const previous = index > 0 ? MAIN_STEPS[index - 1] : null;
  const next = index < MAIN_STEPS.length - 1 ? MAIN_STEPS[index + 1] : null;

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
