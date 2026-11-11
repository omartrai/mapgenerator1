import { Link } from "@/core/router/router";

export default function StoreFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="store-footer">
      <div className="store-footer__inner">
        <div className="store-footer__brand">
          <span className="store-brand__name">Maploom</span>
          <p>Map posters of the places you care about, printed and framed to order.</p>
        </div>
        <nav className="store-footer__links" aria-label="Footer">
          <div>
            <h3>Shop</h3>
            <Link to="/create">Design a poster</Link>
            <Link to="/#designs">Popular designs</Link>
            <Link to="/#pricing">Sizes &amp; prices</Link>
          </div>
          <div>
            <h3>Help</h3>
            <Link to="/#faq">Delivery &amp; payment</Link>
            <Link to="/#faq">FAQ</Link>
            <Link to="/cart">Cart</Link>
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
