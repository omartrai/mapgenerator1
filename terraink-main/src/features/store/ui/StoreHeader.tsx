import { useEffect, useRef, useState } from "react";
import { LuChevronDown, LuShoppingCart } from "react-icons/lu";
import { Link, useRouter } from "@/core/router/router";
import BrandMark, { BrandWordmark } from "@/shared/ui/BrandMark";
import { useLanguage, type AppLanguage } from "@/shared/i18n/LanguageContext";
import { useStore } from "./StoreContext";
import { useStoreText, type StoreTextKey } from "./storeText";

interface StoreHeaderProps {
  variant?: "site" | "studio" | "checkout";
}

const NAV: { to: string; label: StoreTextKey }[] = [
  { to: "/", label: "nav.home" },
  { to: "/create", label: "nav.design" },
  { to: "/#designs", label: "nav.designs" },
  { to: "/collection", label: "nav.collection" },
  { to: "/#faq", label: "nav.faq" },
];

const LANGUAGES: { code: AppLanguage; label: string; name: string }[] = [
  { code: "fr", label: "FR", name: "Français" },
  { code: "ar", label: "ع", name: "العربية" },
  { code: "en", label: "EN", name: "English" },
];

export default function StoreHeader({ variant = "site" }: StoreHeaderProps) {
  const { cartCount } = useStore();
  const { t } = useStoreText();
  const { path } = useRouter();
  const isActive = (to: string) =>
    to === "/" ? path === "/" : to.startsWith("/#") ? false : path === to || path.startsWith(`${to}/`);

  return (
    <header
      className={`store-header store-header--${variant}${variant === "studio" ? " general-header" : ""}`}
    >
      <div className="store-header__inner">
        <Link to="/" className="store-brand" aria-label="Noria">
          <BrandMark />
          <BrandWordmark />
        </Link>

        {variant !== "checkout" ? (
          <nav className="store-nav" aria-label={t("nav.main")}>
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`store-nav__link${item.to === "/create" ? " store-nav__link--design" : ""}${isActive(item.to) ? " is-active" : ""}`}
              >
                {t(item.label)}
              </Link>
            ))}
          </nav>
        ) : (
          <p className="store-header__context">
            <LockGlyph /> {t("header.secure")}
          </p>
        )}

        <div className="store-header__actions">
          <LanguageMenu />
          {variant !== "checkout" ? (
            <Link
              to="/cart"
              className={`store-cart-btn${path === "/cart" ? " is-active" : ""}`}
              aria-label={t("header.cart", { count: cartCount })}
            >
              <LuShoppingCart aria-hidden="true" />
              <span className="store-cart-btn__label" aria-hidden="true">
                {t("header.cartLabel")}
              </span>
              <span key={cartCount} className="store-cart-btn__count">{cartCount}</span>
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function LanguageMenu() {
  const { language, setLanguage } = useLanguage();
  const { t } = useStoreText();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGUAGES.find((entry) => entry.code === language) ?? LANGUAGES[0];

  useEffect(() => {
    if (!open) return undefined;
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return (
    <div className="lang-menu" ref={ref}>
      <button
        type="button"
        className="lang-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t("header.language")}: ${current.name}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span lang={current.code}>{current.label}</span>
        <LuChevronDown aria-hidden="true" />
      </button>
      {open ? (
        <div className="lang-menu__list" role="menu">
          {LANGUAGES.map((entry) => (
            <button
              key={entry.code}
              type="button"
              role="menuitemradio"
              aria-checked={language === entry.code}
              className={language === entry.code ? "is-active" : ""}
              lang={entry.code}
              onClick={() => {
                setLanguage(entry.code);
                setOpen(false);
              }}
            >
              {entry.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function LockGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true" className="store-lock-glyph">
      <path
        fill="currentColor"
        d="M8 1.5a3 3 0 0 0-3 3V6H4a1 1 0 0 0-1 1v6.5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-1V4.5a3 3 0 0 0-3-3Zm-1.6 3a1.6 1.6 0 1 1 3.2 0V6H6.4V4.5Z"
      />
    </svg>
  );
}
