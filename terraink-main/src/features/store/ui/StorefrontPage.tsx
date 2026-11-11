import { useEffect, useState } from "react";
import {
  LuArrowRight,
  LuBanknote,
  LuChevronRight,
  LuFrame,
  LuPrinter,
  LuTruck,
} from "react-icons/lu";
import { Link } from "@/core/router/router";
import {
  FRAME_OPTIONS,
  FREE_SHIPPING_THRESHOLD,
  PRINT_SIZES,
  formatMoney,
  getFrame,
  getPrintSize,
  resolveDimensions,
  unitPrice,
} from "../domain/catalog";
import { DESIGN_PRESETS, type DesignPreset } from "../domain/presets";
import FramedPoster from "./FramedPoster";
import StoreFooter from "./StoreFooter";
import StoreHeader from "./StoreHeader";

const preset = (id: string) => DESIGN_PRESETS.find((entry) => entry.id === id)!;

const SLIDES = [
  { preset: "new-york", kicker: "New in", title: ["City", "posters"], note: "Midnight Blue edition" },
  { preset: "paris", kicker: "Bestseller", title: ["Paris in", "oak"], note: "Carrara edition" },
  { preset: "marrakech", kicker: "Warm tones", title: ["Sun-baked", "streets"], note: "Terracotta edition" },
];

const FRAME_TILES = [
  { frame: "black", preset: "amsterdam" },
  { frame: "white", preset: "tokyo" },
  { frame: "oak", preset: "lisbon" },
] as const;

const EUROPE = new Set(["paris", "lisbon", "amsterdam", "london", "barcelona"]);
const TABS = [
  { id: "all", label: "All designs", match: () => true },
  { id: "europe", label: "Europe", match: (p: DesignPreset) => EUROPE.has(p.id) },
  { id: "world", label: "Rest of the world", match: (p: DesignPreset) => !EUROPE.has(p.id) },
];

const FAQ = [
  {
    q: "How long does delivery take?",
    a: "Every poster is printed to order. Unframed prints leave us in 3 to 5 working days, framed ones in 5 to 7.",
  },
  {
    q: "How do I pay?",
    a: "Cash or card when the parcel arrives. We call or email you to confirm the order before we print it.",
  },
  {
    q: "Can I change my design after ordering?",
    a: "Yes, until it goes to print. Contact us with your order number and the change you want.",
  },
  {
    q: "What paper and frames do you use?",
    a: "200 g/m² matte paper with pigment inks. Frames are black aluminium, white wood or oak veneer, with shatterproof acrylic instead of glass.",
  },
  {
    q: "Which places can I map?",
    a: "Anywhere covered by OpenStreetMap, which is almost everywhere: a city, a village, a single street.",
  },
];

