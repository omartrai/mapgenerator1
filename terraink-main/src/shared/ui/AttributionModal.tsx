import { useEffect } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "./Icons";
import MapAttributionLinks from "./MapAttributionLinks";
import { useLanguage } from "@/shared/i18n/LanguageContext";

interface AttributionModalProps {
  onClose: () => void;
}

/** Desktop map-attribution dialog, opened from the footer ⓘ button. */
export default function AttributionModal({ onClose }: AttributionModalProps) {
  const { t } = useLanguage();
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return createPortal(
    <div
      className="about-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="modal-box attribution-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="attribution-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="btn btn-ghost btn-square about-modal-close"
          onClick={onClose}
          aria-label={t("common.close")}
        >
          <CloseIcon />
        </button>
        <h2 className="attribution-modal-title" id="attribution-modal-title">
          {t("attribution.title")}
        </h2>
        <p className="attribution-modal-line">
          {t("attribution.mapData")} &copy;{" "}
          <a
            className="source-link"
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
          >
            OpenStreetMap contributors
          </a>
          .
        </p>
        <p className="attribution-modal-line">
          <MapAttributionLinks />
        </p>
      </div>
    </div>,
    document.body,
  );
}
