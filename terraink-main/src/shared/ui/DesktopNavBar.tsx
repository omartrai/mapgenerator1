import { Fragment, useEffect, useState } from "react";
import {
  LocationIcon,
  LayoutIcon,
  ThemeIcon,
  LayersIcon,
  MarkersIcon,
  AdvancedIcon,
  StyleIcon,
} from "./Icons";
import type { MobileTab } from "./MobileNavBar";
import { useLanguage, type TranslationKey } from "@/shared/i18n/LanguageContext";

const tabs: {
  id: MobileTab;
  labelKey: TranslationKey;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "theme", labelKey: "nav.theme", Icon: ThemeIcon },
  { id: "style", labelKey: "nav.style", Icon: StyleIcon },
  { id: "layers", labelKey: "nav.layers", Icon: LayersIcon },
  { id: "size", labelKey: "nav.size", Icon: LayoutIcon },
  { id: "markers", labelKey: "nav.icons", Icon: MarkersIcon },
  { id: "advanced", labelKey: "nav.advanced", Icon: AdvancedIcon },
];

/** Extra rail buttons that switch the poster type (sport, trail). */
export interface RailKind {
  id: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onSelect: () => void;
}

/** Steps 2–3 (step 1 is the place); size & frame are in the buy panel. */
const MAIN_STEPS: MobileTab[] = ["theme", "style", "size"];
/** Same as the store's wide-studio breakpoint: size & frame then live in the buy panel. */
const WIDE_QUERY = "(min-width: 1000px) and (hover: hover) and (pointer: fine)";

function useWide(): boolean {
  const [wide, setWide] = useState(() => typeof window !== "undefined" && window.matchMedia(WIDE_QUERY).matches);
  useEffect(() => {
    const media = window.matchMedia(WIDE_QUERY);
    const sync = () => setWide(media.matches);
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  return wide;
}
const FIRST_EXTRA: MobileTab = "layers";

interface DesktopNavBarProps {
  kinds?: RailKind[];
  /** Caption over the poster type group. */
  kindsLabel?: string;
  /** The first step's name and icon (Lieu, or Parcours on a sport poster). */
  locationLabel?: string;
  LocationStepIcon?: React.ComponentType<{ className?: string }>;
  activeTab: MobileTab;
  panelOpen: boolean;
  onTabChange: (tab: MobileTab) => void;
  isLocationVisible: boolean;
  onLocationToggle: () => void;
}

export default function DesktopNavBar({
  activeTab,
  panelOpen,
  onTabChange,
  isLocationVisible,
  onLocationToggle,
  kinds = [],
  kindsLabel,
  locationLabel,
  LocationStepIcon = LocationIcon,
}: DesktopNavBarProps) {
  const { t } = useLanguage();
  const wide = useWide();
  return (
    <nav
      className="desktop-nav-bar"
      aria-label={t("nav.settings")}
      data-od-id="editor-tool-rail"
    >
      {kinds.length ? (
        <div className="desktop-nav-kinds" role="radiogroup" aria-label={kindsLabel}>
          {kindsLabel ? <span className="desktop-nav-kinds__label">{kindsLabel}</span> : null}
          {kinds.map(({ id, label, Icon, active, onSelect }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              className={`desktop-nav-kind${active ? " is-active" : ""}`}
              onClick={onSelect}
              title={label}
            >
              <Icon className="desktop-nav-kind__icon" />
              <span className="desktop-nav-kind__label">{label}</span>
            </button>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        className={`btn btn-ghost desktop-nav-tab${isLocationVisible ? " is-active" : ""}`}
        onClick={onLocationToggle}
        title={isLocationVisible ? t("location.hide") : t("location.show")}
        aria-label={isLocationVisible ? t("location.hide") : t("location.show")}
        aria-pressed={isLocationVisible}
      >
        <span className="desktop-nav-step" aria-hidden="true">1</span>
        <LocationStepIcon className="desktop-nav-icon" />
        <span className="desktop-nav-label">{locationLabel ?? t("nav.location")}</span>
      </button>

      {tabs.filter(({ id }) => !(wide && id === "size")).map(({ id, labelKey, Icon }) => {
        const label = t(labelKey);
        // The four main steps are numbered; the rest are optional extras.
        const step = MAIN_STEPS.indexOf(id) + 2;
        return (
        <Fragment key={id}>
        {id === FIRST_EXTRA ? (
          <span className="desktop-nav-divider">{t("nav.extras")}</span>
        ) : null}
        <button
          type="button"
          className={`btn btn-ghost desktop-nav-tab desktop-nav-tab--${id}${panelOpen && activeTab === id ? " is-active" : ""}`}
          onClick={() => onTabChange(id)}
          title={label}
          aria-label={label}
          aria-current={panelOpen && activeTab === id ? "page" : undefined}
        >
          {step > 1 ? <span className="desktop-nav-step" aria-hidden="true">{step}</span> : null}
          <Icon className="desktop-nav-icon" />
          <span className="desktop-nav-label">{label}</span>
        </button>
        </Fragment>
        );
      })}
    </nav>
  );
}
