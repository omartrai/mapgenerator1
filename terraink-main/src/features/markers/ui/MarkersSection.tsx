import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import type {
  MarkerDefaults,
  MarkerItem,
} from "@/features/markers/domain/types";
import MarkerPicker from "./MarkerPicker";
import {
  createMarkerItem,
  createUploadedMarkerIcon,
  getUploadLabel,
  isSvgFile,
  readIconFileAsDataUrl,
} from "@/features/markers/infrastructure/helpers";
import { findMarkerIcon } from "@/features/markers/infrastructure/iconRegistry";
import {
  MAX_MARKER_SIZE,
  MIN_MARKER_SIZE,
} from "@/features/markers/domain/constants";
import { DEFAULT_MARKER_COLOR } from "@/features/markers/infrastructure/constants";
import MarkerVisual from "./MarkerVisual";
import {
  CheckIcon,
  CloseIcon,
  EditIcon,
  GearIcon,
  InfoIcon,
  TrashIcon,
} from "@/shared/ui/Icons";
import ColorPicker from "@/features/theme/ui/ColorPicker";
import { buildDynamicColorChoices } from "@/features/theme/domain/colorSuggestions";
import {
  DISPLAY_PALETTE_KEYS,
  type ThemeColorKey,
} from "@/features/theme/domain/types";
import { getThemeColorByPath } from "@/features/theme/domain/colorPaths";
import { normalizeHexColor } from "@/shared/utils/color";
import { useLanguage } from "@/shared/i18n/LanguageContext";


function formatCoordinate(value: number) {
  return Number(value).toFixed(6);
}

