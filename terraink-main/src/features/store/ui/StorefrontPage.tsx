import {
  LuArrowRight,
  LuBanknote,
  LuFrame,
  LuMapPin,
  LuPalette,
  LuPrinter,
  LuRuler,
  LuTruck,
  LuType,
} from "react-icons/lu";
import { Link } from "@/core/router/router";
import { themeOptions } from "@/features/theme/infrastructure/themeRepository";
import {
  FRAME_OPTIONS,
  FREE_SHIPPING_THRESHOLD,
  PRINT_SIZES,
  formatMoney,
  resolveDimensions,
} from "../domain/catalog";
import { DESIGN_PRESETS } from "../domain/presets";
import FramedPoster from "./FramedPoster";
import StoreFooter from "./StoreFooter";
import StoreHeader from "./StoreHeader";

const HERO_PRESETS = ["new-york", "paris", "marrakech"];
const FAQ = [
  {
    q: "How long does delivery take?",
    a: "Every poster is printed to order. Prints ship within 3–5 business days, and framed posters within 5–7. We'll let you know as soon as it's on its way.",
  },
  {
    q: "How do I pay?",
    a: "You pay on delivery, so there's nothing to pay online. We'll contact you to confirm the order before it goes to print.",
  },
  {
    q: "Can I change my design after ordering?",
    a: "Yes, as long as it hasn't gone to print yet. Get in touch with your order number and the changes, and we'll take care of it.",
  },
  {
    q: "What paper and frames do you use?",
    a: "Prints are made on 200 g/m² museum-grade matte paper with archival pigment inks. Frames come in matte black aluminium, soft white wood or natural oak, all with shatter-resistant acrylic glazing.",
  },
  {
    q: "Which places can I map?",
    a: "Anywhere in the world: a city, a neighbourhood, the street you grew up on or a mountain you climbed. The maps come from OpenStreetMap data.",
  },
];

