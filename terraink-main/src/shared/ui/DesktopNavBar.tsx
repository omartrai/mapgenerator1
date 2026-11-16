import {
  LocationIcon,
  ThemeIcon,
  LayoutIcon,
  LayersIcon,
  MarkersIcon,
  RouteIcon,
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
  { id: "size", labelKey: "nav.size", Icon: LayoutIcon },
  { id: "layers", labelKey: "nav.layers", Icon: LayersIcon },
  { id: "markers", labelKey: "nav.icons", Icon: MarkersIcon },
  { id: "routes", labelKey: "nav.routes", Icon: RouteIcon },
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
        <LocationStepIcon className="desktop-nav-icon" />
        <span className="desktop-nav-label">{locationLabel ?? t("nav.location")}</span>
      </button>

      {tabs.map(({ id, labelKey, Icon }) => {
        const label = t(labelKey);
        return (
        <button
          key={id}
          type="button"
          className={`btn btn-ghost desktop-nav-tab desktop-nav-tab--${id}${panelOpen && activeTab === id ? " is-active" : ""}`}
          onClick={() => onTabChange(id)}
          title={label}
          aria-label={label}
          aria-current={panelOpen && activeTab === id ? "page" : undefined}
        >
          <Icon className="desktop-nav-icon" />
          <span className="desktop-nav-label">{label}</span>
        </button>
        );
      })}
    </nav>
  );
}
