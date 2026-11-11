import { Link } from "@/core/router/router";

export default function StoreFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="store-footer">
      <div className="store-footer__inner">
        <div className="store-footer__brand">
          <span className="store-brand__name">Maploom</span>
          <p>Personalised map posters, designed by you and printed to last.</p>
        </div>
        <nav className="store-footer__links" aria-label="Footer">
          <div>
            <h3>Shop</h3>
            <Link to="/create">Create your map</Link>
            <Link to="/#designs">Featured designs</Link>
            <Link to="/#pricing">Sizes &amp; prices</Link>
          </div>
          <div>
            <h3>Help</h3>
            <Link to="/#how-it-works">How it works</Link>
            <Link to="/#faq">Shipping &amp; returns</Link>
            <Link to="/cart">Your cart</Link>
          </div>
        </nav>
      </div>
      <div className="store-footer__base">
        <span>© {year} Maploom</span>
        <span>
          Map data ©{" "}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
            OpenStreetMap contributors
          </a>
        </span>
      </div>
    </footer>
  );
}
