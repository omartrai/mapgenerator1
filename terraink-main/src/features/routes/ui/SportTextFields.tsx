import { useRef, useState, type ChangeEvent } from "react";
import { LuImagePlus } from "react-icons/lu";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import type { PosterForm } from "@/features/poster/application/posterReducer";
import { photoFrameFromForm, PHOTO_ZOOM_MAX } from "@/features/poster/domain/posterLayout";
import { useActivityPoster } from "@/features/routes/application/useActivityPoster";
import { photoFileToDataUrl } from "@/shared/utils/image";
import { useLanguage, type TranslationKey } from "@/shared/i18n/LanguageContext";

type Field = { name: keyof PosterForm; label: TranslationKey; max?: number; placeholder?: string };

/** What each design prints, in the order it reads on the poster. */
const FIELDS: Record<string, { fields: Field[]; stats: number; photo?: boolean }> = {
  race: {
    fields: [
      { name: "displayCity", label: "sport.fields.title", max: 40, placeholder: "Marathon de Marrakech" },
      { name: "displayCountry", label: "sport.fields.place", max: 40, placeholder: "Marrakech" },
      { name: "sportName", label: "sport.fields.name", max: 30 },
      { name: "sportBig", label: "sport.fields.big.race", max: 6, placeholder: "2026" },
    ],
    stats: 3,
  },
  bib: {
    fields: [
      { name: "sportName", label: "sport.fields.name", max: 30 },
      { name: "sportBig", label: "sport.fields.big.bib", max: 7, placeholder: "30946" },
      { name: "displayCity", label: "sport.fields.title", max: 34, placeholder: "Marathon de Marrakech" },
    ],
    stats: 3,
  },
  green: {
    fields: [
      { name: "displayCity", label: "sport.fields.title", max: 16, placeholder: "Marrakech" },
      { name: "displayCountry", label: "sport.fields.subtitleGreen", max: 24, placeholder: "Marathon" },
      { name: "sportBig", label: "sport.fields.big.green", max: 9, placeholder: "3:42:11" },
      { name: "activitySubtitle", label: "sport.fields.infoLine", max: 50, placeholder: "5:16 /km  ·  26 janvier 2026" },
      { name: "sportName", label: "sport.fields.name", max: 30 },
      { name: "sportBib", label: "sport.fields.bib", max: 10, placeholder: "23145" },
    ],
    stats: 3,
  },
  bold: {
    fields: [
      { name: "sportBig", label: "sport.fields.big.bold", max: 7, placeholder: "4,37" },
      { name: "displayCity", label: "sport.fields.title", max: 30, placeholder: "Na Medina" },
      { name: "displayCountry", label: "sport.fields.place", max: 30, placeholder: "Marrakech" },
      { name: "activitySubtitle", label: "sport.fields.date", max: 20, placeholder: "OCT 2025" },
      { name: "sportName", label: "sport.fields.name", max: 30 },
    ],
    stats: 0,
  },
  photorun: {
    fields: [
      { name: "sportName", label: "sport.fields.name", max: 30 },
      { name: "sportBib", label: "sport.fields.bib", max: 10, placeholder: "#45591" },
      { name: "displayCountry", label: "sport.fields.place", max: 30, placeholder: "Casablanca, Maroc" },
      { name: "activitySubtitle", label: "sport.fields.date", max: 20, placeholder: "27.04.25" },
      { name: "sportBig", label: "sport.fields.big.photorun", max: 10, placeholder: "03:23:14" },
      { name: "displayCity", label: "sport.fields.title", max: 34, placeholder: "Marathon de Casablanca" },
    ],
    stats: 2,
    photo: true,
  },
  topo: {
    fields: [
      { name: "displayCity", label: "sport.fields.title", max: 30, placeholder: "Toubkal" },
      { name: "activitySubtitle", label: "sport.fields.subtitle", max: 44 },
    ],
    stats: 4,
  },
};

