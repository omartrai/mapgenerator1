import useInstallPrompt from "../application/useInstallPrompt";
import { FaMobileAlt as MobileIcon } from "react-icons/fa";
import { FiShare as ShareIcon } from "react-icons/fi";
import React, { useState } from "react";
import { INSTALL_DIAGNOSTICS_ENABLED } from "@/core/config";
import { useLanguage } from "@/shared/i18n/LanguageContext";

export default function InstallPrompt() {
  const { t } = useLanguage();
  const {
    deferredPrompt,
    showIosHint,
    showAndroidHint,
    dismissed,
    dismiss,
    handleInstall,
    diagnostics,
  } = useInstallPrompt();
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const diagnosticsText = JSON.stringify(diagnostics, null, 2);

  if (dismissed) return null;

  if (deferredPrompt) {
    return (
      <>
        <div className="install-prompt" role="complementary">
          <span className="install-prompt-text">
            <MobileIcon
              className="install-prompt-mobile-icon"
              aria-hidden="true"
            />
            {t("install.message")}
          </span>
          <div className="install-prompt-actions">
            <button
              type="button"
              className="install-prompt-btn"
              onClick={handleInstall}
            >
              {t("install.addHome")}
            </button>
            <button
              type="button"
              className="install-prompt-dismiss"
              onClick={dismiss}
            >
              {t("install.later")}
            </button>
            {INSTALL_DIAGNOSTICS_ENABLED ? (
              <button
                type="button"
                className="install-prompt-dismiss"
                onClick={() => setIsDiagnosticsOpen(true)}
              >
                {t("install.diagnostics")}
              </button>
            ) : null}
          </div>
        </div>
        {INSTALL_DIAGNOSTICS_ENABLED && isDiagnosticsOpen ? (
          <DiagnosticsModal
            diagnosticsText={diagnosticsText}
            onClose={() => setIsDiagnosticsOpen(false)}
          />
        ) : null}
      </>
    );
  }

  if (showIosHint) {
    return (
      <>
        <div className="install-prompt" role="complementary">
          <span className="install-prompt-text">
            <MobileIcon
              className="install-prompt-mobile-icon"
              aria-hidden="true"
            />
            {t("install.iosBefore")}{" "}
            <span className="install-prompt-share-icon" aria-hidden="true">
              <ShareIcon />
            </span>{" "}
            <strong>{t("install.addHome")}</strong> {t("install.iosAfter")}
          </span>
          <div className="install-prompt-actions">
            <button
              type="button"
              className="install-prompt-dismiss"
              onClick={dismiss}
            >
              {t("install.later")}
            </button>
            {INSTALL_DIAGNOSTICS_ENABLED ? (
              <button
                type="button"
                className="install-prompt-dismiss"
                onClick={() => setIsDiagnosticsOpen(true)}
              >
                {t("install.diagnostics")}
              </button>
            ) : null}
          </div>
        </div>
        {INSTALL_DIAGNOSTICS_ENABLED && isDiagnosticsOpen ? (
          <DiagnosticsModal
            diagnosticsText={diagnosticsText}
            onClose={() => setIsDiagnosticsOpen(false)}
          />
        ) : null}
      </>
    );
  }

  if (showAndroidHint) {
    return (
      <>
        <div className="install-prompt" role="complementary">
          <span className="install-prompt-text">
            <MobileIcon
              className="install-prompt-mobile-icon"
              aria-hidden="true"
            />
            {t("install.android")}{" "}
            <strong>{t("install.installApp")}</strong>{" / "}
            <strong>{t("install.addHome")}</strong>
          </span>
          <div className="install-prompt-actions">
            <button
              type="button"
              className="install-prompt-dismiss"
              onClick={dismiss}
            >
              {t("install.later")}
            </button>
            {INSTALL_DIAGNOSTICS_ENABLED ? (
              <button
                type="button"
                className="install-prompt-dismiss"
                onClick={() => setIsDiagnosticsOpen(true)}
              >
                {t("install.diagnostics")}
              </button>
            ) : null}
          </div>
        </div>
        {INSTALL_DIAGNOSTICS_ENABLED && isDiagnosticsOpen ? (
          <DiagnosticsModal
            diagnosticsText={diagnosticsText}
            onClose={() => setIsDiagnosticsOpen(false)}
          />
        ) : null}
      </>
    );
  }

  return null;
}

function DiagnosticsModal({
  diagnosticsText,
  onClose,
}: {
  diagnosticsText: string;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="install-help-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="install-help-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t("install.title")}
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="install-help-modal-title">{t("install.title")}</h3>
        <pre className="install-help-modal-text">{diagnosticsText}</pre>
        <div className="install-prompt-actions">
          <button type="button" className="install-prompt-dismiss" onClick={onClose}>
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
