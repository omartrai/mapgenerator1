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
  resolveDimensions,
  unitPrice,
  type FrameId,
  type ProductOptions,
} from "../domain/catalog";
import { DESIGN_PRESETS, MOROCCAN_PRESET_IDS, type DesignPreset } from "../domain/presets";
import FramedPoster from "./FramedPoster";
import StoreFooter from "./StoreFooter";
import StoreHeader from "./StoreHeader";
import { useStoreText, type StoreTextKey } from "./storeText";

/** Hero photos (an arch looking out over each city, the poster on a ledge). */
const SLIDES = [
  { id: "marrakech", image: "/assets/hero/marrakech.webp" },
  { id: "chefchaouen", image: "/assets/hero/chefchaouen.webp" },
  { id: "casablanca", image: "/assets/hero/casablanca.webp" },
];

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

        <ProductGrid choice={choice} />

        <Configurator choice={choice} onChange={setChoice} />

        <TrustBar />

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
  const { t, lines } = useStoreText();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [line1, line2] = lines("hero.title");

  useEffect(() => {
    if (paused) return undefined;
    const timer = window.setTimeout(() => setIndex((current) => (current + 1) % SLIDES.length), 7000);
    return () => window.clearTimeout(timer);
  }, [index, paused]);

  return (
    <section
      className="photo-hero"
      aria-roledescription="carousel"
      aria-label={t("hero.label")}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="photo-hero__slides" aria-hidden="true">
        {SLIDES.map((slide, slideIndex) => (
          <img
            key={slide.id}
            src={slide.image}
            alt=""
            className={`photo-hero__slide${slideIndex === index ? " is-active" : ""}`}
            loading={slideIndex === 0 ? "eager" : "lazy"}
            decoding="async"
            onError={(event) => event.currentTarget.classList.add("is-missing")}
          />
        ))}
      </div>

      <div className="photo-hero__copy">
        <p className="photo-hero__eyebrow">{t("hero.eyebrow")}</p>
        <h1 className="photo-hero__title">
          {line1}
          <br />
          {line2}
        </h1>
        <p className="photo-hero__lede">{t("hero.lede")}</p>
        <Link to="/#designs" className="photo-hero__cta">
          {t("hero.explore")} <LuArrowRight className="rtl-flip" aria-hidden="true" />
        </Link>
        <div className="photo-hero__dots">
          {SLIDES.map((slide, slideIndex) => (
            <button
              key={slide.id}
              type="button"
              className={slideIndex === index ? "is-active" : ""}
              aria-label={t("hero.show", { n: slideIndex + 1 })}
              aria-current={slideIndex === index}
              onClick={() => setIndex(slideIndex)}
            />
          ))}
        </div>
      </div>
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
      <h2 id="designs-title" className="visually-hidden">{t("style.title")}</h2>

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
  const { t, lines, sizeLabel } = useStoreText();
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
                  <strong>{size.id.startsWith("a") ? sizeLabel(size.id) : `${size.widthCm} × ${size.heightCm}`}</strong>
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
