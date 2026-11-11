import {
  CONTACT_EMAIL,
  LEGAL_NOTICE_URL,
  PRIVACY_URL,
} from "@/core/config";
import {
  openLegalDoc,
  LEGAL_DOC_PAGES,
  type LegalDocType,
} from "@/features/legal/application/legalDoc";
import MapAttributionLinks from "@/shared/ui/MapAttributionLinks";
import { trackEvent } from "@/shared/utils/analytics";

/**
 * Legal links point at the build-time static pages so they're real, crawlable
 * URLs, but a plain click opens the in-app modal instead. Modified clicks
 * (new tab/window, middle click) fall through to the static page.
 */
function handleLegalClick(
  event: React.MouseEvent<HTMLAnchorElement>,
  doc: LegalDocType,
) {
  trackEvent(`${doc}_click`);
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
    return;
  }
  event.preventDefault();
  openLegalDoc(doc);
}

/** Reopens Google's consent dialog so visitors can withdraw or change consent. */
function handleCookieSettings() {
  const gfc = (window as any).googlefc;
  gfc?.callbackQueue?.push({
    CONSENT_DATA_READY: () => gfc.showRevocationMessage(),
  });
}

export default function FooterNote() {
  const contactEmail = String(CONTACT_EMAIL ?? "").trim();
  // These vars hold the raw markdown URLs; the links open the in-app modal.
  const imprintAvailable = Boolean(String(LEGAL_NOTICE_URL ?? "").trim());
  const privacyAvailable = Boolean(String(PRIVACY_URL ?? "").trim());
  const hasLegalLinks = Boolean(
    contactEmail || imprintAvailable || privacyAvailable,
  );

  return (
    <footer className="app-footer desktop-footer">
      <div className="desktop-footer-left">
        <p className="source-note">
          {contactEmail && (
            <a
              className="source-link"
              href={`mailto:${contactEmail}`}
              onClick={() => trackEvent("email_click")}
            >
              {contactEmail}
            </a>
          )}
          {contactEmail && (imprintAvailable || privacyAvailable) && " | "}
          {imprintAvailable && (
            <a
              className="source-link"
              href={LEGAL_DOC_PAGES.imprint}
              onClick={(event) => handleLegalClick(event, "imprint")}
            >
              Imprint
            </a>
          )}
          {imprintAvailable && privacyAvailable && " | "}
          {privacyAvailable && (
            <a
              className="source-link"
              href={LEGAL_DOC_PAGES.privacy}
              onClick={(event) => handleLegalClick(event, "privacy")}
            >
              Data Privacy
            </a>
          )}
          {hasLegalLinks && " | "}
          <button
            type="button"
            className="source-link"
            onClick={() => {
              trackEvent("cookie_settings_click");
              handleCookieSettings();
            }}
          >
            Cookie Settings
          </button>
        </p>
      </div>

      <div className="desktop-footer-right">
        {/* Attribution remains available inline where the compact layout needs it. */}
        <div className="desktop-footer-attribution">
          <MapAttributionLinks />
        </div>
      </div>
    </footer>
  );
}
