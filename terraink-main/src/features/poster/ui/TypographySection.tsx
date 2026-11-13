import { MESSAGE_MAX_LENGTH } from "@/features/poster/domain/textLayout";
import { useCallback, useEffect, useRef, useState } from "react";
import PanelGroup from "@/shared/ui/PanelGroup";
import { onOpenSettingsTab } from "@/shared/ui/settingsTabs";
import { ensureFont } from "@/core/services";
import FontDropdown from "@/shared/ui/FontDropdown";
import type { PosterForm } from "@/features/poster/application/posterReducer";
import type { FontOption } from "@/core/config";
import {
  PLACEHOLDER_EXAMPLE_CITY,
  PLACEHOLDER_EXAMPLE_COUNTRY,
} from "@/features/location/ui/constants";
import { useLanguage, type TranslationKey } from "@/shared/i18n/LanguageContext";
import { MAP_SHAPES, POSTER_LAYOUTS, DEFAULT_POSTER_LAYOUT } from "@/features/poster/domain/posterLayout";
import { LuBan, LuCircle, LuHeart, LuStar } from "react-icons/lu";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { useActivityPoster } from "@/features/routes/application/useActivityPoster";
import MessageLookControls from "@/features/poster/ui/MessageLookControls";

/** Lines of the poster text that can each be hidden on their own. */
const TEXT_PARTS = [
  { name: "showCity", label: "style.part.city" },
  { name: "showDivider", label: "style.part.divider" },
  { name: "showCountry", label: "style.part.country" },
  { name: "showCoordinates", label: "style.part.coordinates" },
  { name: "showMessage", label: "style.part.message" },
] as const;

/** One-tap ideas for the personal message. */
const MESSAGE_IDEAS = ["style.idea.1", "style.idea.2", "style.idea.3"] as const;

const SHAPE_ICONS = { none: LuBan, circle: LuCircle, heart: LuHeart, star: LuStar } as const;

interface TypographySectionProps {
  form: PosterForm;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  fontOptions: FontOption[];
}


