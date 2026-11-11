import {
  LocationIcon,
  ThemeIcon,
  LayoutIcon,
  LayersIcon,
  MarkersIcon,
  RouteIcon,
  StyleIcon,
} from "./Icons";
import { useLanguage, type TranslationKey } from "@/shared/i18n/LanguageContext";

export type MobileTab =
  | "location"
  | "theme"
  | "layout"
  | "style"
  | "layers"
  | "markers"
  | "routes";

const tabs: {
  id: MobileTab;
  labelKey: TranslationKey;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "location", labelKey: "nav.location", Icon: LocationIcon },
  { id: "theme", labelKey: "nav.theme", Icon: ThemeIcon },
  { id: "layout", labelKey: "nav.layout", Icon: LayoutIcon },
  { id: "style", labelKey: "nav.style", Icon: StyleIcon },
  { id: "layers", labelKey: "nav.layers", Icon: LayersIcon },
  { id: "markers", labelKey: "nav.icons", Icon: MarkersIcon },
  { id: "routes", labelKey: "nav.routes", Icon: RouteIcon },
];

interface MobileNavBarProps {
  activeTab: MobileTab;
  drawerOpen: boolean;
  isLocationVisible: boolean;
  onTabChange: (tab: MobileTab) => void;
}

export default function MobileNavBar({
  activeTab,
  drawerOpen,
  isLocationVisible,
  onTabChange,
}: MobileNavBarProps) {
  const { t } = useLanguage();
  return (
    <div className="mobile-nav-wrapper">
      <nav className="mobile-nav" aria-label={t("nav.mobile")}>
        <div className="mobile-nav-scroll-container">
          <div className="mobile-nav-tabs">
            {tabs.map(({ id, labelKey, Icon }) => {
              const label = t(labelKey);
              const isLocationTab = id === "location";
              const isActive = isLocationTab
                ? isLocationVisible
                : activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  className={`mobile-nav-tab${isActive ? " is-active" : ""}`}
                  onClick={() => onTabChange(id)}
                  aria-current={!isLocationTab && activeTab === id ? "page" : undefined}
                  aria-pressed={isLocationTab ? isLocationVisible : undefined}
                >
                  <Icon className="mobile-nav-icon" />
                  <span className="mobile-nav-label">{label}</span>
                </button>
              );
            })}
          </div>
          <div className="mobile-nav-fade" aria-hidden="true" />
        </div>
      </nav>
    </div>
  );
}
