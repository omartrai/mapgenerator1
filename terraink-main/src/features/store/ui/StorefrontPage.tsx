import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import {
  LuArrowRight,
  LuBan,
  LuBanknote,
  LuCheck,
  LuEye,
  LuGem,
  LuHeart,
  LuLayers,
  LuLayoutGrid,
  LuMoon,
  LuPencil,
  LuPlane,
  LuStar,
  LuTruck,
} from "react-icons/lu";
import { Link } from "@/core/router/router";
import {
  FRAME_OPTIONS,
  FREE_SHIPPING_THRESHOLD,
  PRINT_SIZES,
  formatRatio,
  resolveDimensions,
  unitPrice,
  type FrameId,
  type ProductOptions,
} from "../domain/catalog";
import { DESIGN_PRESETS, MOROCCAN_PRESET_IDS, type DesignPreset } from "../domain/presets";
import { useCollection } from "../application/useCollection";
import CollectionSection from "./CollectionSection";
import FramedPoster from "./FramedPoster";
import ReviewsSection from "./ReviewsSection";
import StoreFooter from "./StoreFooter";
import StoreHeader from "./StoreHeader";
import { useStoreText, type StoreTextKey } from "./storeText";

/** The four things the shop sells; each has a hero photo and its own page. */
type LineId = "maps" | "sky" | "sport" | "prints";
const LINES: { id: LineId; image: string; to: string; focus?: string }[] = [
  { id: "maps", image: "/assets/hero/marrakech.webp", to: "/create", focus: "86% 50%" },
  { id: "sky", image: "/assets/hero/night-sky.webp", to: "/create?type=sky" },
  { id: "sport", image: "/assets/hero/sport.webp", to: "/create?type=sport" },
  { id: "prints", image: "/assets/hero/collection.webp", to: "/collection" },
];
const lineKey = (id: LineId, part: string) => `home.${id}.${part}` as StoreTextKey;
const LOWEST_PRINT_PRICE = Math.min(...PRINT_SIZES.map((size) => size.price));

/** Art prints come from the print partner; hide them when there are none. */
function useLines() {
  const { products, status } = useCollection();
  const hasPrints = status === "loading" || products.length > 0;
  const printsFrom = products.length ? Math.min(...products.map((product) => product.fromPrice)) : null;
  return { lines: hasPrints ? LINES : LINES.filter((line) => line.id !== "prints"), printsFrom };
}

/** Frame and format picked in "Personnalisez votre affiche"; unset keeps each design's own. */
interface Choice {
  frameId?: FrameId;
  sizeId?: string;
}

const withChoice = (product: ProductOptions, choice: Choice): ProductOptions => ({
  ...product,
  ...(choice.frameId ? { frameId: choice.frameId } : {}),
  ...(choice.sizeId ? { sizeId: choice.sizeId } : {}),
});

const designLink = (id: string, choice: Choice) => {
  const params = new URLSearchParams({ preset: id });
  if (choice.sizeId) params.set("size", choice.sizeId);
  if (choice.frameId) params.set("frame", choice.frameId);
  return `/create?${params.toString()}`;
};

const LIGHT_THEMES = new Set([
  "carrara", "sandstone", "rustic", "ocean", "japanese_ink", "blush", "sage",
  "copper_patina", "terracotta",
]);
const DARK_THEMES = new Set(["midnight_blue", "noir"]);
const PICKS = new Set(["marrakech", "chefchaouen", "fes", "casablanca", "paris", "tokyo"]);

type Icon = ComponentType<{ "aria-hidden"?: boolean }>;
const FILTERS: { id: string; label: StoreTextKey; Icon: Icon; match: (p: DesignPreset) => boolean }[] = [
  { id: "all", label: "chip.all", Icon: LuLayoutGrid, match: () => true },
  { id: "morocco", label: "chip.morocco", Icon: LuStar, match: (p) => MOROCCAN_PRESET_IDS.has(p.id) },
  { id: "travel", label: "chip.travel", Icon: LuPlane, match: (p) => !MOROCCAN_PRESET_IDS.has(p.id) },
  { id: "minimal", label: "chip.minimal", Icon: LuLayers, match: (p) => LIGHT_THEMES.has(p.theme) },
  { id: "classic", label: "chip.classic", Icon: LuMoon, match: (p) => DARK_THEMES.has(p.theme) },
  { id: "picks", label: "chip.picks", Icon: LuHeart, match: (p) => PICKS.has(p.id) },
];

const FAQ_COUNT = 5;

