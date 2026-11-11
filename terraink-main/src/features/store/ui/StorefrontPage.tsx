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
  resolveDimensions,
  unitPrice,
  type FrameId,
} from "../domain/catalog";
import { DESIGN_PRESETS, MOROCCAN_PRESET_IDS, type DesignPreset } from "../domain/presets";
import FramedPoster from "./FramedPoster";
import StoreFooter from "./StoreFooter";
import StoreHeader from "./StoreHeader";
import { useStoreText, type StoreTextKey } from "./storeText";

const preset = (id: string) => DESIGN_PRESETS.find((entry) => entry.id === id)!;

const SLIDES = [
  { preset: "marrakech", n: 1 },
  { preset: "chefchaouen", n: 2 },
  { preset: "casablanca", n: 3 },
];

const FRAME_TILES: { frame: FrameId; preset: string }[] = [
  { frame: "black", preset: "casablanca" },
  { frame: "white", preset: "rabat" },
  { frame: "oak", preset: "fes" },
];

const TABS: { id: string; label: StoreTextKey; match: (p: DesignPreset) => boolean }[] = [
  { id: "morocco", label: "grid.morocco", match: (p) => MOROCCAN_PRESET_IDS.has(p.id) },
  { id: "world", label: "grid.world", match: (p) => !MOROCCAN_PRESET_IDS.has(p.id) },
  { id: "all", label: "grid.all", match: () => true },
];

const FAQ_COUNT = 5;

