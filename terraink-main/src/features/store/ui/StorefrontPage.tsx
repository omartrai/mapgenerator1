import { useRef, useState, type ComponentType, type FormEvent, type PointerEvent } from "react";
import {
  LuArrowLeft,
  LuArrowRight,
  LuBanknote,
  LuFrame,
  LuGem,
  LuMap,
  LuPackageSearch,
  LuRoute,
  LuSearch,
  LuShoppingCart,
  LuSparkles,
  LuTruck,
} from "react-icons/lu";
import { Link, navigateTo } from "@/core/router/router";
import BrandMark from "@/shared/ui/BrandMark";
import { FREE_SHIPPING_THRESHOLD, PRINT_SIZES, resolveDimensions, unitPrice } from "../domain/catalog";
import { DESIGN_PRESETS, MOROCCAN_PRESET_IDS } from "../domain/presets";
import { useCollection } from "../application/useCollection";
import CollectionCard from "./CollectionCard";
import FramedPoster from "./FramedPoster";
import ReviewsSection from "./ReviewsSection";
import StoreFooter from "./StoreFooter";
import StoreHeader from "./StoreHeader";
import { useStoreText, type StoreTextKey } from "./storeText";

type Icon = ComponentType<{ "aria-hidden"?: boolean }>;

/** The four things the shop sells. */
type LineId = "maps" | "sky" | "sport" | "prints";
const LINES: { id: LineId; image: string; to: string; Icon: Icon; focus: string }[] = [
  { id: "maps", image: "/assets/hero/marrakech.webp", to: "/create", Icon: LuMap, focus: "84% 50%" },
  { id: "sky", image: "/assets/hero/night-sky.webp", to: "/create?type=sky", Icon: LuSparkles, focus: "50% 30%" },
  { id: "sport", image: "/assets/hero/sport.webp", to: "/create?type=sport", Icon: LuRoute, focus: "50% 36%" },
  { id: "prints", image: "/assets/hero/collection.webp", to: "/collection", Icon: LuFrame, focus: "62% 30%" },
];
const lineKey = (id: LineId, part: string) => `home.${id}.${part}` as StoreTextKey;
const LOWEST_PRINT_PRICE = Math.min(...PRINT_SIZES.map((size) => size.price));
const PICKS = new Set(["marrakech", "chefchaouen", "fes", "casablanca", "paris", "tokyo"]);
const FAQ_COUNT = 5;

/** Art prints come from the print partner; leave them out when there are none. */
function useShopLines() {
  const { products, status } = useCollection();
  const hasPrints = status === "loading" || products.length > 0;
  return {
    lines: hasPrints ? LINES : LINES.filter((line) => line.id !== "prints"),
    products,
    printsFrom: products.length ? Math.min(...products.map((product) => product.fromPrice)) : null,
  };
}

export default function StorefrontPage() {
  const { t } = useStoreText();

  return (
    <div className="store-page store-page--home">
      <div className="home-frame">
        <StoreHeader variant="site" />
        <Hero />
      </div>

      <main>
        <PopularDesigns />
        <ShopLines />
        <ArtPrints />
        <ReviewsSection />

        <section className="home-block home-faq" id="faq" aria-labelledby="faq-title">
          <div>
            <h2 id="faq-title" className="home-heading">{t("faq.title")}</h2>
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

        <TrackBand />
      </main>

      <StoreFooter />
    </div>
  );
}