export default function StorefrontPage() {
  const { t } = useStoreText();
  const [choice, setChoice] = useState<Choice>({});

  return (
    <div className="store-page store-page--home">
      <StoreHeader variant="site" />

      <main>
        <HeroSlider />

        <Categories />

        <ProductGrid choice={choice} />

        <SkyPromo />

        <SportPromo />

        <CollectionSection />

        <Configurator choice={choice} onChange={setChoice} />

        <TrustBar />

        <ReviewsSection />

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
  const { t, lines: titleLines } = useStoreText();
  const { lines } = useLines();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const current = lines[Math.min(index, lines.length - 1)];
  const [line1, line2] = titleLines(lineKey(current.id, "title"));

  useEffect(() => {
    if (paused) return undefined;
    const timer = window.setTimeout(() => setIndex((value) => (value + 1) % lines.length), 7000);
    return () => window.clearTimeout(timer);
  }, [index, paused, lines.length]);

  return (
    <section
      className="split-hero"
      aria-roledescription="carousel"
      aria-label={t("hero.label")}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="split-hero__copy">
        <div key={current.id} className="split-hero__text">
          <p className="split-hero__eyebrow">{t(lineKey(current.id, "eyebrow"))}</p>
          <h1 className="split-hero__title">
            {line1}
            <br />
            {line2}
          </h1>
          <p className="split-hero__lede">{t(lineKey(current.id, "lede"))}</p>
          <Link to={current.to} className="split-hero__cta">
            {t(lineKey(current.id, "cta"))} <LuArrowRight className="rtl-flip" aria-hidden="true" />
          </Link>
        </div>

        <div className="split-hero__tabs">
          {lines.map((line, lineIndex) => (
            <button
              key={line.id}
              type="button"
              className={`split-hero__tab${line.id === current.id ? " is-active" : ""}${paused ? " is-paused" : ""}`}
              aria-current={line.id === current.id}
              onClick={() => setIndex(lineIndex)}
            >
              {t(lineKey(line.id, "tab"))}
            </button>
          ))}
        </div>
      </div>

      <div className="split-hero__media" aria-hidden="true">
        {lines.map((line, lineIndex) => (
          <img
            key={line.id}
            src={line.image}
            alt=""
            className={`split-hero__image${line.id === current.id ? " is-active" : ""}`}
            style={line.focus ? { objectPosition: line.focus } : undefined}
            loading={lineIndex === 0 ? "eager" : "lazy"}
            decoding="async"
          />
        ))}
      </div>
    </section>
  );
}

/** One tall photo tile per product line. */
function Categories() {
  const { t, money } = useStoreText();
  const { lines, printsFrom } = useLines();

  return (
    <section className="home-block home-cats" aria-labelledby="cats-title">
      <div className="home-head home-head--center">
        <p className="home-eyebrow">{t("home.cats.eyebrow")}</p>
        <h2 id="cats-title" className="home-heading">{t("home.cats.title")}</h2>
        <span className="home-rule" aria-hidden="true" />
      </div>
      <div className="home-cats__grid" data-count={lines.length}>
        {lines.map((line) => {
          const from = line.id === "prints" ? printsFrom : LOWEST_PRINT_PRICE;
          return (
            <Link key={line.id} to={line.to} className="home-cat">
              <img
                src={line.image}
                alt=""
                loading="lazy"
                decoding="async"
                style={line.focus ? { objectPosition: line.focus } : undefined}
              />
              <span className="home-cat__body">
                <strong className="home-cat__name">{t(lineKey(line.id, "tab"))}</strong>
                <span className="home-cat__note">{t(lineKey(line.id, "note"))}</span>
                <span className="home-cat__price">
                  {from === null ? t("home.cats.browse") : t("home.cats.from", { amount: money(from) })}
                  <LuArrowRight className="rtl-flip" aria-hidden="true" />
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/** Sport posters from a GPX route (Strava, Garmin, Komoot). */
function SportPromo() {
  const { t } = useStoreText();
  return (
    <section className="home-block sky-promo sky-promo--sport" aria-labelledby="sport-promo-title">
      <img className="sky-promo__poster" src="/assets/sport-poster.webp" alt={t("sportPromo.alt")} loading="lazy" />
      <div className="sky-promo__copy">
        <p className="sky-promo__eyebrow">{t("sportPromo.eyebrow")}</p>
        <h2 id="sport-promo-title" className="sky-promo__title">{t("sportPromo.title")}</h2>
        <p className="sky-promo__lede">{t("sportPromo.lede")}</p>
        <ul className="sky-promo__points">
          <li>{t("sportPromo.p1")}</li>
          <li>{t("sportPromo.p2")}</li>
          <li>{t("sportPromo.p3")}</li>
        </ul>
        <Link to="/create?type=sport" className="store-btn store-btn--primary store-btn--lg">
          {t("sportPromo.cta")} <LuArrowRight className="rtl-flip" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

/** Night-sky posters: a dark band that opens the studio in sky mode. */
function SkyPromo() {
  const { t } = useStoreText();
  return (
    <section className="home-block sky-promo" aria-labelledby="sky-promo-title">
      <div className="sky-promo__copy">
        <p className="sky-promo__eyebrow">{t("skyPromo.eyebrow")}</p>
        <h2 id="sky-promo-title" className="sky-promo__title">{t("skyPromo.title")}</h2>
        <p className="sky-promo__lede">{t("skyPromo.lede")}</p>
        <ul className="sky-promo__points">
          <li>{t("skyPromo.p1")}</li>
          <li>{t("skyPromo.p2")}</li>
          <li>{t("skyPromo.p3")}</li>
        </ul>
        <Link to="/create?type=sky" className="store-btn store-btn--primary store-btn--lg">
          {t("skyPromo.cta")} <LuArrowRight className="rtl-flip" aria-hidden="true" />
        </Link>
      </div>
      <img className="sky-promo__poster" src="/assets/sky-poster.webp" alt={t("skyPromo.alt")} loading="lazy" />
    </section>
  );
}

function ProductGrid({ choice }: { choice: Choice }) {
  const { t, money, cityName } = useStoreText();
  const [filter, setFilter] = useState("all");
  const active = FILTERS.find((entry) => entry.id === filter) ?? FILTERS[0];
  // Two full rows of six on desktop.
  const items = DESIGN_PRESETS.filter(active.match).slice(0, 12);

  return (
    <section className="home-styles" id="designs" aria-labelledby="designs-title">
      <div className="home-head home-head--center">
        <p className="home-eyebrow">{t("home.designs.eyebrow")}</p>
        <h2 id="designs-title" className="home-heading">{t("home.designs.title")}</h2>
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
          const product = withChoice(design.product, choice);
          const { widthCm, heightCm } = resolveDimensions(product);
          const city = cityName(design);
          return (
            <Link key={design.id} to={designLink(design.id, choice)} className="product-card">
              <div className="product-card__visual">
                <FramedPoster
                  src={design.image}
                  alt={t("grid.alt", { city, theme: design.themeLabel })}
                  frameId={product.frameId}
                  ratio={widthCm / heightCm}
                  size="md"
                />
                <span className="product-card__hover">{t("grid.customise")}</span>
              </div>
              <div className="product-card__body">
                <h3 className="product-card__title">{city}</h3>
                <p className="product-card__price">
                  {money(unitPrice(product))} <LuArrowRight className="rtl-flip" aria-hidden="true" />
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function Configurator({ choice, onChange }: { choice: Choice; onChange: (choice: Choice) => void }) {
  const { t, lines } = useStoreText();
  const [line1, line2] = lines("custom.title");
  const formatCm = (value: number) => String(Math.round(value * 10) / 10).replace(".", ",");

  return (
    <section className="home-block configurator" id="pricing" aria-labelledby="custom-title">
      <div className="configurator__intro">
        <h2 id="custom-title" className="home-heading">
          {line1}
          <br />
          {line2}
        </h2>
        <span className="home-rule" aria-hidden="true" />
        <p>{t("custom.text")}</p>
        {choice.frameId || choice.sizeId ? (
          <button type="button" className="configurator__reset" onClick={() => onChange({})}>
            {t("custom.reset")}
          </button>
        ) : null}
      </div>

      <div className="configurator__panel">
        <div className="configurator__group">
          <h3 id="custom-frame">{t("custom.frame")}</h3>
          <div className="configurator__frames" role="radiogroup" aria-labelledby="custom-frame">
            {FRAME_OPTIONS.map((frame) => {
              const selected = choice.frameId === frame.id;
              return (
                <button
                  key={frame.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`buy-frame${selected ? " is-selected" : ""}`}
                  onClick={() => onChange({ ...choice, frameId: selected ? undefined : frame.id })}
                >
                  {selected ? <LuCheck className="configurator__tick" aria-hidden="true" /> : null}
                  <span className={`buy-frame__swatch buy-frame__swatch--${frame.id}`} aria-hidden="true">
                    {frame.id === "none" ? <LuBan /> : null}
                  </span>
                  <span className="buy-frame__label">{t(`frameShort.${frame.id}` as StoreTextKey)}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="configurator__group">
          <h3 id="custom-format">{t("custom.format")}</h3>
          <div className="configurator__sizes" role="radiogroup" aria-labelledby="custom-format">
            {PRINT_SIZES.map((size) => {
              const selected = choice.sizeId === size.id;
              return (
                <button
                  key={size.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`buy-size${selected ? " is-selected" : ""}`}
                  onClick={() => onChange({ ...choice, sizeId: selected ? undefined : size.id })}
                >
                  <strong>{formatRatio(size.id, "portrait")}</strong>
                  <span>{formatCm(size.widthCm)} × {formatCm(size.heightCm)} cm</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  const { t, money } = useStoreText();
  const items: { Icon: Icon; title: StoreTextKey; note: StoreTextKey }[] = [
    { Icon: LuTruck, title: "trust.1", note: "trust.1Note" },
    { Icon: LuBanknote, title: "trust.2", note: "trust.2Note" },
    { Icon: LuGem, title: "trust.3", note: "trust.3Note" },
    { Icon: LuEye, title: "trust.4", note: "trust.4Note" },
  ];
  return (
    <section className="home-block trust-bar" aria-label={t("trust.label")}>
      {items.map(({ Icon, title, note }) => (
        <div key={title} className="trust-bar__item">
          <Icon aria-hidden={true} />
          <p>
            <strong>{t(title)}</strong>
            <span>{t(note, { amount: money(FREE_SHIPPING_THRESHOLD) })}</span>
          </p>
        </div>
      ))}
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
