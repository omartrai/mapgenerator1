import type { MobileTab } from "@/shared/ui/MobileNavBar";
import { useStoreText, type StoreTextKey } from "./storeText";
import { MAIN_STEPS } from "./StudioStepFooter";

const SECTIONS: MobileTab[] = ["location", "theme", "style", "size", "layers", "markers", "routes"];

interface StudioStepHeaderProps {
  tab: MobileTab;
  setTab: (tab: MobileTab) => void;
}

/** Panel heading: the page title, then the name and hint of the open section. */
export default function StudioStepHeader({ tab }: StudioStepHeaderProps) {
  const { t } = useStoreText();
  const known = SECTIONS.includes(tab);
  const step = MAIN_STEPS.indexOf(tab);

  // One heading per panel: the page name as a small eyebrow, then the
  // open section's name and what to do there.
  return (
    <div className="studio-step">
      <p className="studio-step__eyebrow">
        {step >= 0 ? t("steps.count", { n: step + 1, total: MAIN_STEPS.length }) : known ? t("steps.extras") : t("studio.title")}
      </p>
      <h2 className="studio-step__title">
        {known ? t(`steps.${tab}.title` as StoreTextKey) : t("studio.title")}
      </h2>
      <p className="studio-step__hint">
        {known ? t(`steps.${tab}.hint` as StoreTextKey) : t("studio.subtitle")}
      </p>
    </div>
  );
}