export default function TypographySection({
  form,
  onChange,
  fontOptions,
}: TypographySectionProps) {
  const { t } = useLanguage();
  const previewsRequested = useRef(false);
  const { state, dispatch } = usePosterContext();
  const { fillFromRoute } = useActivityPoster();
  const sportRoute = state.routes.find((route) => route.stats && route.stats.distanceM > 0);
  const isSport = form.posterLayout === "activity";

  // One group open at a time; the sport fields first on a sport poster.
  const [openGroup, setOpenGroup] = useState<string | null>(isSport ? "sport" : "text");
  const toggleGroup = (id: string) => setOpenGroup((current) => (current === id ? null : id));
  useEffect(() => {
    if (isSport) setOpenGroup("sport");
  }, [isSport]);
  // "Edit the texts" from the Routes panel opens the sport group.
  useEffect(
    () =>
      onOpenSettingsTab(({ focus }) => {
        if (focus?.includes("sport")) setOpenGroup("sport");
      }),
    [],
  );

  const layoutId = form.posterLayout || DEFAULT_POSTER_LAYOUT;
  const shapeId = form.mapShape || "none";
  const layoutSummary = [
    t(`style.layout.${layoutId}` as TranslationKey),
    ...(shapeId !== "none" ? [t(`style.shape.${shapeId}` as TranslationKey)] : []),
  ].join(" · ");
  const fontName = fontOptions.find((option) => option.value === form.fontFamily)?.label ?? "";
  const textSummary = [form.displayCity, form.displayCountry, form.customMessage ? `“${form.customMessage}”` : ""]
    .filter(Boolean)
    .join(" · ");
  const displaySummary = form.showPosterText ? fontName : t("style.group.textHidden");

  // Each <option> previews itself in its own typeface, which means every family
  // has to be loaded for the dropdown to look right. That is a lot of bytes for
  // the many users who never change the font, so hold off until they actually
  // reach for the control rather than paying it on mount.
  const preloadFontPreviews = useCallback(() => {
    if (previewsRequested.current) return;
    previewsRequested.current = true;

    const families = fontOptions
      .map((option) => String(option.value || "").trim())
      .filter(Boolean);

    void Promise.allSettled(families.map((family) => ensureFont(family)));
  }, [fontOptions]);

  return (
    <>
      <section className="panel-block">
        <p className="section-summary-label">{t("nav.style")}</p>
        <PanelGroup
          id="text"
          title={t("style.group.text")}
          summary={textSummary}
          open={openGroup === "text"}
          onToggle={() => toggleGroup("text")}
        >
            <div className="field-grid keep-two-mobile">
              <label>
                {t("style.city")}
                <input
                  className="form-control-tall"
                  name="displayCity"
                  value={form.displayCity}
                  onChange={onChange}
                  placeholder={PLACEHOLDER_EXAMPLE_CITY}
                />
              </label>
              <label>
                {t("style.country")}
                <input
                  className="form-control-tall"
                  name="displayCountry"
                  value={form.displayCountry}
                  onChange={onChange}
                  placeholder={PLACEHOLDER_EXAMPLE_COUNTRY}
                />
              </label>
            </div>
            <label className="poster-message-field">
              <span className="poster-message-field__head">
                {t("style.message")}
                <span className="poster-message-field__count" aria-hidden="true">
                  {(form.customMessage ?? "").length}/{MESSAGE_MAX_LENGTH}
                </span>
              </span>
              <input
                className="form-control-tall"
                name="customMessage"
                value={form.customMessage ?? ""}
                onChange={onChange}
                maxLength={MESSAGE_MAX_LENGTH}
                placeholder={t("style.messagePlaceholder")}
              />
              <span className="poster-message-field__hint">{t("style.messageHint")}</span>
            <span className="message-suggestions" role="group" aria-label={t("style.messageIdeas")}>
              {MESSAGE_IDEAS.map((key) => {
                const idea = t(key);
                return (
                  <button
                    key={key}
                    type="button"
                    className={`message-suggestion${form.customMessage === idea ? " is-active" : ""}`}
                    onClick={() => dispatch({ type: "SET_FIELD", name: "customMessage", value: idea })}
                  >
                    {idea}
                  </button>
                );
              })}
            </span>
            </label>
            {(form.customMessage ?? "").trim() ? (
              <MessageLookControls
                x={form.messageX}
                y={form.messageY}
                size={form.messageSize}
                font={form.messageFont}
                style={form.messageStyle}
                isSport={isSport}
              />
            ) : null}
        </PanelGroup>



        {isSport ? (
          <PanelGroup
            id="sport"
            title={t("activity.title")}
            summary={form.activitySubtitle || ""}
            open={openGroup === "sport"}
            onToggle={() => toggleGroup("sport")}
          >
            <fieldset className="sport-fields">
              <legend>{t("activity.title")}</legend>
              <p className="sport-fields__hint">{t("activity.hint")}</p>
              <label>
                {t("activity.subtitle")}
                <input
                  className="form-control-tall"
                  name="activitySubtitle"
                  value={form.activitySubtitle ?? ""}
                  onChange={onChange}
                  placeholder="42,195 KM  |  12.04.2026"
                  maxLength={40}
                />
              </label>
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="sport-fields__row">
                  <span className="sport-fields__num">{t("activity.stat")} {n}</span>
                  <input
                    className="form-control-tall"
                    name={`activityStat${n}`}
                    aria-label={`${t("activity.stat")} ${n} · ${t("activity.value")}`}
                    placeholder={t("activity.value")}
                    value={String(form[`activityStat${n}` as keyof PosterForm] ?? "")}
                    onChange={onChange}
                    maxLength={14}
                  />
                  <input
                    className="form-control-tall"
                    name={`activityStat${n}Label`}
                    aria-label={`${t("activity.stat")} ${n} · ${t("activity.label")}`}
                    placeholder={t("activity.label")}
                    value={String(form[`activityStat${n}Label` as keyof PosterForm] ?? "")}
                    onChange={onChange}
                    maxLength={16}
                  />
                </div>
              ))}
              {sportRoute ? (
                <button type="button" className="sport-fields__refill" onClick={() => fillFromRoute(sportRoute)}>
                  {t("activity.refill")}
                </button>
              ) : null}
            </fieldset>
        
          </PanelGroup>
        ) : null}

        <PanelGroup
          id="layout"
          title={t("style.group.layout")}
          summary={layoutSummary}
          preview={
            <span className={`layout-thumb layout-thumb--${layoutId} layout-thumb--mini`} aria-hidden="true">
              <i className="layout-thumb__map" />
              <i className="layout-thumb__deco" />
              <i className="layout-thumb__title" />
              <i className="layout-thumb__sub" />
            </span>
          }
          open={openGroup === "layout"}
          onToggle={() => toggleGroup("layout")}
        >
            <fieldset className="layout-picker">
              <legend>{t("style.layout")}</legend>
              <div className="layout-picker__grid">
                {POSTER_LAYOUTS.map((id) => (
                  <label key={id} className="layout-picker__option">
                    <input
                      type="radio"
                      name="posterLayout"
                      value={id}
                      checked={(form.posterLayout || DEFAULT_POSTER_LAYOUT) === id}
                      onChange={onChange}
                    />
                    <span className={`layout-thumb layout-thumb--${id}`} aria-hidden="true">
                      <i className="layout-thumb__map" />
                      <i className="layout-thumb__deco" />
                      <i className="layout-thumb__title" />
                      <i className="layout-thumb__sub" />
                    </span>
                    <span className="layout-picker__name">{t(`style.layout.${id}` as TranslationKey)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="layout-picker shape-picker">
              <legend>{t("style.shape")}</legend>
              <div className="shape-picker__grid">
                {MAP_SHAPES.map((id) => {
                  const Icon = SHAPE_ICONS[id];
                  return (
                    <label key={id} className="shape-picker__option">
                      <input
                        type="radio"
                        name="mapShape"
                        value={id}
                        checked={(form.mapShape || "none") === id}
                        onChange={onChange}
                      />
                      <span className={`shape-picker__tile shape-picker__tile--${id}`} aria-hidden="true">
                        <Icon />
                      </span>
                      <span className="layout-picker__name">{t(`style.shape.${id}` as TranslationKey)}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
        </PanelGroup>

        <PanelGroup
          id="display"
          title={t("style.group.display")}
          summary={displaySummary}
          open={openGroup === "display"}
          onToggle={() => toggleGroup("display")}
        >
            <label className="toggle-field">
              <span>{t("style.posterText")}</span>
              <span className="theme-switch">
                <input
                  type="checkbox"
                  name="showPosterText"
                  checked={Boolean(form.showPosterText)}
                  onChange={onChange}
                />
                <span className="theme-switch-track" aria-hidden="true" />
              </span>
            </label>
            {form.showPosterText ? (
              <fieldset className="text-parts">
                <legend>{t("style.parts")}</legend>
                {TEXT_PARTS.map(({ name, label }) => (
                  <label key={name} className="text-parts__chip">
                    <input
                      type="checkbox"
                      name={name}
                      checked={form[name] !== false}
                      onChange={onChange}
                    />
                    <span>{t(label)}</span>
                  </label>
                ))}
              </fieldset>
            ) : null}
            <label className="toggle-field">
              <span>{t("style.overlay")}</span>
              <span className="theme-switch">
                <input
                  type="checkbox"
                  name="showMarkers"
                  checked={Boolean(form.showMarkers)}
                  onChange={onChange}
                />
                <span className="theme-switch-track" aria-hidden="true" />
              </span>
            </label>

            <FontDropdown
              label={t("style.font")}
              value={form.fontFamily ?? ""}
              onOpen={preloadFontPreviews}
              onChange={(value) => dispatch({ type: "SET_FIELD", name: "fontFamily", value })}
              options={fontOptions.map((option) => ({
                value: option.value,
                label: option.label,
                family: option.value || "Space Grotesk",
              }))}
            />
        </PanelGroup>
      </section>
    </>
  );
}
