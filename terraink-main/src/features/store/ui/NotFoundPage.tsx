import { LuArrowRight, LuMapPinOff } from "react-icons/lu";
import { Link } from "@/core/router/router";
import StoreFooter from "./StoreFooter";
import StoreHeader from "./StoreHeader";
import { useStoreText } from "./storeText";

/** Unknown address: a clear message and the two ways back in. */
export default function NotFoundPage() {
  const { t } = useStoreText();
  return (
    <div className="store-page not-found-page">
      <StoreHeader variant="site" />
      <main className="store-container store-container--narrow not-found">
        <span className="not-found__icon" aria-hidden="true">
          <LuMapPinOff />
        </span>
        <p className="not-found__code">404</p>
        <h1>{t("notFound.title")}</h1>
        <p className="not-found__text">{t("notFound.text")}</p>
        <div className="not-found__actions">
          <Link to="/create" className="store-btn store-btn--primary">
            {t("notFound.create")} <LuArrowRight className="rtl-flip" aria-hidden="true" />
          </Link>
          <Link to="/" className="store-btn store-btn--outline">
            {t("notFound.home")}
          </Link>
        </div>
      </main>
      <StoreFooter />
    </div>
  );
}
