import { LuArrowLeft, LuArrowRight } from "react-icons/lu";
import type { MobileTab } from "@/shared/ui/MobileNavBar";
import { useStoreText, type StoreTextKey } from "./storeText";

const STEPS: MobileTab[] = ["location", "theme", "style", "size"];
const EXTRAS: MobileTab[] = ["layers", "markers", "routes"];

interface StudioStepHeaderProps {
  tab: MobileTab;
  setTab: (tab: MobileTab) => void;
}

export default function StudioStepHeader({ tab, setTab }: StudioStepHeaderProps) {
  const { t } = useStoreText();
  const title = (step: MobileTab) => t(`steps.${step}.title` as StoreTextKey);
  const hint = (step: MobileTab) => t(`steps.${step}.hint` as StoreTextKey);
  const index = STEPS.indexOf(tab);

  if (index === -1) {
    const isExtra = EXTRAS.includes(tab);
    return (
      <div className="studio-step studio-step--extra">
        <div className="studio-step__meta">
          <span className="studio-step__count">{t("steps.extras")}</span>
          <button type="button" className="studio-step__link" onClick={() => setTab("size")}>
            {t("steps.backToSize")}
          </button>
        </div>
        <h2 className="studio-step__title">{isExtra ? title(tab) : t("steps.extras")}</h2>
        {isExtra ? <p className="studio-step__hint">{hint(tab)}</p> : null}
      </div>
    );
  }

  const step = STEPS[index];
  const previous = STEPS[index - 1];
  const next = STEPS[index + 1];

  return (
    <div className="studio-step">
      <ol className="studio-step__progress" aria-label={t("steps.label")}>
        {STEPS.map((entry, entryIndex) => (
          <li key={entry}>
            <button
              type="button"
              className={`studio-step__dot${entryIndex === index ? " is-current" : ""}${entryIndex < index ? " is-done" : ""}`}
              onClick={() => setTab(entry)}
              aria-current={entryIndex === index ? "step" : undefined}
              aria-label={t("steps.stepLabel", { n: entryIndex + 1, title: title(entry) })}
            />
          </li>
        ))}
      </ol>
      <div className="studio-step__meta">
        <span className="studio-step__count">
          {t("steps.count", { n: index + 1, total: STEPS.length })}
        </span>
      </div>
      <h2 className="studio-step__title">{title(step)}</h2>
      <p className="studio-step__hint">{hint(step)}</p>
      <div className="studio-step__nav">
        {previous ? (
          <button type="button" className="store-btn store-btn--ghost store-btn--sm" onClick={() => setTab(previous)}>
            <LuArrowLeft className="rtl-flip" aria-hidden="true" /> {title(previous)}
          </button>
        ) : (
          <span />
        )}
        {next ? (
          <button type="button" className="store-btn store-btn--dark store-btn--sm" onClick={() => setTab(next)}>
            {t("steps.next", { title: title(next) })} <LuArrowRight className="rtl-flip" aria-hidden="true" />
          </button>
        ) : (
          <span className="studio-step__done">{t("steps.done")}</span>
        )}
      </div>
    </div>
  );
}