function PhotoField() {
  const { t } = useLanguage();
  const { state, dispatch } = usePosterContext();
  const { form } = state;
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const frame = photoFrameFromForm(form);
  const set = (fields: Record<string, string | boolean>) => dispatch({ type: "SET_FORM_FIELDS", fields });

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      set({ photo: await photoFileToDataUrl(file, 2400), photoZoom: "1", photoX: "0.5", photoY: "0.5" });
    } finally {
      setBusy(false);
    }
  };

  const slider = (name: "photoZoom" | "photoX" | "photoY", label: TranslationKey, min: number, max: number, value: number) => (
    <label className="sport-photo__slider">
      <span>{t(label)}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={0.01}
        value={value}
        onChange={(event) => set({ [name]: event.target.value })}
      />
    </label>
  );

  return (
    <div className="sport-photo">
      <p className="sport-text__label">{t("sport.fields.photo")}</p>
      <button type="button" className="sport-photo__pick" onClick={() => inputRef.current?.click()} disabled={busy}>
        {form.photo ? <img src={form.photo} alt="" /> : <LuImagePlus aria-hidden="true" />}
        <span>{form.photo ? t("sport.fields.photoChange") : t("sport.fields.photoAdd")}</span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={onFile} />
      {form.photo ? (
        <>
          {slider("photoZoom", "sport.fields.photoZoom", 1, PHOTO_ZOOM_MAX, frame.zoom)}
          {slider("photoX", "sport.fields.photoX", 0, 1, frame.x)}
          {slider("photoY", "sport.fields.photoY", 0, 1, frame.y)}
          <label className="toggle-field">
            <span>{t("sport.fields.photoMono")}</span>
            <span className="theme-switch">
              <input
                type="checkbox"
                checked={form.photoMono !== false}
                onChange={(event) => set({ photoMono: event.target.checked })}
              />
              <span className="theme-switch-track" aria-hidden="true" />
            </span>
          </label>
        </>
      ) : null}
    </div>
  );
}

/** Text step of a sport or trail design: only the lines that design prints. */
export default function SportTextFields({
  design,
  form,
  onChange,
}: {
  design: string;
  form: PosterForm;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const { t } = useLanguage();
  const { state } = usePosterContext();
  const { fillFromRoute } = useActivityPoster();
  const spec = FIELDS[design];
  if (!spec) return null;
  const route = state.routes.find((entry) => entry.stats && entry.stats.distanceM > 0);
  const value = (name: keyof PosterForm) => String(form[name] ?? "");

  return (
    <div className="sport-text">
      {spec.photo ? <PhotoField /> : null}
      <div className="sport-text__grid">
        {spec.fields.map((field) => (
          <label key={field.name} className={field.name === "displayCity" ? "is-wide" : undefined}>
            {t(field.label)}
            <input
              className="form-control-tall"
              name={field.name}
              value={value(field.name)}
              onChange={onChange}
              maxLength={field.max}
              placeholder={field.placeholder}
            />
          </label>
        ))}
      </div>
      {spec.stats > 0 ? (
        <fieldset className="sport-fields">
          <legend className="sport-text__label">{t("sport.fields.stats")}</legend>
          {Array.from({ length: spec.stats }, (_, i) => i + 1).map((n) => (
            <div key={n} className="sport-fields__row">
              <input
                className="form-control-tall"
                name={`activityStat${n}Label`}
                aria-label={`${t("activity.stat")} ${n} · ${t("activity.label")}`}
                placeholder={t("activity.label")}
                value={value(`activityStat${n}Label` as keyof PosterForm)}
                onChange={onChange}
                maxLength={18}
              />
              <input
                className="form-control-tall"
                name={`activityStat${n}`}
                aria-label={`${t("activity.stat")} ${n} · ${t("activity.value")}`}
                placeholder={t("activity.value")}
                value={value(`activityStat${n}` as keyof PosterForm)}
                onChange={onChange}
                maxLength={18}
              />
            </div>
          ))}
        </fieldset>
      ) : null}
      {route ? (
        <button type="button" className="sport-fields__refill" onClick={() => fillFromRoute(route)}>
          {t("activity.refill")}
        </button>
      ) : null}
    </div>
  );
}
