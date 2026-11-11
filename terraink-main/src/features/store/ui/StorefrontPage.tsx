import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import {
  LuArrowRight,
  LuBanknote,
  LuChevronLeft,
  LuChevronRight,
  LuFrame,
  LuHeart,
  LuImage,
  LuLayers,
  LuLayoutGrid,
  LuMapPin,
  LuPencil,
  LuPlane,
  LuRuler,
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
import HeroScene from "./HeroScene";
import StoreFooter from "./StoreFooter";
import StoreHeader from "./StoreHeader";
import { useStoreText, type StoreTextKey } from "./storeText";

const preset = (id: string) => DESIGN_PRESETS.find((entry) => entry.id === id)!;

const SLIDES = ["marrakech", "chefchaouen", "fes"];

const FRAME_TILES: { frame: FrameId; preset: string }[] = [
  { frame: "black", preset: "casablanca" },
  { frame: "white", preset: "rabat" },
  { frame: "oak", preset: "fes" },
];

const LIGHT_THEMES = new Set([
  "carrara", "sandstone", "rustic", "ocean", "japanese_ink", "blush", "sage",
  "copper_patina", "terracotta",
]);
const DARK_THEMES = new Set(["midnight_blue", "noir"]);
const PICKS = new Set(["marrakech", "chefchaouen", "fes", "casablanca", "paris", "tokyo"]);

type Icon = ComponentType<{ "aria-hidden"?: boolean }>;
const FILTERS: { id: string; label: StoreTextKey; Icon: Icon; match: (p: DesignPreset) => boolean }[] = [
  { id: "all", label: "chip.all", Icon: LuLayoutGrid, match: () => true },
  { id: "morocco", label: "chip.morocco", Icon: LuMapPin, match: (p) => MOROCCAN_PRESET_IDS.has(p.id) },
  { id: "travel", label: "chip.travel", Icon: LuPlane, match: (p) => !MOROCCAN_PRESET_IDS.has(p.id) },
  { id: "minimal", label: "chip.minimal", Icon: LuLayers, match: (p) => LIGHT_THEMES.has(p.theme) },
  { id: "classic", label: "chip.classic", Icon: LuImage, match: (p) => DARK_THEMES.has(p.theme) },
  { id: "picks", label: "chip.picks", Icon: LuHeart, match: (p) => PICKS.has(p.id) },
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

        <ProductGrid />

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
  const posters = SLIDES.map(preset);
  const [line1, line2] = lines("hero.title");
  const go = (step: number) => setIndex((current) => (current + step + SLIDES.length) % SLIDES.length);

  useEffect(() => {
    if (paused) return undefined;
    const timer = window.setTimeout(() => go(1), 6000);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, paused]);

  return (
    <section
      className="home-hero"
      aria-roledescription="carousel"
      aria-label={t("hero.label")}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="home-hero__copy">
        <p className="home-hero__eyebrow">{t("hero.eyebrow")}</p>
        <h1 className="home-hero__title">
          {line1}
          <br />
          {line2}
        </h1>
        <p className="home-hero__lede">{t("hero.lede")}</p>
        <div className="home-hero__actions">
          <Link to="/create" className="store-btn store-btn--primary store-btn--lg">
            <LuPencil aria-hidden="true" /> {t("hero.cta")}{" "}
            <LuArrowRight className="rtl-flip" aria-hidden="true" />
          </Link>
          <Link to="/#designs" className="store-btn store-btn--outline store-btn--lg">
            <LuLayoutGrid aria-hidden="true" /> {t("hero.explore")}
          </Link>
        </div>
        <ul className="home-hero__features">
          <li>
            <LuTruck aria-hidden="true" />
            <span><strong>{t("hero.feat1")}</strong>{t("hero.feat1Note")}</span>
          </li>
          <li>
            <LuBanknote aria-hidden="true" />
            <span><strong>{t("hero.feat2")}</strong>{t("hero.feat2Note")}</span>
          </li>
          <li>
            <LuRuler aria-hidden="true" />
            <span><strong>{t("hero.feat3")}</strong>{t("hero.feat3Note")}</span>
          </li>
        </ul>
      </div>

      <div className="home-hero__visual">
        <HeroScene posters={posters} active={index} altFor={(p) => t("grid.alt", { city: cityName(p), theme: p.themeLabel })} />
        <div className="home-hero__dots">
          {SLIDES.map((id, slideIndex) => (
            <button
              key={id}
              type="button"
              className={slideIndex === index ? "is-active" : ""}
              aria-label={t("hero.show", { n: slideIndex + 1 })}
              aria-current={slideIndex === index}
              onClick={() => setIndex(slideIndex)}
            />
          ))}
        </div>
      </div>

      <button type="button" className="home-hero__arrow home-hero__arrow--prev" aria-label={t("hero.prev")} onClick={() => go(-1)}>
        <LuChevronLeft className="rtl-flip" aria-hidden="true" />
      </button>
      <button type="button" className="home-hero__arrow home-hero__arrow--next" aria-label={t("hero.next")} onClick={() => go(1)}>
        <LuChevronRight className="rtl-flip" aria-hidden="true" />
      </button>
    </section>
  );
}

function ProductGrid() {
  const { t, money, cityName } = useStoreText();
  const [filter, setFilter] = useState("all");
  const active = FILTERS.find((entry) => entry.id === filter) ?? FILTERS[0];
  // Two full rows of six on desktop.
  const items = DESIGN_PRESETS.filter(active.match).slice(0, 12);

  return (
    <section className="home-block home-styles" id="designs" aria-labelledby="designs-title">
      <div className="home-head home-head--center">
        <h2 id="designs-title" className="home-heading">{t("style.title")}</h2>
        <span className="home-rule" aria-hidden="true" />
      </div>

      <div className="chips" role="toolbar" aria-label={t("grid.filter")}>
        {FILTERS.slice(0, 3).map((entry) => (
          <FilterChip key={entry.id} entry={entry} active={filter === entry.id} onSelect={setFilter} />
        ))}
        <Link to="/create" className="chip">
          <LuPencil aria-hidden="true" /> {t("chip.custom")}
        </Link>
        {FILTERS.slice(3).map((entry) => (
          <FilterChip key={entry.id} entry={entry} active={filter === entry.id} onSelect={setFilter} />
        ))}
      </div>

      <div className="product-grid">
        {items.map((design) => {
          const { widthCm, heightCm } = resolveDimensions(design.product);
          const city = cityName(design);
          return (
            <Link key={design.id} to={`/create?preset=${design.id}`} className="product-card">
              <div className="product-card__visual">
                <FramedPoster
                  src={design.image}
                  alt={t("grid.alt", { city, theme: design.themeLabel })}
                  frameId={design.product.frameId}
                  ratio={widthCm / heightCm}
                  size="md"
                />
                <span className="product-card__hover">{t("grid.customise")}</span>
              </div>
              <div className="product-card__body">
                <h3 className="product-card__title">{city}</h3>
                <p className="product-card__price">{money(unitPrice(design.product))}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function FilterChip({
  entry,
  active,
  onSelect,
}: {
  entry: (typeof FILTERS)[number];
  active: boolean;
  onSelect: (id: string) => void;
}) {
  const { t } = useStoreText();
  const { Icon } = entry;
  return (
    <button
      type="button"
      className={`chip${active ? " is-active" : ""}`}
      aria-pressed={active}
      onClick={() => onSelect(entry.id)}
    >
      <Icon aria-hidden={true} /> {t(entry.label)}
    </button>
  );
}
