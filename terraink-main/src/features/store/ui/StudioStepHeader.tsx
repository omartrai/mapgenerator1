import type { MobileTab } from "@/shared/ui/MobileNavBar";
import { useStoreText, type StoreTextKey } from "./storeText";

const SECTIONS: MobileTab[] = ["location", "theme", "style", "size", "layers", "markers", "routes"];

interface StudioStepHeaderProps {
  tab: MobileTab;
  setTab: (tab: MobileTab) => void;
}

/** Panel heading: the page title, then the name and hint of the open section. */
export default function StudioStepHeader({ tab }: StudioStepHeaderProps) {
  const { t } = useStoreText();
  const known = SECTIONS.includes(tab);

  return (
    <div className="studio-step">
      <h2 className="studio-step__title">{t("studio.title")}</h2>
      <p className="studio-step__hint">{t("studio.subtitle")}</p>
      {known ? (
        <div className="studio-step__section">
          <h3>{t(`steps.${tab}.title` as StoreTextKey)}</h3>
          <p>{t(`steps.${tab}.hint` as StoreTextKey)}</p>
        </div>
      ) : null}
    </div>
  );
}
