import SocialLinkGroup from "@/shared/ui/SocialLinkGroup";
import LanguageSwitcher from "@/shared/ui/LanguageSwitcher";
import { useLanguage } from "@/shared/i18n/LanguageContext";

export default function GeneralHeader() {
  const { t } = useLanguage();
  return (
    <header className="general-header" data-od-id="product-header">
      <div className="general-header-main navbar">
        <p className="general-header-context">{t("header.context")}</p>
        <div className="desktop-brand">
          <img
            className="desktop-brand-logo brand-logo"
            src="/assets/logo.svg"
            alt="Maploom logo"
          />
          <div className="desktop-brand-copy brand-copy">
            <h1 className="desktop-brand-title">Maploom</h1>
            <p className="desktop-brand-kicker app-kicker">
              {t("header.tagline")}
            </p>
          </div>
        </div>

        <div className="general-header-actions">
          <LanguageSwitcher />
          <SocialLinkGroup variant="header" />
        </div>
      </div>
    </header>
  );
}
