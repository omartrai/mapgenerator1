import { LuShoppingBag } from "react-icons/lu";
import { Link, useRouter } from "@/core/router/router";
import { useStore } from "./StoreContext";

interface StoreHeaderProps {
  variant?: "site" | "studio" | "checkout";
}

export default function StoreHeader({ variant = "site" }: StoreHeaderProps) {
  const { cartCount } = useStore();
  const { path } = useRouter();

  return (
    <header
      className={`store-header store-header--${variant}${variant === "studio" ? " general-header" : ""}`}
    >
      <div className="store-header__inner">
        <Link to="/" className="store-brand" aria-label="Maploom home">
          <img src="/assets/logo.svg" alt="" className="store-brand__logo" />
          <span className="store-brand__name">Maploom</span>
        </Link>

        {variant === "site" ? (
          <nav className="store-nav" aria-label="Main">
            <Link to="/#designs" className="store-nav__link">Designs</Link>
            <Link to="/#how-it-works" className="store-nav__link">How it works</Link>
            <Link to="/#pricing" className="store-nav__link">Sizes &amp; prices</Link>
            <Link to="/#faq" className="store-nav__link">FAQ</Link>
          </nav>
        ) : variant === "studio" ? (
          <p className="store-header__context">Poster studio</p>
        ) : (
          <p className="store-header__context">
            <LockGlyph /> Secure checkout
          </p>
        )}

        <div className="store-header__actions">
          {variant === "site" ? (
            <Link to="/create" className="store-btn store-btn--primary store-btn--sm store-header__cta">
              Create your map
            </Link>
          ) : null}
          {variant !== "checkout" ? (
            <Link
              to="/cart"
              className={`store-cart-btn${path === "/cart" ? " is-active" : ""}`}
              aria-label={`Cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
            >
              <LuShoppingBag aria-hidden="true" />
              <span className="store-cart-btn__label">Cart</span>
              {cartCount > 0 ? <span className="store-cart-btn__count">{cartCount}</span> : null}
            </Link>
          ) : null}
        </div>
      </div>
    </header>
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
