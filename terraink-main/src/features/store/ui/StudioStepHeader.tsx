import type { MobileTab } from "@/shared/ui/MobileNavBar";
import { useStoreText, type StoreTextKey } from "./storeText";
import { MAIN_STEPS } from "./StudioStepFooter";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { isSkyPoster } from "@/features/sky/application/skyOptions";
import PosterTypeBar from "@/features/sky/ui/PosterTypeBar";
import { isSportLayout, isTrailLayout } from "@/features/poster/domain/posterLayout";

const SECTIONS: MobileTab[] = ["location", "theme", "style", "size", "layers", "markers", "routes", "advanced"];

interface StudioStepHeaderProps {
  tab: MobileTab;
  setTab: (tab: MobileTab) => void;
}

/** Panel heading: the page title, then the name and hint of the open section. */
export default function StudioStepHeader({ tab, setTab }: StudioStepHeaderProps) {
  const { t } = useStoreText();
  const known = SECTIONS.includes(tab);
  const step = MAIN_STEPS.indexOf(tab);
  const { state } = usePosterContext();
  // A night-sky poster asks for a place and a moment in the first step.
  const layout = state.form.posterLayout;
  const key =
    tab !== "location"
      ? tab
      : isSkyPoster(state.form)
        ? "locationSky"
        : isSportLayout(layout)
          ? "locationSport"
          : isTrailLayout(layout)
            ? "locationTrail"
            : tab;

  // One heading per panel: the page name as a small eyebrow, then the
  // open section's name and what to do there.
  return (
    <div className="studio-step">
      <PosterTypeBar onPick={(kind) => (kind === "sport" || kind === "trail" ? setTab("location") : undefined)} />
      <p className="studio-step__eyebrow">
        {step >= 0 ? t("steps.count", { n: step + 1, total: MAIN_STEPS.length }) : known ? t("steps.extras") : t("studio.title")}
      </p>
      <h2 className="studio-step__title">
        {known ? t(`steps.${key}.title` as StoreTextKey) : t("studio.title")}
      </h2>
      <p className="studio-step__hint">
        {known ? t(`steps.${key}.hint` as StoreTextKey) : t("studio.subtitle")}
      </p>
    </div>
  );
}
