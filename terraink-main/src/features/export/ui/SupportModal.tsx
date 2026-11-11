import { createPortal } from "react-dom";
import { SOCIAL_INSTAGRAM } from "@/core/config";
import { CloseIcon, InstagramIcon, SuccessIcon } from "@/shared/ui/Icons";
import { trackEvent } from "@/shared/utils/analytics";
import { useLanguage } from "@/shared/i18n/LanguageContext";

interface SupportModalProps {
  posterNumber: number;
  onClose: () => void;
  titleId?: string;
}

export default function SupportModal({
  posterNumber,
  onClose,
  titleId = "export-support-modal-title",
}: SupportModalProps) {
  const { t } = useLanguage();
  const instagramUrl = String(SOCIAL_INSTAGRAM ?? "").trim();

  return createPortal(
    <div
      className="picker-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="modal-box picker-modal support-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="btn btn-ghost btn-square support-modal__close"
          onClick={onClose}
          aria-label={t("common.close")}
        >
          <CloseIcon />
        </button>
        <div className="support-modal__body">
          <p className="support-modal__headline" id={titleId}>
            <SuccessIcon aria-hidden="true" />
            <span>{t("support.ready")}</span>
          </p>
          <p className="support-modal__text">
            {t("support.message")}
          </p>
          <div className="support-modal__actions">
            {instagramUrl ? (
              <a
                className="support-modal__instagram"
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackEvent("follow_click")}
              >
                <InstagramIcon /> {t("support.follow")}
              </a>
            ) : (
              <button
                type="button"
                className="support-modal__dismiss"
                onClick={onClose}
              >
                {t("common.close")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
