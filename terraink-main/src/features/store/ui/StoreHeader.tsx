import { useEffect, useRef, useState, type FormEvent } from "react";
import { LuChevronDown, LuSearch, LuShoppingCart } from "react-icons/lu";
import { Link, useRouter } from "@/core/router/router";
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
  { to: "/#pricing", label: "nav.sizes" },
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
  const { path, navigate } = useRouter();
  const [query, setQuery] = useState("");

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    const place = query.trim();
    navigate(place ? `/create?place=${encodeURIComponent(place)}` : "/create");
  };

  const isActive = (to: string) => (to === "/" ? path === "/" : to === "/create" && path === "/create");

  return (
    <header
      className={`store-header store-header--${variant}${variant === "studio" ? " general-header" : ""}`}
    >
      <div className="store-header__inner">
        <Link to="/" className="store-brand" aria-label="Maploom">
          <BrandMark />
          <span className="store-brand__name">Maploom</span>
        </Link>

        {variant === "site" ? (
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
        ) : variant === "studio" ? (
          <p className="store-header__context">{t("header.studio")}</p>
        ) : (
          <p className="store-header__context">
            <LockGlyph /> {t("header.secure")}
          </p>
        )}

        <div className="store-header__actions">
          {variant === "site" ? (
            <form className="store-search" role="search" onSubmit={onSearch}>
              <button type="submit" aria-label={t("header.searchButton")}>
                <LuSearch aria-hidden="true" />
              </button>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("header.search")}
                aria-label={t("header.searchLabel")}
              />
            </form>
          ) : null}
          <LanguageMenu />
          {variant !== "checkout" ? (
            <Link
              to="/cart"
              className={`store-cart-btn${path === "/cart" ? " is-active" : ""}`}
              aria-label={t("header.cart", { count: cartCount })}
            >
              <LuShoppingCart aria-hidden="true" />
              <span className="store-cart-btn__count">{cartCount}</span>
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}

/** Map-pin logo in the brand red. */
function BrandMark() {
  return (
    <svg className="store-brand__logo" viewBox="0 0 32 32" aria-hidden="true">
      <path
        d="M16 2.5c-6.1 0-11 4.8-11 10.8 0 7.6 9 15.3 10.2 16.3.5.4 1.1.4 1.6 0C18 28.6 27 20.9 27 13.3 27 7.3 22.1 2.5 16 2.5Z"
        fill="var(--s-accent)"
      />
      <path
        d="M10.5 18.5v-7.2l3.6 3.4 1.9-3.7 1.9 3.7 3.6-3.4v7.2"
        fill="none"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