export default function StorefrontPage() {
  const { t, money, frameLabel, sizeLabel, lines } = useStoreText();
  const minPrice = Math.min(...PRINT_SIZES.map((size) => size.price));
  const [catsLine1, catsLine2] = lines("cats.title");

  return (
    <div className="store-page store-page--home">
      <StoreHeader variant="site" />

      <main>
        <HeroSlider />

        <section className="home-block home-cats" aria-labelledby="cats-title">
          <div className="home-cats__intro">
            <h2 id="cats-title" className="home-heading">
              {catsLine1}{" "}
              <br />
              {catsLine2}
            </h2>
            <span className="home-rule" aria-hidden="true" />
            <div className="home-cats__count">
              <LuFrame aria-hidden="true" />
              <p>
                <strong>{t("cats.count")}</strong>
                <span>{t("cats.countNote")}</span>
              </p>
            </div>
            <Link to="/create" className="home-textlink">
              {t("cats.all")} <LuChevronRight className="rtl-flip" aria-hidden="true" />
            </Link>
          </div>
          {FRAME_TILES.map((tile) => {
            const design = preset(tile.preset);
            return (
              <Link key={tile.frame} to={`/create?preset=${design.id}`} className="cat-tile">
                <div className="cat-tile__visual">
                  <FramedPoster src={design.image} alt="" frameId={tile.frame} ratio={0.75} size="sm" />
                </div>
                <span className="cat-tile__label">{frameLabel(tile.frame)}</span>
              </Link>
            );
          })}
        </section>

        <section className="home-block home-promos" aria-label={t("promo.label")}>
          <Link to="/create" className="promo promo--wall">
            <div className="promo__scene" aria-hidden="true">
              <div className="promo__poster promo__poster--a">
                <FramedPoster src={preset("tangier").image} alt="" frameId="oak" ratio={0.707} size="sm" />
              </div>
              <div className="promo__shelf" />
            </div>
            <div className="promo__box">
              <p className="promo__kicker">{t("promo.free.kicker", { amount: money(FREE_SHIPPING_THRESHOLD) })}</p>
              <p className="promo__title">{t("promo.free.title")}</p>
              <span className="promo__btn">{t("promo.cta")}</span>
            </div>
          </Link>
          <Link to="/create" className="promo promo--sage">
            <div className="promo__scene" aria-hidden="true">
              <div className="promo__poster promo__poster--b">
                <FramedPoster src={preset("chefchaouen").image} alt="" frameId="white" ratio={0.707} size="sm" />
              </div>
              <div className="promo__poster promo__poster--c">
                <FramedPoster src={preset("marrakech").image} alt="" frameId="black" ratio={0.707} size="sm" />
              </div>
            </div>
            <div className="promo__box">
              <p className="promo__kicker">{t("promo.cod.kicker")}</p>
              <p className="promo__title">{t("promo.cod.title")}</p>
              <span className="promo__btn">{t("promo.cta")}</span>
            </div>
          </Link>
        </section>

        <ProductGrid />

        <section className="home-block service-row" aria-label={t("service.label")}>
          <div>
            <LuPrinter aria-hidden="true" />
            <p><strong>{t("service.print")}</strong><span>{t("service.printNote")}</span></p>
          </div>
          <div>
            <LuFrame aria-hidden="true" />
            <p><strong>{t("service.frame")}</strong><span>{t("service.frameNote")}</span></p>
          </div>
          <div>
            <LuTruck aria-hidden="true" />
            <p>
              <strong>{t("service.ship")}</strong>
              <span>{t("service.shipNote", { amount: money(FREE_SHIPPING_THRESHOLD) })}</span>
            </p>
          </div>
          <div>
            <LuBanknote aria-hidden="true" />
            <p><strong>{t("service.cod")}</strong><span>{t("service.codNote")}</span></p>
          </div>
        </section>

        <section className="home-block" id="pricing" aria-labelledby="pricing-title">
          <div className="home-head">
            <div>
              <h2 id="pricing-title" className="home-heading">{t("pricing.title")}</h2>
              <span className="home-rule" aria-hidden="true" />
            </div>
            <p className="home-head__note">{t("pricing.note", { amount: money(minPrice) })}</p>
          </div>
          <div className="size-table">
            {PRINT_SIZES.map((size) => (
              <div key={size.id} className="size-cell">
                {size.popular ? <span className="badge badge--accent">{t("pricing.popular")}</span> : null}
                <div className="size-cell__shape" aria-hidden="true">
                  <span style={{ width: `${size.widthCm * 1.4}px`, height: `${size.heightCm * 1.4}px` }} />
                </div>
                <p className="size-cell__name">{sizeLabel(size.id)}</p>
                <p className="size-cell__dims">
                  {size.id.startsWith("a") ? `${size.widthCm} × ${size.heightCm} cm` : t("pricing.posterSize")}
                </p>
                <p className="size-cell__price">
                  {money(size.price)}
                  <span>{t("pricing.framed", { amount: money(size.price + size.framePrice) })}</span>
                </p>
              </div>
            ))}
          </div>
          <ul className="frame-list">
            {FRAME_OPTIONS.filter((frame) => frame.id !== "none").map((frame) => (
              <li key={frame.id}>
                <span className={`frame-card__swatch frame-card__swatch--${frame.id}`} aria-hidden="true" />
                <span>
                  <strong>{frameLabel(frame.id)}.</strong> {t(`frame.${frame.id}.desc` as StoreTextKey)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="home-block home-faq" id="faq" aria-labelledby="faq-title">
          <div>
            <h2 id="faq-title" className="home-heading">{t("faq.title")}</h2>
            <span className="home-rule" aria-hidden="true" />
            <p className="home-faq__note">{t("faq.note")}</p>
          </div>
          <div className="faq">
            {Array.from({ length: FAQ_COUNT }, (_, index) => index + 1).map((n) => (
              <details key={n} className="faq__item">
                <summary>{t(`faq.${n}.q` as StoreTextKey)}</summary>
                <p>{t(`faq.${n}.a` as StoreTextKey)}</p>
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
  const { t, lines, cityName } = useStoreText();
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
      aria-label={t("hero.label")}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <span className="hero__pattern" aria-hidden="true" />
      {SLIDES.map((slide, slideIndex) => {
        const design = preset(slide.preset);
        const { widthCm, heightCm } = resolveDimensions(design.product);
        const isActive = slideIndex === index;
        const [line1, line2] = lines(`hero.${slide.n}.title` as StoreTextKey);
        return (
          <div
            key={slide.preset}
            className={`hero__slide${isActive ? " is-active" : ""}`}
            aria-hidden={!isActive}
            role="group"
            aria-roledescription="slide"
            aria-label={t("hero.slide", { n: slideIndex + 1, total: SLIDES.length })}
          >
            <div className="hero__copy">
              <p className="hero__brand">
                Maploom
                <span>{t(`hero.${slide.n}.note` as StoreTextKey)}</span>
              </p>
              <p className="hero__kicker">{t(`hero.${slide.n}.kicker` as StoreTextKey)}</p>
              {slideIndex === 0 ? (
                <h1 className="hero__title">
                  {line1}
                  <br />
                  {line2}
                </h1>
              ) : (
                <p className="hero__title">
                  {line1}
                  <br />
                  {line2}
                </p>
              )}
              <Link
                to={`/create?preset=${design.id}`}
                className="store-btn store-btn--primary"
                tabIndex={isActive ? 0 : -1}
              >
                {t("hero.shop")} <LuArrowRight className="rtl-flip" aria-hidden="true" />
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
                  alt={cityName(design)}
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
            aria-label={t("hero.show", { n: slideIndex + 1 })}
            aria-current={slideIndex === index}
            onClick={() => setIndex(slideIndex)}
          />
        ))}
      </div>
    </section>
  );
}

function ProductGrid() {
  const { t, money, frameLabel, sizeLabel, cityName } = useStoreText();
  const [tab, setTab] = useState("morocco");
  const active = TABS.find((entry) => entry.id === tab) ?? TABS[0];
  const items = DESIGN_PRESETS.filter(active.match);

  return (
    <section className="home-block" id="designs" aria-labelledby="designs-title">
      <div className="home-head">
        <div>
          <h2 id="designs-title" className="home-heading">{t("grid.title")}</h2>
          <span className="home-rule" aria-hidden="true" />
        </div>
        <div className="home-tabs" role="tablist" aria-label={t("grid.filter")}>
          {TABS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={entry.id === tab}
              className={entry.id === tab ? "is-active" : ""}
              onClick={() => setTab(entry.id)}
            >
              {t(entry.label)}
            </button>
          ))}
        </div>
        <Link to="/create" className="store-btn store-btn--outline store-btn--sm">
          {t("grid.scratch")} <LuArrowRight className="rtl-flip" aria-hidden="true" />
        </Link>
      </div>

      <div className="product-grid">
        {items.map((design) => {
          const { widthCm, heightCm } = resolveDimensions(design.product);
          const city = cityName(design);
          return (
            <Link key={design.id} to={`/create?preset=${design.id}`} className="product-card">
              <div className="product-card__visual">
                <span className="badge">{sizeLabel(design.product.sizeId)}</span>
                <FramedPoster
                  src={design.image}
                  alt={t("grid.alt", { city, theme: design.themeLabel })}
                  frameId={design.product.frameId}
                  ratio={widthCm / heightCm}
                  size="md"
                />
                <span className="product-card__hover">{t("grid.customise")}</span>
              </div>
              <p className="product-card__meta">
                {design.themeLabel} · {frameLabel(design.product.frameId)}
              </p>
              <h3 className="product-card__title">{city}</h3>
              <p className="product-card__price">{money(unitPrice(design.product))}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
