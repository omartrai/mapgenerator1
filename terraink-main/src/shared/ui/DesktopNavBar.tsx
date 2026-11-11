import {
  LocationIcon,
  ThemeIcon,
  LayoutIcon,
  LayersIcon,
  MarkersIcon,
  RouteIcon,
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
  { id: "layout", labelKey: "nav.layout", Icon: LayoutIcon },
  { id: "style", labelKey: "nav.style", Icon: StyleIcon },
  { id: "layers", labelKey: "nav.layers", Icon: LayersIcon },
  { id: "markers", labelKey: "nav.icons", Icon: MarkersIcon },
  { id: "routes", labelKey: "nav.routes", Icon: RouteIcon },
];

interface DesktopNavBarProps {
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
}: DesktopNavBarProps) {
  const { t } = useLanguage();
  return (
    <nav
      className="desktop-nav-bar"
      aria-label={t("nav.settings")}
      data-od-id="editor-tool-rail"
    >
      <button
        type="button"
        className={`btn btn-ghost desktop-nav-tab${isLocationVisible ? " is-active" : ""}`}
        onClick={onLocationToggle}
        title={isLocationVisible ? t("location.hide") : t("location.show")}
        aria-label={isLocationVisible ? t("location.hide") : t("location.show")}
        aria-pressed={isLocationVisible}
      >
        <LocationIcon className="desktop-nav-icon" />
        <span className="desktop-nav-label">{t("nav.location")}</span>
      </button>

      {tabs.map(({ id, labelKey, Icon }) => {
        const label = t(labelKey);
        return (
        <button
          key={id}
          type="button"
          className={`btn btn-ghost desktop-nav-tab${panelOpen && activeTab === id ? " is-active" : ""}`}
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