export default function StorefrontPage() {
  const minPrice = Math.min(...PRINT_SIZES.map((size) => size.price));

  return (
    <div className="store-page store-page--home">
      <StoreHeader variant="site" />

      <main>
        <HeroSlider />

        <section className="home-block home-cats" aria-labelledby="cats-title">
          <div className="home-cats__intro">
            <h2 id="cats-title" className="home-heading">
              Shop{" "}
              <br />
              by frame
            </h2>
            <span className="home-rule" aria-hidden="true" />
            <div className="home-cats__count">
              <LuFrame aria-hidden="true" />
              <p>
                <strong>4 finishes</strong>
                <span>including unframed</span>
              </p>
            </div>
            <Link to="/create" className="home-textlink">
              All options <LuChevronRight aria-hidden="true" />
            </Link>
          </div>
          {FRAME_TILES.map((tile) => {
            const design = preset(tile.preset);
            const frame = getFrame(tile.frame);
            return (
              <Link key={tile.frame} to={`/create?preset=${design.id}`} className="cat-tile">
                <div className="cat-tile__visual">
                  <FramedPoster
                    src={design.image}
                    alt=""
                    frameId={tile.frame}
                    ratio={0.75}
                    size="sm"
                  />
                </div>
                <span className="cat-tile__label">{frame.label}</span>
              </Link>
            );
          })}
        </section>

        <section className="home-block home-promos" aria-label="Offers">
          <Link to="/create" className="promo promo--wall">
            <div className="promo__scene" aria-hidden="true">
              <div className="promo__poster promo__poster--a">
                <FramedPoster src={preset("london").image} alt="" frameId="oak" ratio={0.75} size="sm" />
              </div>
              <div className="promo__shelf" />
            </div>
            <div className="promo__box">
              <p className="promo__kicker">Over {formatMoney(FREE_SHIPPING_THRESHOLD)}</p>
              <p className="promo__title">Free delivery</p>
              <span className="promo__btn">Shop now</span>
            </div>
          </Link>
          <Link to="/create" className="promo promo--sage">
            <div className="promo__scene" aria-hidden="true">
              <div className="promo__poster promo__poster--b">
                <FramedPoster src={preset("barcelona").image} alt="" frameId="white" ratio={0.707} size="sm" />
              </div>
              <div className="promo__poster promo__poster--c">
                <FramedPoster src={preset("tokyo").image} alt="" frameId="black" ratio={0.75} size="sm" />
              </div>
            </div>
            <div className="promo__box">
              <p className="promo__kicker">No card needed online</p>
              <p className="promo__title">Pay on delivery</p>
              <span className="promo__btn">Shop now</span>
            </div>
          </Link>
        </section>

        <ProductGrid />

        <section className="home-block service-row" aria-label="Our service">
          <div>
            <LuPrinter aria-hidden="true" />
            <p><strong>Printed to order</strong><span>200 g/m² matte paper</span></p>
          </div>
          <div>
            <LuFrame aria-hidden="true" />
            <p><strong>Ready to hang</strong><span>Black, white or oak</span></p>
          </div>
          <div>
            <LuTruck aria-hidden="true" />
            <p><strong>Ships in 3–7 days</strong><span>Free over {formatMoney(FREE_SHIPPING_THRESHOLD)}</span></p>
          </div>
          <div>
            <LuBanknote aria-hidden="true" />
            <p><strong>Pay on delivery</strong><span>Cash or card</span></p>
          </div>
        </section>

        <section className="home-block" id="pricing" aria-labelledby="pricing-title">
          <div className="home-head">
            <div>
              <h2 id="pricing-title" className="home-heading">Sizes &amp; prices</h2>
              <span className="home-rule" aria-hidden="true" />
            </div>
            <p className="home-head__note">Prints from {formatMoney(minPrice)}. Any size can be framed.</p>
          </div>
          <div className="size-table">
            {PRINT_SIZES.map((size) => (
              <div key={size.id} className="size-cell">
                {size.popular ? <span className="badge badge--accent">Popular</span> : null}
                <div className="size-cell__shape" aria-hidden="true">
                  <span style={{ width: `${size.widthCm * 1.4}px`, height: `${size.heightCm * 1.4}px` }} />
                </div>
                <p className="size-cell__name">{size.label}</p>
                <p className="size-cell__dims">
                  {size.id.startsWith("a") ? `${size.widthCm} × ${size.heightCm} cm` : "Poster size"}
                </p>
                <p className="size-cell__price">
                  {formatMoney(size.price)}
                  <span>Framed {formatMoney(size.price + size.framePrice)}</span>
                </p>
              </div>
            ))}
          </div>
          <ul className="frame-list">
            {FRAME_OPTIONS.filter((frame) => frame.id !== "none").map((frame) => (
              <li key={frame.id}>
                <span className={`frame-card__swatch frame-card__swatch--${frame.id}`} aria-hidden="true" />
                <span><strong>{frame.label}.</strong> {frame.description}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="home-block home-faq" id="faq" aria-labelledby="faq-title">
          <div>
            <h2 id="faq-title" className="home-heading">Questions</h2>
            <span className="home-rule" aria-hidden="true" />
            <p className="home-faq__note">
              Something else? Write to us after ordering and quote your order number.
            </p>
          </div>
          <div className="faq">
            {FAQ.map((entry) => (
              <details key={entry.q} className="faq__item">
                <summary>{entry.q}</summary>
                <p>{entry.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <StoreFooter />
    </div>
  );
}

function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return undefined;
    const timer = window.setTimeout(() => setIndex((current) => (current + 1) % SLIDES.length), 6000);
    return () => window.clearTimeout(timer);
  }, [index, paused]);

  return (
    <section
      className="hero"
      aria-roledescription="carousel"
      aria-label="Featured designs"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {SLIDES.map((slide, slideIndex) => {
        const design = preset(slide.preset);
        const { widthCm, heightCm } = resolveDimensions(design.product);
        const isActive = slideIndex === index;
        return (
          <div
            key={slide.preset}
            className={`hero__slide${isActive ? " is-active" : ""}`}
            aria-hidden={!isActive}
            role="group"
            aria-roledescription="slide"
            aria-label={`${slideIndex + 1} of ${SLIDES.length}`}
          >
            <div className="hero__copy">
              <p className="hero__brand">
                Maploom
                <span>{slide.note}</span>
              </p>
              <p className="hero__kicker">{slide.kicker}</p>
              <h1 className="hero__title">
                {slide.title[0]}
                <br />
                {slide.title[1]}
              </h1>
              <Link
                to={`/create?preset=${design.id}`}
                className="store-btn store-btn--primary"
                tabIndex={isActive ? 0 : -1}
              >
                Shop now <LuArrowRight aria-hidden="true" />
              </Link>
              <span className="hero__numeral" aria-hidden="true">
                {String(slideIndex + 1).padStart(2, "0")}
              </span>
            </div>
            <div className="hero__art">
              <span className="hero__disc" aria-hidden="true" />
              <div className="hero__poster">
                <FramedPoster
                  src={design.image}
                  alt={`${design.city} map poster`}
                  frameId={design.product.frameId}
                  ratio={widthCm / heightCm}
                  size="lg"
                  loading={slideIndex === 0 ? "eager" : "lazy"}
                />
              </div>
            </div>
          </div>
        );
      })}
      <div className="hero__dots">
        {SLIDES.map((slide, slideIndex) => (
          <button
            key={slide.preset}
            type="button"
            className={slideIndex === index ? "is-active" : ""}
            aria-label={`Show slide ${slideIndex + 1}`}
            aria-current={slideIndex === index}
            onClick={() => setIndex(slideIndex)}
          />
        ))}
      </div>
    </section>
  );
}

function ProductGrid() {
  const [tab, setTab] = useState("all");
  const active = TABS.find((entry) => entry.id === tab) ?? TABS[0];
  const items = DESIGN_PRESETS.filter(active.match);

  return (
    <section className="home-block" id="designs" aria-labelledby="designs-title">
      <div className="home-head">
        <div>
          <h2 id="designs-title" className="home-heading">Popular designs</h2>
          <span className="home-rule" aria-hidden="true" />
        </div>
        <div className="home-tabs" role="tablist" aria-label="Filter designs">
          {TABS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={entry.id === tab}
              className={entry.id === tab ? "is-active" : ""}
              onClick={() => setTab(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </div>
        <Link to="/create" className="store-btn store-btn--outline store-btn--sm">
          Start from scratch <LuArrowRight aria-hidden="true" />
        </Link>
      </div>

      <div className="product-grid">
        {items.map((design) => {
          const { widthCm, heightCm } = resolveDimensions(design.product);
          const size = getPrintSize(design.product.sizeId);
          const frame = getFrame(design.product.frameId);
          return (
            <Link key={design.id} to={`/create?preset=${design.id}`} className="product-card">
              <div className="product-card__visual">
                <span className="badge">{size.label}</span>
                <FramedPoster
                  src={design.image}
                  alt={`${design.city} map poster, ${design.themeLabel} colours`}
                  frameId={design.product.frameId}
                  ratio={widthCm / heightCm}
                  size="md"
                />
                <span className="product-card__hover">Customise</span>
              </div>
              <p className="product-card__meta">{design.themeLabel} · {frame.label}</p>
              <h3 className="product-card__title">{design.city}</h3>
              <p className="product-card__price">{formatMoney(unitPrice(design.product))}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
