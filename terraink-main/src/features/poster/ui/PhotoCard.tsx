import { useRef, useState } from "react";
import { LuImagePlus, LuTrash2 } from "react-icons/lu";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { useLanguage } from "@/shared/i18n/LanguageContext";
import { photoFileToDataUrl } from "@/shared/utils/image";

/** Upload, replace or remove the photo of the photo + map layout. */
export default function PhotoCard() {
  const { t } = useLanguage();
  const { state, dispatch } = usePosterContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const photo = state.form.photo;
  const mono = state.form.photoMono !== false;

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(false);
    try {
      dispatch({ type: "SET_FIELD", name: "photo", value: await photoFileToDataUrl(file) });
    } catch {
      setError(true);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="photo-card">
      <div className="photo-card__row">
        <span
          className={`photo-card__thumb${mono ? " is-mono" : ""}`}
          style={photo ? { backgroundImage: `url(${photo})` } : undefined}
          aria-hidden="true"
        />
        <span>
          <p className="photo-card__title">{t("photo.title")}</p>
          <p className="photo-card__note">{t("photo.note")}</p>
        </span>
      </div>
      <div className="photo-card__actions">
        <button
          type="button"
          className="photo-card__btn photo-card__btn--primary"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <LuImagePlus aria-hidden="true" />
          {photo ? t("photo.change") : t("photo.add")}
        </button>
        {photo ? (
          <button type="button" className="photo-card__btn" onClick={() => dispatch({ type: "SET_FIELD", name: "photo", value: "" })}>
            <LuTrash2 aria-hidden="true" />
            {t("photo.remove")}
          </button>
        ) : null}
      </div>
      <label className="photo-card__mono">
        <input
          type="checkbox"
          checked={mono}
          onChange={(event) => dispatch({ type: "SET_FIELD", name: "photoMono", value: event.target.checked })}
        />
        {t("photo.mono")}
      </label>
      {error ? (
        <p className="photo-card__error" role="alert">
          {t("photo.error")}
        </p>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        hidden
        onChange={(event) => void pick(event.target.files?.[0])}
      />
    </div>
  );
}