export default function StorefrontPage() {
  const heroPresets = HERO_PRESETS.map((id) => DESIGN_PRESETS.find((preset) => preset.id === id)!);
  const minPrice = Math.min(...PRINT_SIZES.map((size) => size.price));
  const palettes = themeOptions.slice(0, 12);

  return (
    <div className="store-page store-page--home">
      <StoreHeader variant="site" />

      <main>
        <section className="store-hero">
          <div className="store-hero__copy">
            <p className="store-eyebrow">Personalised map posters</p>
            <h1 className="store-hero__title">
              The places that made you, <em>beautifully framed.</em>
            </h1>
            <p className="store-hero__lede">
              Design a poster of any place in the world: the city where you met, the street you
              grew up on, the town you call home. Choose the colours, words and frame, see it
              live, and we'll print it on museum-grade paper.
            </p>
            <div className="store-hero__actions">
              <Link to="/create" className="store-btn store-btn--primary store-btn--lg">
                Design your poster <LuArrowRight aria-hidden="true" />
              </Link>
              <Link to="/#designs" className="store-btn store-btn--outline store-btn--lg">
                Browse designs
              </Link>
            </div>
            <ul className="store-hero__facts">
              <li>From {formatMoney(minPrice)}</li>
              <li>Free shipping over {formatMoney(FREE_SHIPPING_THRESHOLD)}</li>
              <li>Pay on delivery</li>
            </ul>
          </div>

          <div className="store-hero__gallery" aria-hidden="true">
            {heroPresets.map((preset, index) => {
              const { widthCm, heightCm } = resolveDimensions(preset.product);
              return (
                <div key={preset.id} className={`store-hero__poster store-hero__poster--${index + 1}`}>
                  <FramedPoster
                    src={preset.image}
                    alt=""
                    frameId={preset.product.frameId}
                    ratio={widthCm / heightCm}
                    size={index === 1 ? "lg" : "md"}
                    loading="eager"
                  />
                </div>
              );
            })}
          </div>
        </section>

        <section className="trust-strip" aria-label="Why Maploom">
          <div><LuPrinter aria-hidden="true" /><span>Museum-grade archival prints</span></div>
          <div><LuFrame aria-hidden="true" /><span>Ready-to-hang frames</span></div>
          <div><LuTruck aria-hidden="true" /><span>Printed to order, shipped in days</span></div>
          <div><LuBanknote aria-hidden="true" /><span>Pay when it arrives</span></div>
        </section>

        <section className="store-section" id="designs">
          <div className="store-section__head">
            <p className="store-eyebrow">Start from a favourite</p>
            <h2 className="store-section__title">Featured designs</h2>
            <p className="store-section__lede">
              Each one is a starting point. Open it in the studio and make it yours with a new
              place, new colours or new words.
            </p>
          </div>
          <div className="design-grid">
            {DESIGN_PRESETS.map((preset) => {
              const { widthCm, heightCm } = resolveDimensions(preset.product);
              return (
                <Link key={preset.id} to={`/create?preset=${preset.id}`} className="design-card">
                  <div className="design-card__visual">
                    <FramedPoster
                      src={preset.image}
                      alt={`${preset.city} map poster in the ${preset.themeLabel} style`}
                      frameId={preset.product.frameId}
                      ratio={widthCm / heightCm}
                      size="md"
                    />
                  </div>
                  <div className="design-card__body">
                    <div>
                      <h3 className="design-card__title">{preset.city}</h3>
                      <p className="design-card__meta">{preset.themeLabel} style</p>
                    </div>
                    <span className="design-card__cta">
                      Personalise <LuArrowRight aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="store-section store-section--tinted" id="how-it-works">
          <div className="store-section__head">
            <p className="store-eyebrow">How it works</p>
            <h2 className="store-section__title">From a place to a poster in minutes</h2>
          </div>
          <ol className="steps-grid">
            <li className="step-card">
              <span className="step-card__num">01</span>
              <LuMapPin className="step-card__icon" aria-hidden="true" />
              <h3>Find your place</h3>
              <p>Search any city, address or landmark, then pan and zoom until the framing is just right.</p>
            </li>
            <li className="step-card">
              <span className="step-card__num">02</span>
              <LuPalette className="step-card__icon" aria-hidden="true" />
              <h3>Make it yours</h3>
              <p>Choose a palette, typeface and words, and add a marker for the spot that matters.</p>
            </li>
            <li className="step-card">
              <span className="step-card__num">03</span>
              <LuFrame className="step-card__icon" aria-hidden="true" />
              <h3>Pick size &amp; frame</h3>
              <p>See it framed in real time, from A4 up to 50 × 70 cm, in black, white or oak.</p>
            </li>
            <li className="step-card">
              <span className="step-card__num">04</span>
              <LuTruck className="step-card__icon" aria-hidden="true" />
              <h3>We print &amp; deliver</h3>
              <p>Your poster is printed to order on archival paper and delivered to your door.</p>
            </li>
          </ol>
          <div className="store-section__cta">
            <Link to="/create" className="store-btn store-btn--dark store-btn--lg">
              Start designing <LuArrowRight aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section className="store-section feature-split">
          <div className="feature-split__copy">
            <p className="store-eyebrow">Endless combinations</p>
            <h2 className="store-section__title">Designed by you, down to the last detail</h2>
            <ul className="feature-list">
              <li>
                <LuPalette aria-hidden="true" />
                <div>
                  <h3>{themeOptions.length} palettes</h3>
                  <p>From quiet marble whites to midnight blue and gold. Every colour can be fine-tuned.</p>
                </div>
              </li>
              <li>
                <LuType aria-hidden="true" />
                <div>
                  <h3>Your words, your type</h3>
                  <p>Write your own title and subtitle, and pick from ten typefaces.</p>
                </div>
              </li>
              <li>
                <LuMapPin aria-hidden="true" />
                <div>
                  <h3>Markers &amp; routes</h3>
                  <p>Pin the places that matter, or trace a marathon, a road trip or your daily walk.</p>
                </div>
              </li>
              <li>
                <LuRuler aria-hidden="true" />
                <div>
                  <h3>Print-perfect framing</h3>
                  <p>Your preview is your print. Every design is rendered at 300 DPI for production.</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="palette-wall" aria-label="Some of the available palettes">
            {palettes.map((theme) => (
              <div key={theme.id} className="palette-chip" title={theme.name}>
                <div className="palette-chip__swatches">
                  {theme.palette.slice(0, 5).map((color, index) => (
                    <span key={`${theme.id}-${index}`} style={{ background: color }} />
                  ))}
                </div>
                <span className="palette-chip__name">{theme.name}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="store-section store-section--tinted" id="pricing">
          <div className="store-section__head">
            <p className="store-eyebrow">Sizes &amp; prices</p>
            <h2 className="store-section__title">Choose the perfect size</h2>
            <p className="store-section__lede">
              All prints are on 200 g/m² museum matte paper. Add a frame to any size.
            </p>
          </div>
          <div className="pricing-grid">
            {PRINT_SIZES.map((size) => (
              <div key={size.id} className={`price-card${size.popular ? " price-card--popular" : ""}`}>
                {size.popular ? <span className="price-card__badge">Most popular</span> : null}
                <div
                  className="price-card__shape"
                  aria-hidden="true"
                  style={{ width: `${size.widthCm * 1.3}px`, height: `${size.heightCm * 1.3}px` }}
                />
                <h3 className="price-card__label">{size.label}</h3>
                <p className="price-card__dims">
                  {size.widthCm} × {size.heightCm} cm
                </p>
                <p className="price-card__price">{formatMoney(size.price)}</p>
                <p className="price-card__frame">Framed {formatMoney(size.price + size.framePrice)}</p>
              </div>
            ))}
          </div>
          <div className="frame-strip">
            {FRAME_OPTIONS.filter((frame) => frame.id !== "none").map((frame) => (
              <div key={frame.id} className="frame-strip__item">
                <span className={`frame-card__swatch frame-card__swatch--${frame.id}`} aria-hidden="true" />
                <div>
                  <h3>{frame.label}</h3>
                  <p>{frame.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="store-section" id="faq">
          <div className="store-section__head">
            <p className="store-eyebrow">Good to know</p>
            <h2 className="store-section__title">Questions, answered</h2>
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

        <section className="closing-cta">
          <h2>Every place has a story.</h2>
          <p>Put yours on the wall.</p>
          <Link to="/create" className="store-btn store-btn--light store-btn--lg">
            Create your map poster <LuArrowRight aria-hidden="true" />
          </Link>
        </section>
      </main>

      <StoreFooter />
    </div>
  );
}
