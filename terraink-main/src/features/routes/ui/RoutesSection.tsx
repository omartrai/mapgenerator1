import { useCallback, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { LuChevronDown, LuEye, LuEyeOff, LuPencil, LuPlus, LuUpload } from "react-icons/lu";
import { createPortal } from "react-dom";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { useGpxUpload } from "@/features/routes/application/useGpxUpload";
import type {
  Route,
  RouteBounds,
  RouteEndpointMarker,
} from "@/features/routes/domain/types";
import {
  MAX_MARKER_SIZE,
  MIN_MARKER_SIZE,
} from "@/features/markers/domain/constants";
import { routeLengthMeters } from "@/features/routes/infrastructure/helpers";
import {
  ROUTE_LINE_STYLES,
  MAX_ROUTE_OPACITY,
  MAX_ROUTE_STROKE_WIDTH,
  MIN_ROUTE_OPACITY,
  MIN_ROUTE_STROKE_WIDTH,
} from "@/features/routes/domain/constants";
import ColorPicker from "@/features/theme/ui/ColorPicker";
import { buildDynamicColorChoices } from "@/features/theme/domain/colorSuggestions";
import {
  DISPLAY_PALETTE_KEYS,
  type ThemeColorKey,
} from "@/features/theme/domain/types";
import { getThemeColorByPath } from "@/features/theme/domain/colorPaths";
import { CheckIcon, CloseIcon, TrashIcon } from "@/shared/ui/Icons";
import MarkerVisual from "@/features/markers/ui/MarkerVisual";
import {
  createUploadedMarkerIcon,
  getUploadLabel,
  isSvgFile,
  readIconFileAsDataUrl,
} from "@/features/markers/infrastructure/helpers";
import {
  findMarkerIcon,
  predefinedMarkerIcons,
} from "@/features/markers/infrastructure/iconRegistry";
import { useLanguage } from "@/shared/i18n/LanguageContext";
import { useActivityPoster } from "@/features/routes/application/useActivityPoster";
import { openSettingsTab } from "@/shared/ui/settingsTabs";

type RouteEndpointKind = "start" | "finish";

interface EndpointPickerState {
  routeId: string;
  kind: RouteEndpointKind;
}

function formatRouteDistance(meters: number, comma = false): string {
  if (!Number.isFinite(meters) || meters <= 0) return "—";
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = meters / 1000;
  const text = km < 10 ? km.toFixed(2) : km.toFixed(1);
  return `${comma ? text.replace(".", ",") : text} km`;
}

/** Sporty accents plus the theme's own colours, current colour first. */
const ACCENT_COLORS = ["#e8622c", "#e23b3b", "#f2b705", "#2f9e6e", "#2d7fd3", "#111111", "#ffffff"];
function quickColors(current: string, suggested: string[]): string[] {
  const seen = new Set<string>();
  return [current, ...ACCENT_COLORS, ...suggested]
    .filter((color) => {
      const key = String(color || "").toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 8);
}

interface PendingConfirmation {
  pendingRoute: Route;
  newBounds: RouteBounds;
}

function RouteBoundsWarningModal({
  onCancel,
  onContinue,
  onReplace,
}: {
  onCancel: () => void;
  onContinue: () => void;
  onReplace: () => void;
}) {
  const { t } = useLanguage();
  return createPortal(
    <div
      className="picker-modal-backdrop"
      role="presentation"
      onClick={onCancel}
    >
      <div
        className="picker-modal marker-delete-confirm-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="route-bounds-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="marker-delete-modal__body">
          <p
            className="marker-delete-modal__headline"
            id="route-bounds-modal-title"
          >
            {t("routes.boundsTitle")}
          </p>
          <p className="marker-delete-modal__text">
            {t("routes.boundsMessage")}
          </p>
          <div className="marker-delete-modal__actions">
            <button
              type="button"
              className="marker-delete-modal__cancel"
              onClick={onCancel}
            >
              {t("routes.cancel")}
            </button>
            <button
              type="button"
              className="marker-delete-modal__cancel"
              onClick={onReplace}
            >
              {t("routes.replace")}
            </button>
            <button
              type="button"
              className="marker-delete-modal__confirm"
              onClick={onContinue}
            >
              {t("routes.addAnyway")}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function RoutesSection() {
  const { t, language } = useLanguage();
  const { state, dispatch, effectiveTheme } = usePosterContext();
  const { form, routes, customMarkerIcons } = state;
  const { uploadGpxFile, confirmAddRoute, confirmReplaceRoutes } =
    useGpxUpload();
  const { fillFromRoute, makeSportPoster } = useActivityPoster();
  const sportRoute = routes.find((route) => route.stats && route.stats.distanceM > 0);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [openRouteId, setOpenRouteId] = useState<string | null>(null);
  const [openColorPickerId, setOpenColorPickerId] = useState<string | null>(
    null,
  );
  const [activeEndpoint, setActiveEndpoint] =
    useState<EndpointPickerState | null>(null);
  const [isEndpointIconOpen, setIsEndpointIconOpen] = useState(false);
  const [isEndpointColorOpen, setIsEndpointColorOpen] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] =
    useState<PendingConfirmation | null>(null);

  const palette = useMemo(
    () =>
      DISPLAY_PALETTE_KEYS.map((key) =>
        getThemeColorByPath(effectiveTheme, key as ThemeColorKey),
      ).filter(Boolean),
    [effectiveTheme],
  );

  const handleUploadClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const [isDragging, setIsDragging] = useState(false);
  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void processFile(file);
  };

  const handleUploadChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void processFile(file);
  };

  const processFile = useCallback(
    async (file: File) => {
      setUploadError(null);
      setIsUploading(true);
      try {
        const result = await uploadGpxFile(file);
        // On a sport poster the new track becomes the poster's route (orange,
        // fitted, stats filled); otherwise only pre-fill the stats.
        if (result.status === "added") {
          if (form.posterLayout === "activity") makeSportPoster(result.route);
          else fillFromRoute(result.route);
        }
        if (result.status === "needs-confirmation") {
          setPendingConfirmation({
            pendingRoute: result.pendingRoute,
            newBounds: result.newBounds,
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "";
        setUploadError(
          message.includes(".gpx file")
            ? t("routes.errorFileType")
            : message.includes("too large")
              ? t("routes.errorTooLarge")
              : message.includes("too far")
                ? t("routes.errorTooFar")
                : t("routes.errorUpload"),
        );
      } finally {
        setIsUploading(false);
      }
    },
    [uploadGpxFile, fillFromRoute, makeSportPoster, form.posterLayout],
  );

  const updateRoute = useCallback(
    (routeId: string, changes: Partial<Route>) => {
      dispatch({ type: "UPDATE_ROUTE", routeId, changes });
    },
    [dispatch],
  );

  const removeRoute = useCallback(
    (routeId: string) => {
      dispatch({ type: "REMOVE_ROUTE", routeId });
      setOpenRouteId((current) => (current === routeId ? null : current));
      setOpenColorPickerId((current) =>
        current === routeId ? null : current,
      );
      setActiveEndpoint((current) =>
        current?.routeId === routeId ? null : current,
      );
    },
    [dispatch],
  );

  const toggleShowAll = useCallback(() => {
    dispatch({
      type: "SET_FIELD",
      name: "showRoutes",
      value: !form.showRoutes,
    });
  }, [dispatch, form.showRoutes]);

  const toggleCardOpen = useCallback((routeId: string) => {
    setOpenRouteId((current) => (current === routeId ? null : routeId));
    setOpenColorPickerId(null);
    setActiveEndpoint(null);
    setIsEndpointIconOpen(false);
    setIsEndpointColorOpen(false);
  }, []);

  const closeCard = useCallback(() => {
    setOpenRouteId(null);
    setOpenColorPickerId(null);
    setActiveEndpoint(null);
    setIsEndpointIconOpen(false);
    setIsEndpointColorOpen(false);
  }, []);

  const openEndpointEditor = useCallback(
    (routeId: string, kind: RouteEndpointKind) => {
      setActiveEndpoint({ routeId, kind });
      setIsEndpointIconOpen(false);
      setIsEndpointColorOpen(false);
      setOpenColorPickerId(null);
    },
    [],
  );

  const endpointUploadRef = useRef<HTMLInputElement>(null);
  const [endpointUploadError, setEndpointUploadError] = useState("");
  const uploadedIcons = useMemo(
    () => customMarkerIcons.filter((icon) => icon.source === "custom"),
    [customMarkerIcons],
  );

  const closeEndpointEditor = useCallback(() => {
    setActiveEndpoint(null);
    setIsEndpointIconOpen(false);
    setIsEndpointColorOpen(false);
  }, []);

  const updateEndpoint = useCallback(
    (
      routeId: string,
      kind: RouteEndpointKind,
      changes: Partial<RouteEndpointMarker>,
    ) => {
      const route = routes.find((r) => r.id === routeId);
      if (!route) return;
      const current = kind === "start" ? route.startMarker : route.finishMarker;
      const next: RouteEndpointMarker = { ...current, ...changes };
      dispatch({
        type: "UPDATE_ROUTE",
        routeId,
        changes:
          kind === "start"
            ? { startMarker: next }
            : { finishMarker: next },
      });
    },
    [dispatch, routes],
  );
  /** Uploads the customer's own start/finish icon and applies it at once. */
  const handleEndpointUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file || !activeEndpoint) return;
      if (!file.type.startsWith("image/") && !isSvgFile(file)) {
        setEndpointUploadError(t("icons.uploadTypeError"));
        return;
      }
      setEndpointUploadError("");
      try {
        const dataUrl = await readIconFileAsDataUrl(file);
        const icon = createUploadedMarkerIcon({
          label: getUploadLabel(file.name),
          dataUrl,
          tintWithMarkerColor: isSvgFile(file),
        });
        dispatch({ type: "ADD_CUSTOM_MARKER_ICON", icon });
        updateEndpoint(activeEndpoint.routeId, activeEndpoint.kind, { iconId: icon.id });
      } catch {
        setEndpointUploadError(t("icons.uploadError"));
      }
    },
    [activeEndpoint, dispatch, t, updateEndpoint],
  );


  return (
    <section className="panel-block routes-settings-screen">
      {pendingConfirmation ? (
        <RouteBoundsWarningModal
          onCancel={() => setPendingConfirmation(null)}
          onContinue={() => {
            confirmAddRoute(
              pendingConfirmation.pendingRoute,
              pendingConfirmation.newBounds,
            );
            setPendingConfirmation(null);
          }}
          onReplace={() => {
            confirmReplaceRoutes(
              pendingConfirmation.pendingRoute,
              pendingConfirmation.newBounds,
            );
            setPendingConfirmation(null);
          }}
        />
      ) : null}

      <div className="routes-head">
        <p className="section-summary-label">{t("nav.routes")}</p>
        {routes.length > 0 ? (
          <button type="button" className="routes-head__toggle" onClick={toggleShowAll}>
            {form.showRoutes ? <LuEyeOff aria-hidden="true" /> : <LuEye aria-hidden="true" />}
            {form.showRoutes ? t("routes.hide") : t("routes.show")}
          </button>
        ) : null}
      </div>

      <button
        type="button"
        className={`gpx-drop${isDragging ? " is-dragging" : ""}${routes.length > 0 ? " is-compact" : ""}`}
        onClick={handleUploadClick}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        disabled={isUploading}
        title={t("routes.uploadTitle")}
      >
        <span className="gpx-drop__icon" aria-hidden="true">
          {routes.length > 0 ? <LuPlus /> : <LuUpload />}
        </span>
        <span className="gpx-drop__text">
          <strong>
            {isUploading ? t("routes.uploading") : routes.length > 0 ? t("routes.addAnother") : t("routes.dropTitle")}
          </strong>
          {routes.length > 0 ? null : <small>{t("routes.dropHint")}</small>}
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".gpx,application/gpx+xml,application/xml,text/xml"
        onChange={handleUploadChange}
        style={{ display: "none" }}
      />

      {uploadError ? (
        <p className="routes-section__error" role="alert">
          {uploadError}
        </p>
      ) : null}

      {sportRoute ? (
        form.posterLayout === "activity" ? (
          <div className="sport-cta is-active">
            <p className="sport-cta__title">
              <span className="sport-cta__check" aria-hidden="true">✓</span> {t("activity.active")}
            </p>
            <p className="sport-cta__hint">{t("activity.activeHint")}</p>
            <div className="sport-cta__actions">
              <button
                type="button"
                className="sport-cta__button"
                onClick={() => openSettingsTab({ tab: "style", focus: ".sport-fields" })}
              >
                {t("activity.editTexts")}
              </button>
              <button
                type="button"
                className="sport-cta__ghost"
                onClick={() => makeSportPoster(sportRoute)}
                title={t("activity.reapplyHint")}
              >
                {t("activity.reapply")}
              </button>
            </div>
          </div>
        ) : (
          <div className="sport-cta">
            <p className="sport-cta__title">{t("activity.make")}</p>
            <p className="sport-cta__hint">{t("activity.makeHint")}</p>
            <button type="button" className="sport-cta__button" onClick={() => makeSportPoster(sportRoute)}>
              {t("activity.make")}
            </button>
          </div>
        )
      ) : null}

      <div className="routes-section__content">

        {routes.map((route) => {
          const isOpen = openRouteId === route.id;
          const isColorOpen = openColorPickerId === route.id;
          const colorChoices = buildDynamicColorChoices(route.color, palette);
          const distanceLabel = formatRouteDistance(routeLengthMeters(route), language !== "en");
          const endpointKind =
            activeEndpoint?.routeId === route.id ? activeEndpoint.kind : null;
          const isEditingEndpoint = endpointKind !== null;

          return (
            <article
              key={route.id}
              className={`route-card${isOpen ? " is-open" : ""}`}
            >
              <div className="route-card__header">
                <button
                  type="button"
                  className="route-card__summary"
                  onClick={() => (isEditingEndpoint ? closeEndpointEditor() : toggleCardOpen(route.id))}
                  aria-expanded={isOpen}
                >
                  <span
                    className="route-card__swatch"
                    style={{ backgroundColor: route.color, opacity: route.opacity }}
                    aria-hidden="true"
                  />
                  <span className="route-card__meta">
                    <span className="route-card__label" title={route.label}>
                      {isEditingEndpoint
                        ? endpointKind === "start" ? t("routes.start") : t("routes.finish")
                        : route.label}
                    </span>
                    <span className="route-card__distance">
                      {isEditingEndpoint ? route.label : distanceLabel}
                    </span>
                  </span>
                  {isEditingEndpoint ? null : <LuChevronDown className="route-card__chevron" aria-hidden="true" />}
                </button>
                {isEditingEndpoint ? (
                  <button type="button" className="route-card__back" onClick={closeEndpointEditor}>
                    <CheckIcon /> {t("common.done")}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="route-card__trash"
                    onClick={() => removeRoute(route.id)}
                    title={t("routes.remove")}
                    aria-label={`${t("routes.remove")}: ${route.label}`}
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>

              {isOpen && isEditingEndpoint ? (() => {
                const endpoint =
                  endpointKind === "start"
                    ? route.startMarker
                    : route.finishMarker;
                const icon = findMarkerIcon(endpoint.iconId, customMarkerIcons);
                const endpointColorChoices = buildDynamicColorChoices(
                  endpoint.color,
                  palette,
                );
                return (
                  <div className="route-card__body">
                    <div className="route-card__field">
                      <label>
                        <span>{t("routes.icon")}</span>
                        <button
                          type="button"
                          className="route-card__endpoint-toggle"
                          onClick={() =>
                            setIsEndpointIconOpen((current) => !current)
                          }
                          aria-expanded={isEndpointIconOpen}
                          aria-label={
                            isEndpointIconOpen
                              ? t("routes.closeIconPicker")
                              : t("routes.changeIcon")
                          }
                        >
                          {icon ? (
                            <MarkerVisual
                              icon={icon}
                              size={22}
                              color={endpoint.color}
                            />
                          ) : null}
                        </button>
                      </label>
                      {isEndpointIconOpen ? (
                        <div className="route-card__endpoint-picker">
                          {predefinedMarkerIcons.map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              className={`route-card__endpoint-option${
                                option.id === endpoint.iconId
                                  ? " is-selected"
                                  : ""
                              }`}
                              onClick={() =>
                                updateEndpoint(route.id, endpointKind!, {
                                  iconId: option.id,
                                })
                              }
                              title={option.label}
                              aria-label={option.label}
                            >
                              <MarkerVisual
                                icon={option}
                                size={24}
                                color={endpoint.color}
                              />
                            </button>
                          ))}
                          <div className="endpoint-own">
                            <p className="endpoint-own__title">{t("routes.ownIcon")}</p>
                            <p className="endpoint-own__hint">{t("routes.ownIconHint")}</p>
                            <div className="endpoint-own__grid">
                              {uploadedIcons.map((option) => (
                                <button
                                  key={option.id}
                                  type="button"
                                  className={`route-card__endpoint-option${
                                    option.id === endpoint.iconId ? " is-selected" : ""
                                  }`}
                                  onClick={() =>
                                    updateEndpoint(route.id, endpointKind!, { iconId: option.id })
                                  }
                                  title={option.label}
                                  aria-label={option.label}
                                >
                                  <MarkerVisual icon={option} size={24} color={endpoint.color} />
                                </button>
                              ))}
                              <button
                                type="button"
                                className="endpoint-own__upload"
                                onClick={() => endpointUploadRef.current?.click()}
                              >
                                <LuUpload aria-hidden="true" />
                                {t("routes.ownIconUpload")}
                              </button>
                            </div>
                            <input
                              ref={endpointUploadRef}
                              type="file"
                              accept="image/png,image/svg+xml,image/webp,image/jpeg,.svg"
                              hidden
                              onChange={handleEndpointUpload}
                            />
                            {endpointUploadError ? (
                              <p className="endpoint-own__error" role="alert">{endpointUploadError}</p>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="route-card__field">
                      <label>
                        <span>{t("common.color")}</span>
                        <button
                          type="button"
                          className="route-card__color-toggle"
                          style={{ backgroundColor: endpoint.color }}
                          onClick={() =>
                            setIsEndpointColorOpen((current) => !current)
                          }
                          aria-label={
                            isEndpointColorOpen
                              ? t("routes.closeColorPicker")
                              : t("routes.openColorPicker")
                          }
                        >
                          {isEndpointColorOpen ? <CloseIcon /> : null}
                        </button>
                      </label>
                      {isEndpointColorOpen ? (
                        <ColorPicker
                          currentColor={endpoint.color}
                          suggestedColors={endpointColorChoices.suggestedColors}
                          moreColors={endpointColorChoices.moreColors}
                          onChange={(color) =>
                            updateEndpoint(route.id, endpointKind!, { color })
                          }
                          onResetColor={() =>
                            updateEndpoint(route.id, endpointKind!, {
                              color: route.color,
                            })
                          }
                        />
                      ) : null}
                    </div>

                    <div className="route-card__field">
                      <label
                        htmlFor={`route-${route.id}-${endpointKind}-size`}
                      >
                        <span>{t("common.size")}</span>
                        <span className="route-card__value">
                          {endpoint.size}px
                        </span>
                      </label>
                      <input
                        id={`route-${route.id}-${endpointKind}-size`}
                        type="range"
                        min={MIN_MARKER_SIZE}
                        max={MAX_MARKER_SIZE}
                        step={1}
                        value={endpoint.size}
                        onChange={(event) =>
                          updateEndpoint(route.id, endpointKind!, {
                            size: Number(event.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                );
              })() : null}

              {isOpen && !isEditingEndpoint ? (
                <div className="route-card__body">
                  <section className="route-card__section">
                    <h4 className="route-card__section-title">{t("routes.iconsTitle")}</h4>
                    {(["start", "finish"] as const).map((kind) => {
                      const marker = kind === "start" ? route.startMarker : route.finishMarker;
                      const other = kind === "start" ? route.finishMarker : route.startMarker;
                      const shown = route.showEndpoints && !marker.hidden;
                      const otherShown = route.showEndpoints && !other.hidden;
                      const icon = findMarkerIcon(marker.iconId, customMarkerIcons);
                      const label = kind === "start" ? t("routes.start") : t("routes.finish");
                      return (
                        <div key={kind} className={`route-endpoint${shown ? "" : " is-off"}`}>
                          <button
                            type="button"
                            className="route-endpoint__edit"
                            onClick={() => openEndpointEditor(route.id, kind)}
                            disabled={!shown}
                            title={t("routes.changeIcon")}
                          >
                            <span className="route-endpoint__icon">
                              {icon ? <MarkerVisual icon={icon} size={22} color={marker.color} /> : null}
                            </span>
                            <span className="route-endpoint__label">{label}</span>
                            {shown ? <LuPencil className="route-endpoint__pencil" aria-hidden="true" /> : null}
                          </button>
                          <label className="theme-switch" title={t(kind === "start" ? "routes.showStart" : "routes.showFinish")}>
                            <input
                              type="checkbox"
                              checked={shown}
                              aria-label={t(kind === "start" ? "routes.showStart" : "routes.showFinish")}
                              onChange={(event) => {
                                const on = event.target.checked;
                                updateRoute(route.id, {
                                  // Keep the other icon as it was shown.
                                  startMarker: { ...route.startMarker, hidden: kind === "start" ? !on : !otherShown },
                                  finishMarker: { ...route.finishMarker, hidden: kind === "finish" ? !on : !otherShown },
                                  showEndpoints: on || otherShown,
                                });
                              }}
                            />
                            <span className="theme-switch-track" aria-hidden="true" />
                          </label>
                        </div>
                      );
                    })}
                  </section>

                  <section className="route-card__section">
                    <h4 className="route-card__section-title">{t("routes.lineTitle")}</h4>
                  <div className="route-card__field">
                    <label>
                      <span>{t("common.color")}</span>
                    </label>
                    <div className="route-swatches" role="radiogroup" aria-label={t("common.color")}>
                      {quickColors(route.color, colorChoices.suggestedColors).map((color) => (
                        <button
                          key={color}
                          type="button"
                          role="radio"
                          aria-checked={color.toLowerCase() === route.color.toLowerCase()}
                          className={`route-swatch${color.toLowerCase() === route.color.toLowerCase() ? " is-active" : ""}`}
                          style={{ backgroundColor: color }}
                          onClick={() => updateRoute(route.id, { color })}
                          title={color}
                        />
                      ))}
                      <button
                        type="button"
                        className={`route-swatch route-swatch--more${isColorOpen ? " is-open" : ""}`}
                        onClick={() => setOpenColorPickerId(isColorOpen ? null : route.id)}
                        aria-label={isColorOpen ? t("routes.closeColorPicker") : t("routes.openColorPicker")}
                        title={t("routes.moreColors")}
                      >
                        {isColorOpen ? <CloseIcon /> : <LuPlus />}
                      </button>
                    </div>
                    {isColorOpen ? (
                      <ColorPicker
                        currentColor={route.color}
                        suggestedColors={colorChoices.suggestedColors}
                        moreColors={colorChoices.moreColors}
                        onChange={(color) => updateRoute(route.id, { color })}
                        onResetColor={() =>
                          updateRoute(route.id, {
                            color: state.routeDefaults.color,
                          })
                        }
                      />
                    ) : null}
                  </div>

                  <div className="route-card__field">
                    <label htmlFor={`route-width-${route.id}`}>
                      <span>{t("common.width")}</span>
                      <span className="route-card__value">
                        {route.strokeWidth}px
                      </span>
                    </label>
                    <input
                      id={`route-width-${route.id}`}
                      type="range"
                      min={MIN_ROUTE_STROKE_WIDTH}
                      max={MAX_ROUTE_STROKE_WIDTH}
                      step={1}
                      value={route.strokeWidth}
                      onChange={(event) =>
                        updateRoute(route.id, {
                          strokeWidth: Number(event.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="route-card__field">
                    <label htmlFor={`route-opacity-${route.id}`}>
                      <span>{t("common.opacity")}</span>
                      <span className="route-card__value">
                        {Math.round(route.opacity * 100)}%
                      </span>
                    </label>
                    <input
                      id={`route-opacity-${route.id}`}
                      type="range"
                      min={MIN_ROUTE_OPACITY}
                      max={MAX_ROUTE_OPACITY}
                      step={0.05}
                      value={route.opacity}
                      onChange={(event) =>
                        updateRoute(route.id, {
                          opacity: Number(event.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="route-card__field">
                    <label>
                      <span>{t("routes.style")}</span>
                    </label>
                    <div className="route-card__style-toggle">
                      {ROUTE_LINE_STYLES.map((style) => (
                        <button
                          key={style}
                          type="button"
                          className={`route-card__style-btn${route.lineStyle === style ? " is-active" : ""}`}
                          onClick={() =>
                            updateRoute(route.id, { lineStyle: style })
                          }
                        >
                          <span>{style === "solid" ? t("routes.solid") : t("routes.dashed")}</span>
                          <svg
                            className="route-card__style-preview"
                            width="28"
                            height="8"
                            viewBox="0 0 28 8"
                            aria-hidden="true"
                          >
                            <line
                              x1="1"
                              y1="4"
                              x2="27"
                              y2="4"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeDasharray={style === "dashed" ? "4 3" : undefined}
                            />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>

                  </section>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
