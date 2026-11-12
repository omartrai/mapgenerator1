import { Link } from "@/core/router/router";
import BrandMark, { BrandWordmark } from "@/shared/ui/BrandMark";
import { useStoreText } from "./storeText";

export default function StoreFooter() {
  const { t } = useStoreText();
  const year = new Date().getFullYear();
  return (
    <footer className="store-footer">
      <div className="store-footer__inner">
        <div className="store-footer__brand">
          <span className="store-brand store-footer__logo">
            <BrandMark />
            <BrandWordmark />
          </span>
          <p>{t("footer.about")}</p>
        </div>
        <nav className="store-footer__links" aria-label="Footer">
          <div>
            <h3>{t("footer.shop")}</h3>
            <Link to="/create">{t("nav.design")}</Link>
            <Link to="/#designs">{t("grid.title")}</Link>
            <Link to="/collection">{t("nav.collection")}</Link>
          </div>
          <div>
            <h3>{t("footer.help")}</h3>
            <Link to="/suivi">{t("track.title")}</Link>
            <Link to="/#faq">{t("footer.delivery")}</Link>
            <Link to="/#faq">{t("nav.faq")}</Link>
            <Link to="/cart">{t("footer.cart")}</Link>
          </div>
          <div>
            <h3>{t("footer.legal")}</h3>
            <Link to="/legal/cgv">{t("legal.cgv")}</Link>
            <Link to="/legal/confidentialite">{t("legal.confidentialite")}</Link>
            <Link to="/legal/mentions-legales">{t("legal.mentions-legales")}</Link>
          </div>
        </nav>
      </div>
      <div className="store-footer__base">
        <span>© {year} Noria</span>
        <span>
          {t("footer.mapData")}{" "}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
            {t("footer.osm")}
          </a>
        </span>
      </div>
    </footer>
  );
}