function Hero() {
  const { t, lines: split, money } = useStoreText();
  const { lines, products } = useShopLines();
  const [place, setPlace] = useState("");
  const [line1, line2, line3] = split("home2.title");
  // Real counts only: the art prints when the collection is live, else the starting designs.
  const proof = products.length
    ? {
        text: t("home2.prints", { count: products.length }),
        to: "/collection",
        images: products.slice(0, 5).map((product) => product.mockups?.[0] ?? product.image),
      }
    : {
        text: t("home2.designs", { count: DESIGN_PRESETS.length }),
        to: "/#designs",
        images: DESIGN_PRESETS.slice(0, 5).map((design) => design.image),
      };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const query = place.trim();
    navigateTo(query ? `/create?place=${encodeURIComponent(query)}` : "/create");
  };

  /** The posters drift a little towards the pointer (mouse only). */
  const tiltStage = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const mx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const my = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    event.currentTarget.style.setProperty("--mx", mx.toFixed(3));
    event.currentTarget.style.setProperty("--my", my.toFixed(3));
  };

  const benefits: { Icon: Icon; title: StoreTextKey; note: StoreTextKey }[] = [
    { Icon: LuTruck, title: "trust.1", note: "trust.1Note" },
    { Icon: LuBanknote, title: "trust.2", note: "trust.2Note" },
    { Icon: LuGem, title: "trust.3", note: "trust.3Note" },
  ];

  return (
    <section className="hero2" aria-labelledby="hero2-title">
      <div className="hero2__copy">
        <h1 id="hero2-title" className="hero2__title">
          {line1}
          <br />
          {line2}
          {line3 ? (
            <>
              <br />
              {line3}
            </>
          ) : null}
        </h1>
        <p className="hero2__lede">{t("home2.lede")}</p>

        <form className="hero2__search" role="search" onSubmit={submit}>
          <label className="visually-hidden" htmlFor="hero2-place">
            {t("home2.searchLabel")}
          </label>
          <input
            id="hero2-place"
            type="search"
            value={place}
            placeholder={t("home2.search")}
            autoComplete="off"
            onChange={(event) => setPlace(event.target.value)}
          />
          <button type="submit" aria-label={t("home2.searchCta")}>
            <LuSearch aria-hidden="true" />
          </button>
        </form>

        <p className="hero2__label">{t("home2.popular")}</p>
        <div className="hero2__chips">
          {lines.map((line) => (
            <Link key={line.id} to={line.to} className="hero2__chip">
              {t(lineKey(line.id, "tab"))}
            </Link>
          ))}
        </div>

        <Link to={proof.to} className="hero2__proof">
          <span className="hero2__faces" aria-hidden="true">
            {proof.images.map((src) => (
              <img key={src} src={src} alt="" loading="lazy" decoding="async" />
            ))}
          </span>
          <span className="hero2__proof-text">
            <strong>{proof.text}</strong>
            <span>
              {t("home2.see")} <LuArrowRight className="rtl-flip" aria-hidden="true" />
            </span>
          </span>
        </Link>
      </div>

      <div
        className="hero2__stage"
        aria-hidden="true"
        onPointerMove={tiltStage}
        onPointerLeave={(event) => {
          event.currentTarget.style.setProperty("--mx", "0");
          event.currentTarget.style.setProperty("--my", "0");
        }}
      >
        <div className="hero2__poster hero2__poster--sky">
          <FramedPoster src="/assets/hero-posters/sky.webp" alt="" frameId="white" ratio={0.75} size="lg" loading="eager" />
        </div>
        <div className="hero2__poster hero2__poster--sport">
          <FramedPoster src="/assets/hero-posters/sport.webp" alt="" frameId="black" ratio={0.75} size="lg" loading="eager" />
        </div>
        <div className="hero2__poster hero2__poster--map">
          <FramedPoster src="/assets/hero-posters/map.webp" alt="" frameId="oak" ratio={0.75} size="lg" loading="eager" />
        </div>

        <span className="hero2__badge">
          <svg className="hero2__badge-ring" viewBox="0 0 120 120">
            <defs>
              <path id="hero2-ring" d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1-88 0" />
            </defs>
            {/* textLength spreads the words evenly around the whole ring. */}
            <text textLength="272" lengthAdjust="spacing">
              <textPath href="#hero2-ring" textLength="272" lengthAdjust="spacing">
                {t("home2.badge")}
              </textPath>
            </text>
          </svg>
          <BrandMark className="hero2__badge-mark" />
        </span>
      </div>

      <ul className="hero2__benefits">
        {benefits.map(({ Icon, title, note }) => (
          <li key={title}>
            <span className="hero2__benefit-icon">
              <Icon aria-hidden={true} />
            </span>
            <span>
              <strong>{t(title)}</strong>
              <span>{t(note, { amount: money(FREE_SHIPPING_THRESHOLD) })}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Scrolls a row of cards by about one screen width. */
function useRow() {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (direction: 1 | -1) => {
    const row = ref.current;
    if (!row) return;
    const rtl = getComputedStyle(row).direction === "rtl" ? -1 : 1;
    row.scrollBy({ left: direction * rtl * row.clientWidth * 0.9, behavior: "smooth" });
  };
  return { ref, scroll };
}

function RowHead({ id, title, sub, onScroll }: { id: string; title: string; sub: string; onScroll?: (d: 1 | -1) => void }) {
  const { t } = useStoreText();
  return (
    <div className="row-head">
      <div>
        <h2 id={id} className="home-heading">{title}</h2>
        <p className="row-head__sub">{sub}</p>
      </div>
      {onScroll ? (
        <div className="row-head__arrows">
          <button type="button" aria-label={t("home2.prev")} onClick={() => onScroll(-1)}>
            <LuArrowLeft className="rtl-flip" aria-hidden="true" />
          </button>
          <button type="button" className="is-dark" aria-label={t("home2.next")} onClick={() => onScroll(1)}>
            <LuArrowRight className="rtl-flip" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function PopularDesigns() {
  const { t, money, cityName } = useStoreText();
  const { ref, scroll } = useRow();

  return (
    <section className="home-block" id="designs" aria-labelledby="designs-title">
      <RowHead id="designs-title" title={t("home2.popularTitle")} sub={t("home2.popularSub")} onScroll={scroll} />
      <div className="card-row" ref={ref}>
        {DESIGN_PRESETS.map((design) => {
          const { widthCm, heightCm } = resolveDimensions(design.product);
          const city = cityName(design);
          const badge = MOROCCAN_PRESET_IDS.has(design.id)
            ? t("chip.morocco")
            : PICKS.has(design.id)
              ? t("chip.picks")
              : null;
          return (
            <Link key={design.id} to={`/create?preset=${design.id}`} className="shop-card">
              <div className="shop-card__visual">
                {badge ? <span className="shop-card__badge">{badge}</span> : null}
                <FramedPoster
                  src={design.image}
                  alt={t("grid.alt", { city, theme: design.themeLabel })}
                  frameId={design.product.frameId}
                  ratio={widthCm / heightCm}
                  size="md"
                />
              </div>
              <div className="shop-card__body">
                <h3 className="shop-card__title">{city}</h3>
                <p className="shop-card__sub">{t("home2.mapType", { theme: design.themeLabel })}</p>
                <div className="shop-card__foot">
                  <span className="shop-card__price">{money(unitPrice(design.product))}</span>
                  <span className="shop-card__cart" aria-hidden="true">
                    <LuShoppingCart />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function ShopLines() {
  const { t, money } = useStoreText();
  const { lines, printsFrom } = useShopLines();

  return (
    <section className="home-block" aria-labelledby="lines-title">
      <RowHead id="lines-title" title={t("home2.linesTitle")} sub={t("home2.linesSub")} />
      <div className="line-grid" data-count={lines.length}>
        {lines.map(({ id, image, to, Icon, focus }) => {
          const from = id === "prints" ? printsFrom : LOWEST_PRINT_PRICE;
          return (
            <Link key={id} to={to} className="line-card">
              <span className="line-card__image">
                <img src={image} alt="" loading="lazy" decoding="async" style={{ objectPosition: focus }} />
              </span>
              <span className="line-card__icon">
                <Icon aria-hidden={true} />
              </span>
              <span className="line-card__body">
                <strong className="line-card__title">{t(lineKey(id, "tab"))}</strong>
                <span className="line-card__text">{t(lineKey(id, "note"))}</span>
                {from !== null ? (
                  <span className="line-card__price">{t("home.cats.from", { amount: money(from) })}</span>
                ) : null}
                <span className="line-card__link">{t("home.cats.browse")}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function ArtPrints() {
  const { t } = useStoreText();
  const { products, status } = useCollection();
  const { ref, scroll } = useRow();
  if (status === "error" || (status === "ready" && products.length === 0)) return null;

  return (
    <section className="home-block" id="collection" aria-labelledby="prints-title">
      <RowHead id="prints-title" title={t("home2.printsTitle")} sub={t("home2.printsSub")} onScroll={scroll} />
      <div className="card-row card-row--prints" ref={ref} aria-busy={status === "loading"}>
        {status === "loading"
          ? Array.from({ length: 4 }, (_, index) => <div key={index} className="collection-card is-skeleton" />)
          : products.map((product) => <CollectionCard key={product.id} product={product} />)}
      </div>
      <Link to="/collection" className="row-more">
        {t("collection.viewAll")} <LuArrowRight className="rtl-flip" aria-hidden="true" />
      </Link>
    </section>
  );
}

/** In place of a newsletter: customers can jump straight to their order. */
function TrackBand() {
  const { t } = useStoreText();
  const [number, setNumber] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = number.trim().toUpperCase();
    navigateTo(value ? `/suivi?n=${encodeURIComponent(value)}` : "/suivi");
  };

  return (
    <section className="home-block track-band" aria-labelledby="track-band-title">
      <span className="track-band__icon" aria-hidden="true">
        <LuPackageSearch />
      </span>
      <div className="track-band__text">
        <h2 id="track-band-title">{t("home2.trackTitle")}</h2>
        <p>{t("home2.trackText")}</p>
      </div>
      <form className="track-band__form" onSubmit={submit}>
        <label className="visually-hidden" htmlFor="track-band-number">
          {t("home2.trackPlaceholder")}
        </label>
        <input
          id="track-band-number"
          value={number}
          placeholder={t("home2.trackPlaceholder")}
          autoComplete="off"
          onChange={(event) => setNumber(event.target.value)}
        />
        <button type="submit">{t("home2.trackCta")}</button>
      </form>
    </section>
  );
}
