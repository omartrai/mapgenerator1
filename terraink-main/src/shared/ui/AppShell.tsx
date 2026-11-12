import { lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from "react";
import { onCloseSettingsPanel, onOpenSettingsTab, revealAfterTabChange } from "@/shared/ui/settingsTabs";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import {
  MAX_MARKER_SIZE,
  MIN_MARKER_SIZE,
} from "@/features/markers/domain/constants";
import GeneralHeader from "@/shared/ui/GeneralHeader";
import DesktopNavBar from "@/shared/ui/DesktopNavBar";
import FooterNote from "@/shared/ui/FooterNote";
import PreviewPanel from "@/features/poster/ui/PreviewPanel";
import MobileNavBar, { type MobileTab } from "@/shared/ui/MobileNavBar";
import InstallPrompt from "@/features/install/ui/InstallPrompt";
import { useSwipeDown } from "@/shared/hooks/useSwipeDown";
import StartupLocationModal from "@/features/location/ui/StartupLocationModal";
import { CheckIcon } from "@/shared/ui/Icons";
import SupportModal from "@/features/export/ui/SupportModal";
import {
  SUPPORT_PROMPT_EVENT,
  type SupportPromptState,
} from "@/features/export/application/useExport";
import { useSessionAnalytics } from "@/features/export/application/useSessionAnalytics";
import {
  LEGAL_DOC_EVENT,
  type LegalDocDetail,
  type LegalDocType,
} from "@/features/legal/application/legalDoc";
import { useLanguage } from "@/shared/i18n/LanguageContext";

const LegalModal = lazy(() => import("@/features/legal/ui/LegalModal"));
const SettingsPanel = lazy(() => import("@/features/poster/ui/SettingsPanel"));
const AnnouncementModal = lazy(
  () => import("@/features/updates/ui/AnnouncementModal"),
);
const ExportFab = lazy(() => import("@/features/export/ui/ExportFab"));
const DesktopLocationBar = lazy(() => import("@/shared/ui/DesktopLocationBar"));

function SettingsDrawer({
  mobileTab,
  onClose,
  sizeSection,
  header,
  footer,
}: {
  mobileTab: MobileTab;
  onClose: () => void;
  sizeSection?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
}) {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const { sheetRef, handleRef, handleProps } = useSwipeDown(onClose, 80, {
    onExpand: () => setIsExpanded(true),
  });

  return (
    <div className="mobile-drawer" role="dialog" aria-label={t("mobile.settings")}>
      <div
        className="mobile-drawer-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`mobile-drawer-sheet${isExpanded ? " is-expanded" : ""}`}
        ref={sheetRef}
        data-mobile-tab={mobileTab}
      >
        <div
          className="mobile-drawer-handle"
          ref={handleRef}
          aria-hidden="true"
          {...handleProps}
        />
        <div className="mobile-drawer-content">
          <SettingsPanel mobileTab={mobileTab} sizeSection={sizeSection} header={header} footer={footer} />
        </div>
      </div>
    </div>
  );
}

export interface AppShellSlots {
  /** Replaces the default product header. */
  header?: ReactNode;
  /** Replaces the floating download button (e.g. purchase controls). */
  actionArea?: (context: { isMobile: boolean }) => ReactNode;
  /** Replaces the "current settings" card next to the poster on desktop. */
  sidePanel?: ReactNode;
  /** Rendered under the poster preview. */
  belowPoster?: ReactNode;
  /** Product size picker rendered as the "size" tab. */
  sizeSection?: ReactNode;
  /** Step guidance above the settings, given the active tab and a setter. */
  panelHeader?: (tab: MobileTab, setTab: (tab: MobileTab) => void) => ReactNode;
  /** Shown under the settings of the open tab (e.g. step navigation). */
  panelFooter?: (tab: MobileTab, setTab: (tab: MobileTab) => void) => ReactNode;
  /** Whether to open the "where is your place?" dialog on mount. */
  showStartupModal?: boolean;
  initialTab?: MobileTab;
  /** Extra attributes for styling (e.g. frame colour, scene). */
  dataAttributes?: Record<string, string>;
  /** Inline CSS variables for styling (e.g. the poster's real size in cm). */
  style?: React.CSSProperties;
  /** Desktop: the "Location" rail button opens a settings tab instead of the floating search bar. */
  locationAsTab?: boolean;
  /** Extra content such as modals. */
  children?: ReactNode;
}

export default function AppShell({
  header,
  actionArea,
  sidePanel,
  belowPoster,
  sizeSection,
  panelHeader,
  panelFooter,
  showStartupModal = true,
  initialTab = "theme",
  dataAttributes,
  style,
  locationAsTab = false,
  children,
}: AppShellSlots = {}) {
  const { t } = useLanguage();
  const { state, dispatch } = usePosterContext();

  // Fire once-per-session analytics on load (app_open).
  useSessionAnalytics();
  const { isMarkerEditorActive } = state;
  const activeMarker =
    state.activeMarkerId !== null
      ? state.markers.find((marker) => marker.id === state.activeMarkerId) ?? null
      : null;

  // Mobile state
  const [mobileTab, setMobileTab] = useState<MobileTab>(initialTab);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileLocationRowVisible, setMobileLocationRowVisible] =
    useState(initialTab === "location");
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  // Desktop state
  const [desktopTab, setDesktopTab] = useState<MobileTab>(
    initialTab === "location" && !locationAsTab ? "theme" : initialTab,
  );
  const [desktopPanelOpen, setDesktopPanelOpen] = useState(true);
  const [desktopLocationRowVisible, setDesktopLocationRowVisible] =
    useState(!locationAsTab);
  const [supportPrompt, setSupportPrompt] = useState<SupportPromptState | null>(null);
  const [legalDoc, setLegalDoc] = useState<LegalDocType | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      setSupportPrompt((e as CustomEvent<SupportPromptState>).detail);
    };
    window.addEventListener(SUPPORT_PROMPT_EVENT, handler);
    return () => window.removeEventListener(SUPPORT_PROMPT_EVENT, handler);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      setLegalDoc((e as CustomEvent<LegalDocDetail>).detail.doc);
    };
    window.addEventListener(LEGAL_DOC_EVENT, handler);
    return () => window.removeEventListener(LEGAL_DOC_EVENT, handler);
  }, []);

  useEffect(() => {
    const preload = () => {
      void import("@/features/poster/ui/SettingsPanel");
      void import("@/shared/ui/DesktopLocationBar");
      void import("@/features/export/ui/ExportFab");
      void import("@/features/updates/ui/AnnouncementModal");
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(preload, { timeout: 2000 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timer = setTimeout(preload, 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(
      "(max-width: 768px), (hover: none) and (pointer: coarse)",
    );
    const syncViewport = () => setIsMobileViewport(mediaQuery.matches);
    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);

    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);

  useEffect(() => {
    if (!mobileDrawerOpen) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverscroll = document.body.style.overscrollBehavior;
    const previousHtmlOverscroll = document.documentElement.style.overscrollBehavior;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    document.documentElement.style.overscrollBehavior = "none";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overscrollBehavior = previousBodyOverscroll;
      document.documentElement.style.overscrollBehavior = previousHtmlOverscroll;
    };
  }, [mobileDrawerOpen]);

  const handleMobileTabChange = (tab: MobileTab) => {
    if (tab === "location") {
      setMobileLocationRowVisible((isVisible) => !isVisible);
      setMobileDrawerOpen(false);
      return;
    }

    if (tab === mobileTab && mobileDrawerOpen) {
      setMobileDrawerOpen(false);
    } else {
      setMobileTab(tab);
      setMobileDrawerOpen(true);
    }
  };

  // Tabs chosen from inside the drawer (step buttons); on mobile the
  // location search lives in its own row above the poster.
  const setMobileTabFromPanel = (tab: MobileTab) => {
    if (tab === "location") {
      setMobileDrawerOpen(false);
      setMobileLocationRowVisible(true);
      return;
    }
    setMobileTab(tab);
  };

  const handleDesktopTabChange = (tab: MobileTab) => {
    setDesktopTab(tab);
    setDesktopPanelOpen(true);
  };

  // Step buttons can ask to close the mobile drawer (e.g. "Order").
  useEffect(() => onCloseSettingsPanel(() => setMobileDrawerOpen(false)), []);

  // Other panels can ask for a tab (e.g. Routes → "Edit the texts").
  useEffect(
    () =>
      onOpenSettingsTab(({ tab, focus }) => {
        const next = tab as MobileTab;
        setDesktopTab(next);
        setDesktopPanelOpen(true);
        setMobileTab(next);
        if (isMobileViewport) setMobileDrawerOpen(true);
        revealAfterTabChange(focus);
      }),
    [isMobileViewport],
  );

  const handleMobileMarkerSizeChange = useCallback(
    (nextSize: number) => {
      if (!activeMarker) {
        return;
      }
      const clampedSize = Math.max(
        MIN_MARKER_SIZE,
        Math.min(MAX_MARKER_SIZE, Math.round(nextSize)),
      );
      dispatch({
        type: "UPDATE_MARKER",
        markerId: activeMarker.id,
        changes: { size: clampedSize },
      });
    },
    [activeMarker, dispatch],
  );

  return (
    <div
      className="app-shell"
      data-od-id="maploom-editor"
      data-mobile-tab={mobileTab}
      data-desktop-tab={desktopTab}
      style={style}
      {...dataAttributes}
    >
      {header ?? <GeneralHeader />}
      <InstallPrompt />
      {showStartupModal ? <StartupLocationModal /> : null}

      <DesktopNavBar
        activeTab={desktopTab}
        panelOpen={desktopPanelOpen}
        onTabChange={handleDesktopTabChange}
        isLocationVisible={
          locationAsTab
            ? desktopPanelOpen && desktopTab === "location"
            : desktopLocationRowVisible
        }
        onLocationToggle={() =>
          locationAsTab
            ? handleDesktopTabChange("location")
            : setDesktopLocationRowVisible((isVisible) => !isVisible)
        }
      />

      <div
        className={`desktop-location-row-wrap${desktopLocationRowVisible ? "" : " is-hidden"}`}
      >
        <Suspense fallback={null}>
          <DesktopLocationBar />
        </Suspense>
      </div>

      <div
        className={`mobile-location-row-wrap${mobileLocationRowVisible ? "" : " is-hidden"}`}
      >
        <Suspense fallback={null}>
          <DesktopLocationBar />
        </Suspense>
      </div>
      {isMobileViewport && isMarkerEditorActive && activeMarker ? (
        <div
          className="mobile-marker-size-bar"
          role="group"
          aria-label={t("mobile.markerSize")}
        >
          <p className="mobile-marker-size-bar__label">{t("mobile.markerSize")}</p>
          <div className="mobile-marker-size-bar__controls">
            <input
              type="range"
              className="mobile-marker-size-bar__slider map-control-slider"
              min={MIN_MARKER_SIZE}
              max={MAX_MARKER_SIZE}
              step={1}
              value={Math.round(activeMarker.size)}
              onChange={(event) =>
                handleMobileMarkerSizeChange(Number(event.target.value))
              }
            />
            <span className="mobile-marker-size-bar__value">
              {Math.round(activeMarker.size)}px
            </span>
          </div>
        </div>
      ) : null}

      <div className="desktop-left-panel" data-od-id="editor-settings-panel">
        <div
          className={`desktop-settings-slide${desktopPanelOpen ? " is-open" : ""}`}
        >
          <Suspense fallback={null}>
            <SettingsPanel
              sizeSection={sizeSection}
              header={panelHeader?.(desktopTab, handleDesktopTabChange)}
              footer={panelFooter?.(desktopTab, handleDesktopTabChange)}
            />
          </Suspense>
        </div>
      </div>

      <PreviewPanel sidePanel={sidePanel} belowPoster={belowPoster} />

      {mobileDrawerOpen ? (
        <SettingsDrawer
          mobileTab={mobileTab}
          onClose={() => setMobileDrawerOpen(false)}
          sizeSection={sizeSection}
          header={panelHeader?.(mobileTab, setMobileTabFromPanel)}
          footer={panelFooter?.(mobileTab, setMobileTabFromPanel)}
        />
      ) : null}

      {isMobileViewport && isMarkerEditorActive ? (
        <button
          type="button"
          className="mobile-marker-edit-done"
          onClick={() => {
            dispatch({ type: "SET_MARKER_EDITOR_ACTIVE", active: false });
            dispatch({ type: "SET_ACTIVE_MARKER", markerId: null });
            setMobileDrawerOpen(false);
          }}
        >
          <CheckIcon />
          <span>{t("mobile.doneEditing")}</span>
        </button>
      ) : null}

      <MobileNavBar
        activeTab={mobileTab}
        drawerOpen={mobileDrawerOpen}
        isLocationVisible={mobileLocationRowVisible}
        onTabChange={handleMobileTabChange}
      />
      {actionArea ? (
        actionArea({ isMobile: isMobileViewport })
      ) : (
        <Suspense fallback={null}>
          <ExportFab isMobile={isMobileViewport} />
        </Suspense>
      )}

      <FooterNote />
      <Suspense fallback={null}>
        <AnnouncementModal />
      </Suspense>
      {supportPrompt ? (
        <SupportModal
          posterNumber={supportPrompt.posterNumber}
          onClose={() => setSupportPrompt(null)}
        />
      ) : null}
      {legalDoc ? (
        <Suspense fallback={null}>
          <LegalModal doc={legalDoc} onClose={() => setLegalDoc(null)} />
        </Suspense>
      ) : null}
      {children}
    </div>
  );
}
