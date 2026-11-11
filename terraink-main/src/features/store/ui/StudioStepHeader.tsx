import { LuArrowLeft, LuArrowRight } from "react-icons/lu";
import type { MobileTab } from "@/shared/ui/MobileNavBar";

const STEPS: { tab: MobileTab; title: string; hint: string }[] = [
  { tab: "location", title: "Find your place", hint: "Search for a city, an address or the spot where something happened." },
  { tab: "theme", title: "Choose a style", hint: "Pick a colour palette. Fine-tune any colour with the pencil button." },
  { tab: "style", title: "Make it personal", hint: "Edit the title and subtitle, and choose a typeface." },
  { tab: "size", title: "Size & frame", hint: "Pick the print size and a frame. Your preview updates instantly." },
];

const EXTRAS: Partial<Record<MobileTab, { title: string; hint: string }>> = {
  layers: { title: "Map details", hint: "Optional. Show or hide buildings, parks, water and road types." },
  markers: { title: "Add a marker", hint: "Optional. Pin your home, a first date or a favourite café." },
  routes: { title: "Add a route", hint: "Optional. Upload a GPX file of a run, ride or road trip." },
};

interface StudioStepHeaderProps {
  tab: MobileTab;
  setTab: (tab: MobileTab) => void;
}

export default function StudioStepHeader({ tab, setTab }: StudioStepHeaderProps) {
  const index = STEPS.findIndex((step) => step.tab === tab);

  if (index === -1) {
    const extra = EXTRAS[tab];
    return (
      <div className="studio-step studio-step--extra">
        <div className="studio-step__meta">
          <span className="studio-step__count">Extras</span>
          <button type="button" className="studio-step__link" onClick={() => setTab("size")}>
            Back to size &amp; frame
          </button>
        </div>
        <h2 className="studio-step__title">{extra?.title ?? "Extras"}</h2>
        <p className="studio-step__hint">{extra?.hint}</p>
      </div>
    );
  }

  const step = STEPS[index];
  const previous = STEPS[index - 1];
  const next = STEPS[index + 1];

  return (
    <div className="studio-step">
      <ol className="studio-step__progress" aria-label="Design steps">
        {STEPS.map((entry, entryIndex) => (
          <li key={entry.tab}>
            <button
              type="button"
              className={`studio-step__dot${entryIndex === index ? " is-current" : ""}${entryIndex < index ? " is-done" : ""}`}
              onClick={() => setTab(entry.tab)}
              aria-current={entryIndex === index ? "step" : undefined}
              aria-label={`Step ${entryIndex + 1}: ${entry.title}`}
            />
          </li>
        ))}
      </ol>
      <div className="studio-step__meta">
        <span className="studio-step__count">
          Step {index + 1} of {STEPS.length}
        </span>
      </div>
      <h2 className="studio-step__title">{step.title}</h2>
      <p className="studio-step__hint">{step.hint}</p>
      <div className="studio-step__nav">
        {previous ? (
          <button type="button" className="store-btn store-btn--ghost store-btn--sm" onClick={() => setTab(previous.tab)}>
            <LuArrowLeft aria-hidden="true" /> {previous.title}
          </button>
        ) : (
          <span />
        )}
        {next ? (
          <button type="button" className="store-btn store-btn--dark store-btn--sm" onClick={() => setTab(next.tab)}>
            Next: {next.title} <LuArrowRight aria-hidden="true" />
          </button>
        ) : (
          <span className="studio-step__done">Looks good? Add it to your cart.</span>
        )}
      </div>
    </div>
  );
}