function DeleteAllMarkersModal({
  markerCount,
  onCancel,
  onConfirm,
}: {
  markerCount: number;
  onCancel: () => void;
  onConfirm: () => void;
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
        aria-labelledby="marker-delete-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="marker-delete-modal__body">
          <p
            className="marker-delete-modal__headline"
            id="marker-delete-modal-title"
          >
            {t("markers.deleteQuestion")}
          </p>
          <p className="marker-delete-modal__text">
            {t("markers.deleteMessage")}
          </p>
          <div className="marker-delete-modal__actions">
            <button
              type="button"
              className="marker-delete-modal__cancel"
              onClick={onCancel}
            >
              {t("markers.keep")}
            </button>
            <button
              type="button"
              className="marker-delete-modal__confirm"
              onClick={onConfirm}
            >
              <TrashIcon />
              {t("markers.deleteAll")}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function MarkersSection() {
  const { t } = useLanguage();
  const { state, dispatch, mapRef, effectiveTheme } = usePosterContext();
  const {
    form,
    markers,
    customMarkerIcons,
    markerDefaults,
    isMarkerEditorActive,
    activeMarkerId,
  } = state;
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDefaultColorPickerOpen, setIsDefaultColorPickerOpen] =
    useState(false);
  const [openMarkerColorPickerId, setOpenMarkerColorPickerId] = useState<
    string | null
  >(null);
  const [expandedMarkerId, setExpandedMarkerId] = useState<string | null>(null);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const hasMarkers = markers.length > 0;
  const isColorPickerFocused =
    isMarkerEditorActive &&
    expandedMarkerId !== null &&
    openMarkerColorPickerId === expandedMarkerId;

  const toggleMarkerEditor = useCallback((markerId: string) => {
    setExpandedMarkerId((current) => {
      const next = current === markerId ? null : markerId;
      dispatch({ type: "SET_ACTIVE_MARKER", markerId: next });
      return next;
    });
    setOpenMarkerColorPickerId((current) =>
      current === markerId ? null : current,
    );
  }, [dispatch]);

  const openMarkerEditor = useCallback(
    (markerId: string) => {
      setExpandedMarkerId(markerId);
      setOpenMarkerColorPickerId(null);
      dispatch({ type: "SET_ACTIVE_MARKER", markerId });
    },
    [dispatch],
  );

  const removeMarker = useCallback(
    (markerId: string) => {
      dispatch({ type: "REMOVE_MARKER", markerId });
      if (activeMarkerId === markerId) {
        dispatch({ type: "SET_ACTIVE_MARKER", markerId: null });
        setExpandedMarkerId(null);
        setOpenMarkerColorPickerId(null);
      }
    },
    [activeMarkerId, dispatch],
  );

  const updateMarker = useCallback(
    (markerId: string, changes: Partial<MarkerItem>) => {
      dispatch({ type: "UPDATE_MARKER", markerId, changes });
    },
    [dispatch],
  );

  const applyMarkerDefaults = useCallback(
    (defaults: Partial<MarkerDefaults>) => {
      dispatch({
        type: "SET_MARKER_DEFAULTS",
        defaults,
        applyToMarkers: true,
      });
    },
    [dispatch],
  );

  const addMarker = useCallback(
    (iconId: string) => {
      const center = mapRef.current?.getCenter();
      const fallbackLat = Number(form.latitude) || 0;
      const fallbackLon = Number(form.longitude) || 0;
      const lat = center?.lat ?? fallbackLat;
      const lon = center?.lng ?? fallbackLon;

      dispatch({
        type: "ADD_MARKER",
        marker: createMarkerItem({
          lat,
          lon,
          iconId,
          defaults: markerDefaults,
        }),
      });
    },
    [dispatch, form.latitude, form.longitude, mapRef, markerDefaults],
  );

  const handleUploadIcon = useCallback(
    async (file: File) => {
      const dataUrl = await readIconFileAsDataUrl(file);
      const icon = createUploadedMarkerIcon({
        label: getUploadLabel(file.name),
        dataUrl,
        tintWithMarkerColor: isSvgFile(file),
      });

      dispatch({ type: "ADD_CUSTOM_MARKER_ICON", icon });
      addMarker(icon.id);
    },
    [addMarker, dispatch],
  );

  const markerRows = useMemo(
    () => {
      const iconCounts = new Map<string, number>();
      return markers.map((marker, index) => {
        const icon = findMarkerIcon(marker.iconId, customMarkerIcons);
        const iconLabel = String(icon?.label ?? "Marker").trim() || "Marker";
        const nextCount = (iconCounts.get(iconLabel) ?? 0) + 1;
        iconCounts.set(iconLabel, nextCount);
        return {
          marker,
          index,
          icon,
          markerLabel: `${iconLabel} ${nextCount}`,
          isExpanded: expandedMarkerId === marker.id,
        };
      });
    },
    [customMarkerIcons, expandedMarkerId, markers],
  );

  const markerColorPalette = useMemo(
    () =>
      DISPLAY_PALETTE_KEYS.map((key) =>
        getThemeColorByPath(effectiveTheme, key as ThemeColorKey),
      ).filter(Boolean),
    [effectiveTheme],
  );

  const defaultColorChoices = useMemo(
    () => buildDynamicColorChoices(markerDefaults.color, markerColorPalette),
    [markerDefaults.color, markerColorPalette],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const mediaQuery = window.matchMedia(
      "(max-width: 768px), (hover: none) and (pointer: coarse)",
    );
    const syncViewport = () => setIsMobileViewport(mediaQuery.matches);
    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);
    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);

  useEffect(() => {
    if (isMarkerEditorActive) {
      return;
    }
    setExpandedMarkerId(null);
    setOpenMarkerColorPickerId(null);
    setIsDefaultColorPickerOpen(false);
  }, [isMarkerEditorActive]);

  useEffect(() => {
    if (!isMarkerEditorActive) {
      return;
    }

    if (!activeMarkerId) {
      return;
    }

    const activeMarkerStillExists = markers.some(
      (marker) => marker.id === activeMarkerId,
    );
    if (!activeMarkerStillExists) {
      setExpandedMarkerId(null);
      setOpenMarkerColorPickerId(null);
      return;
    }

    setExpandedMarkerId(activeMarkerId);
  }, [activeMarkerId, isMarkerEditorActive, markers]);

  const toggleMarkerSettings = useCallback(() => {
    setIsSettingsOpen((current) => {
      const next = !current;
      if (!next) {
        setIsDefaultColorPickerOpen(false);
      }
      return next;
    });
  }, []);

  const toggleDefaultColorPicker = useCallback(() => {
    setIsDefaultColorPickerOpen((current) => !current);
  }, []);

  const handleDeleteAllMarkers = useCallback(() => {
    if (markers.length > 0) {
      setIsDeleteAllModalOpen(true);
    }
  }, [markers.length]);

  const toggleMarkerEditMode = useCallback(() => {
    const next = !isMarkerEditorActive;
    if (next) {
      setIsSettingsOpen(false);
      setIsDefaultColorPickerOpen(false);
    }
    dispatch({ type: "SET_MARKER_EDITOR_ACTIVE", active: next });
    if (!next) {
      dispatch({ type: "SET_ACTIVE_MARKER", markerId: null });
      setExpandedMarkerId(null);
      setOpenMarkerColorPickerId(null);
    }
  }, [dispatch, isMarkerEditorActive]);

  const visibleMarkerRows =
    isMarkerEditorActive && expandedMarkerId
      ? markerRows.filter(({ marker }) => marker.id === expandedMarkerId)
      : markerRows;
  const activeColorPickerMarker =
    expandedMarkerId && openMarkerColorPickerId === expandedMarkerId
      ? markerRows.find(({ marker }) => marker.id === expandedMarkerId) ?? null
      : null;
  const activeMarkerColorChoices = activeColorPickerMarker
    ? buildDynamicColorChoices(activeColorPickerMarker.marker.color, markerColorPalette)
    : null;
  const markerHelpText = isMobileViewport
    ? t("markers.helpMobile")
    : t("markers.helpDesktop");

  return (
    <section className="panel-block color-editor-screen marker-settings-screen">
      {isDeleteAllModalOpen ? (
        <DeleteAllMarkersModal
          markerCount={markers.length}
          onCancel={() => setIsDeleteAllModalOpen(false)}
          onConfirm={() => {
            dispatch({ type: "CLEAR_MARKERS" });
            setExpandedMarkerId(null);
            setOpenMarkerColorPickerId(null);
            setIsDeleteAllModalOpen(false);
          }}
        />
      ) : null}

      <div className="markers-section-head">
        <p className="section-summary-label">{t("nav.icons")}</p>
        {/* Edit / settings / help only matter once an icon is on the map. */}
        {hasMarkers || isMarkerEditorActive || isSettingsOpen ? (
        <div className="markers-section-head-actions">
          {!isMarkerEditorActive ? (
            <button
              type="button"
              className={`marker-row__icon-btn marker-header-action-btn marker-header-settings-btn${isSettingsOpen ? " is-active" : " is-compact"}`}
              onClick={toggleMarkerSettings}
              aria-label={
                isSettingsOpen
                  ? t("markers.doneSettings")
                  : t("markers.openSettings")
              }
              title={
                isSettingsOpen
                  ? t("markers.doneSettings")
                  : t("markers.openSettings")
              }
            >
              <span className="marker-row__icon-btn-icon" aria-hidden="true">
                {isSettingsOpen ? <CheckIcon /> : <GearIcon />}
              </span>
              {isSettingsOpen ? (
                <span className="marker-row__icon-btn-label">{t("common.done")}</span>
              ) : null}
            </button>
          ) : null}
          {isMarkerEditorActive || !isSettingsOpen ? (
            <button
              type="button"
              className={`marker-row__icon-btn marker-header-action-btn${isMarkerEditorActive ? " is-active" : ""}`}
              onClick={toggleMarkerEditMode}
              aria-label={
                isMarkerEditorActive ? t("markers.doneEditing") : t("markers.edit")
              }
              title={
                isMarkerEditorActive ? t("markers.doneEditing") : t("markers.edit")
              }
              disabled={!isMarkerEditorActive && !hasMarkers}
            >
              <span className="marker-row__icon-btn-icon" aria-hidden="true">
                {isMarkerEditorActive ? <CheckIcon /> : <EditIcon />}
              </span>
              <span className="marker-row__icon-btn-label">
                {isMarkerEditorActive ? t("common.done") : t("markers.edit")}
              </span>
            </button>
          ) : null}
          <div className="marker-info-wrap marker-info-wrap--top">
            <button
              type="button"
              className="icon-only-btn marker-info-btn"
              aria-label={t("markers.help")}
            >
              <InfoIcon />
            </button>
            <div className="marker-info-popover" role="tooltip">{markerHelpText}</div>
          </div>
        </div>
        ) : null}
      </div>

      <div className="markers-section__content">
        {!isMarkerEditorActive && !isSettingsOpen ? (
          <MarkerPicker
            markerColor={markerDefaults.color}
            customIcons={customMarkerIcons}
            onIconClick={addMarker}
            onUploadIcon={handleUploadIcon}
            onRemoveUploadedIcon={(iconId) =>
              dispatch({ type: "REMOVE_CUSTOM_MARKER_ICON", iconId })
            }
            onClearUploadedIcons={() =>
              dispatch({ type: "CLEAR_CUSTOM_MARKER_ICONS" })
            }
          />
        ) : null}

        {!isMarkerEditorActive && isSettingsOpen ? (
          <div className="marker-settings-card">
            <div className="marker-settings-card__header">
              <h3>{t("markers.settings")}</h3>
            </div>
            <p className="marker-settings-card__theme-note">
              {t("markers.settingsNote")}
            </p>

            <div className="marker-editor-card__stack">
              <label>
                {t("markers.defaultSize")}
                <div className="marker-editor-card__size-row">
                  <input
                    className="marker-editor-card__size-slider"
                    type="range"
                    min={MIN_MARKER_SIZE}
                    max={MAX_MARKER_SIZE}
                    step="1"
                    value={markerDefaults.size}
                    onChange={(event) =>
                      applyMarkerDefaults({
                        size: Number(event.target.value),
                      })
                    }
                  />
                  <input
                    className="form-control-tall marker-editor-card__size-input"
                    type="number"
                    min={MIN_MARKER_SIZE}
                    max={MAX_MARKER_SIZE}
                    step="1"
                    value={markerDefaults.size}
                    onChange={(event) => {
                      const nextValue = Number(event.target.value);
                      if (Number.isFinite(nextValue)) {
                        applyMarkerDefaults({
                          size: Math.max(MIN_MARKER_SIZE, Math.min(MAX_MARKER_SIZE, nextValue)),
                        });
                      }
                    }}
                  />
                </div>
              </label>

              <div className="marker-settings-card__theme-color">
                <span className="marker-settings-card__theme-label">
                  {t("markers.defaultColor")}
                </span>
                <div className="marker-color-control">
                  <button
                    type="button"
                    className="marker-color-display-btn"
                    onClick={toggleDefaultColorPicker}
                  >
                    <span
                      className="marker-editor-card__color-swatch"
                      aria-hidden="true"
                      style={{
                        backgroundColor:
                          normalizeHexColor(markerDefaults.color) || "#000000",
                      }}
                    />
                    <span className="marker-editor-card__color-value">
                      {markerDefaults.color}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {isDefaultColorPickerOpen ? (
              <ColorPicker
                currentColor={markerDefaults.color}
                suggestedColors={defaultColorChoices.suggestedColors}
                moreColors={defaultColorChoices.moreColors}
                onChange={(color) => applyMarkerDefaults({ color })}
                onResetColor={() =>
                  applyMarkerDefaults({ color: DEFAULT_MARKER_COLOR })
                }
              />
            ) : null}
          </div>
        ) : null}

        {isMarkerEditorActive ? (
          <>
            {isColorPickerFocused && activeColorPickerMarker ? (
              <article className="marker-editor-card">
                <div className="marker-settings-card__header">
                  <h3>{t("markers.editColor")}</h3>
                  <button
                    type="button"
                    className="marker-row__icon-btn"
                    onClick={() => setOpenMarkerColorPickerId(null)}
                  >
                    <span className="marker-row__icon-btn-label">{t("common.done")}</span>
                  </button>
                </div>
                <ColorPicker
                  currentColor={activeColorPickerMarker.marker.color}
                  suggestedColors={activeMarkerColorChoices!.suggestedColors}
                  moreColors={activeMarkerColorChoices!.moreColors}
                  onChange={(color) =>
                    updateMarker(activeColorPickerMarker.marker.id, { color })
                  }
                  onResetColor={() =>
                    updateMarker(activeColorPickerMarker.marker.id, {
                      color: markerDefaults.color,
                    })
                  }
                />
              </article>
            ) : (
              <>
                {!expandedMarkerId ? (
                  <div className="marker-current-library__intro">
                    <h3>{t("icons.yours")}</h3>
                    <p>
                      {t("markers.placedDescription")}
                    </p>
                  </div>
                ) : null}
                {visibleMarkerRows.length > 0 ? (
                  <>
                    {isMobileViewport && !expandedMarkerId ? (
                      <div className="markers-section__mobile-strip" role="list">
                        {markerRows.map(({ marker, icon, markerLabel }) => {
                          const isSelected = marker.id === activeMarkerId;
                          return (
                            <article
                              key={marker.id}
                              className={`marker-mobile-card${isSelected ? " is-selected" : ""}`}
                              role="listitem"
                            >
                              <button
                                type="button"
                                className="marker-mobile-card__delete"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  removeMarker(marker.id);
                                }}
                                title={t("markers.delete")}
                                aria-label={`Delete ${markerLabel}`}
                              >
                                <CloseIcon />
                              </button>
                              <button
                                type="button"
                                className="marker-mobile-card__select"
                                onClick={() => openMarkerEditor(marker.id)}
                                title={`Edit ${markerLabel}`}
                              >
                                {icon ? (
                                  <MarkerVisual
                                    icon={icon}
                                    size={24}
                                    color={marker.color}
                                  />
                                ) : null}
                                <span className="marker-mobile-card__label">
                                  {markerLabel}
                                </span>
                              </button>
                            </article>
                          );
                        })}
                      </div>
                    ) : !expandedMarkerId ? (
                      <div className="markers-section__marker-grid" role="list">
                        {markerRows.map(({ marker, icon, markerLabel }) => {
                          const isSelected = marker.id === activeMarkerId;
                          return (
                            <article
                              key={marker.id}
                              className={`marker-mobile-card${isSelected ? " is-selected" : ""}`}
                              role="listitem"
                            >
                              <button
                                type="button"
                                className="marker-mobile-card__delete"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  removeMarker(marker.id);
                                }}
                                title={t("markers.delete")}
                                aria-label={`Delete ${markerLabel}`}
                              >
                                <CloseIcon />
                              </button>
                              <button
                                type="button"
                                className="marker-mobile-card__select"
                                onClick={() => openMarkerEditor(marker.id)}
                                title={`Edit ${markerLabel}`}
                              >
                                {icon ? (
                                  <MarkerVisual
                                    icon={icon}
                                    size={24}
                                    color={marker.color}
                                  />
                                ) : null}
                                <span className="marker-mobile-card__label">
                                  {markerLabel}
                                </span>
                              </button>
                            </article>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="markers-section__list">
                        {visibleMarkerRows.map(
                          ({ marker, icon, markerLabel, isExpanded }) => {
                            return (
                              <article key={marker.id} className="marker-editor-card">
                                <div className="marker-row">
                                  <div className="marker-row__summary">
                                    {icon ? (
                                      <MarkerVisual
                                        icon={icon}
                                        size={26}
                                        color={marker.color}
                                      />
                                    ) : null}
                                    <span className="marker-row__title">{markerLabel}</span>
                                  </div>

                                  <div className="marker-row__actions">
                                    <button
                                      type="button"
                                      className="marker-row__icon-btn"
                                      onClick={() => toggleMarkerEditor(marker.id)}
                                      title={
                                        isExpanded
                                          ? t("markers.finishEdit")
                                          : t("common.edit")
                                      }
                                    >
                                      <span
                                        className="marker-row__icon-btn-icon"
                                        aria-hidden="true"
                                      >
                                        {isExpanded ? <CheckIcon /> : <EditIcon />}
                                      </span>
                                      <span className="marker-row__icon-btn-label">
                                        {isExpanded ? t("common.done") : t("common.edit")}
                                      </span>
                                    </button>
                                    <button
                                      type="button"
                                      className="marker-row__icon-btn marker-row__icon-btn--danger"
                                      onClick={() => removeMarker(marker.id)}
                                      title={t("markers.delete")}
                                    >
                                      <TrashIcon />
                                    </button>
                                  </div>
                                </div>

                                {isExpanded ? (
                                  <div className="marker-editor-card__details">
                                    <div className="field-grid keep-two-mobile">
                                      <label>
                                        {t("location.latitudeShort")}
                                        <input
                                          className="form-control-tall"
                                          type="number"
                                          step="0.000001"
                                          min={-90}
                                          max={90}
                                          value={formatCoordinate(marker.lat)}
                                          onChange={(event) => {
                                            const nextValue = Number(event.target.value);
                                            if (Number.isFinite(nextValue)) {
                                              updateMarker(marker.id, {
                                                lat: Math.max(-90, Math.min(90, nextValue)),
                                              });
                                            }
                                          }}
                                        />
                                      </label>
                                      <label>
                                        {t("location.longitudeShort")}
                                        <input
                                          className="form-control-tall"
                                          type="number"
                                          step="0.000001"
                                          min={-180}
                                          max={180}
                                          value={formatCoordinate(marker.lon)}
                                          onChange={(event) => {
                                            const nextValue = Number(event.target.value);
                                            if (Number.isFinite(nextValue)) {
                                              updateMarker(marker.id, {
                                                lon: Math.max(-180, Math.min(180, nextValue)),
                                              });
                                            }
                                          }}
                                        />
                                      </label>
                                    </div>

                                    <div className="marker-editor-card__stack">
                                      <label>
                                        {t("common.size")}
                                        <div className="marker-editor-card__size-row">
                                          <input
                                            className="marker-editor-card__size-slider"
                                            type="range"
                                            min={MIN_MARKER_SIZE}
                                            max={MAX_MARKER_SIZE}
                                            step="1"
                                            value={marker.size}
                                            onChange={(event) =>
                                              updateMarker(marker.id, {
                                                size: Number(event.target.value),
                                              })
                                            }
                                          />
                                          <input
                                            className="form-control-tall marker-editor-card__size-input"
                                            type="number"
                                            min={MIN_MARKER_SIZE}
                                            max={MAX_MARKER_SIZE}
                                            step="1"
                                            value={marker.size}
                                            onChange={(event) => {
                                              const nextValue = Number(event.target.value);
                                              if (Number.isFinite(nextValue)) {
                                                updateMarker(marker.id, {
                                                  size: Math.max(MIN_MARKER_SIZE, Math.min(MAX_MARKER_SIZE, nextValue)),
                                                });
                                              }
                                            }}
                                          />
                                        </div>
                                      </label>
                                      <div>
                                        <span className="marker-settings-card__theme-label">
                                          {t("common.color")}
                                        </span>
                                        <div className="marker-color-control">
                                          <button
                                            type="button"
                                            className="marker-color-display-btn"
                                            onClick={() =>
                                              setOpenMarkerColorPickerId((current) =>
                                                current === marker.id ? null : marker.id,
                                              )
                                            }
                                          >
                                            <span
                                              className="marker-editor-card__color-swatch"
                                              aria-hidden="true"
                                              style={{
                                                backgroundColor:
                                                  normalizeHexColor(marker.color) || "#000000",
                                              }}
                                            />
                                            <span className="marker-editor-card__color-value">
                                              {marker.color}
                                            </span>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : null}
                              </article>
                            );
                          },
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="marker-settings-card__theme-note">
                    {t("markers.empty")}
                  </p>
                )}
                {!expandedMarkerId && hasMarkers ? (
                  <div className="markers-section__actions">
                    <button
                      type="button"
                      className="marker-current-library__remove-all"
                      onClick={handleDeleteAllMarkers}
                      title={t("markers.deleteAll")}
                    >
                      {t("common.removeAll")}
                    </button>
                  </div>
                ) : null}

                {!expandedMarkerId ? (
                  <MarkerPicker
                    markerColor={markerDefaults.color}
                    customIcons={customMarkerIcons}
                    onIconClick={addMarker}
                    showIntro={false}
                    showUploadedIcons={false}
                  />
                ) : null}
              </>
            )}
          </>
        ) : null}
      </div>
    </section>
  );
}
