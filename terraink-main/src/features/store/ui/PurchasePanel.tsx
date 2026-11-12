import {
  LuBan,
  LuCheck,
  LuChevronDown,
  LuInfo,
  LuLoader,
  LuLock,
  LuMapPin,
  LuPackage,
  LuPrinter,
  LuRectangleHorizontal,
  LuRectangleVertical,
  LuShoppingCart,
  LuTruck,
} from "react-icons/lu";
import { useState, type ReactNode } from "react";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { useRouter } from "@/core/router/router";
import { useAddToCart } from "../application/useAddToCart";
import {
  FRAME_OPTIONS,
  FREE_SHIPPING_THRESHOLD,
  PRINT_SIZES,
  formatRatio,
  resolveDimensions,
  unitPrice,
  type Orientation,
  FRAME_DEPTHS,
  frameDepthOf,
} from "../domain/catalog";
import { useStore } from "./StoreContext";
import { useStoreText, type StoreTextKey } from "./storeText";

/** The "buy box": a summary of the configured poster with its price. */
export default function PurchasePanel({ isMobile }: { isMobile: boolean }) {
  const { state } = usePosterContext();
  const { product, setProduct, setEditingItemId } = useStore();
  const { navigate } = useRouter();
  const { addToCart, isAdding, error, isEditing } = useAddToCart();

  const { t, money, sizeLabel, shapeName, frameLabel, depthLabel, language } = useStoreText();
  // Starts as a summary (format, frame, finishing): the full choices live
  // in the "Format & cadre" tab; "Modifier" opens one step here.
  const [step, setStep] = useState<number | null>(null);
  const price = unitPrice(product);
  const title = (state.form.displayCity || state.form.location || t("buy.yourMap")).trim();
  const buttonLabel = isEditing ? t("buy.update") : t("buy.add");
  const errorText = error ? (language === "en" ? error : t("buy.error")) : "";

  const button = (
    <button
      type="button"
      className="store-btn store-btn--primary store-btn--block studio-buy__cta"
      onClick={() => void addToCart()}
      disabled={isAdding}
      aria-busy={isAdding}
    >
      {isAdding ? (
        <>
          <LuLoader className="store-spin" aria-hidden="true" /> {t("buy.preparing")}
        </>
      ) : (
        <>
          <LuShoppingCart aria-hidden="true" /> {buttonLabel} — {money(price)}
        </>
      )}
    </button>
  );

  if (isMobile) {
    return (
      <div className="studio-buy-bar" role="region" aria-label={t("buy.region")}>
        <div className="studio-buy-bar__info">
          <span className="studio-buy-bar__price">{money(price)}</span>
          <span className="studio-buy-bar__meta">
            {formatRatio(product.sizeId, product.orientation)} · {sizeLabel(product.sizeId)} · {frameLabel(product.frameId)}
          </span>
        </div>
        <button
          type="button"
          className="store-btn store-btn--primary studio-buy-bar__cta"
          onClick={() => void addToCart()}
          disabled={isAdding}
          aria-busy={isAdding}
        >
          {isAdding ? <LuLoader className="store-spin" aria-hidden="true" /> : <LuShoppingCart aria-hidden="true" />}
          {isAdding ? t("buy.preparingShort") : isEditing ? t("buy.updateShort") : t("buy.add")}
        </button>
        {errorText ? <p className="studio-buy-bar__error" role="alert">{errorText}</p> : null}
      </div>
    );
  }

  const finishSummary = [
    ...(product.frameId !== "none"
      ? [t(product.mat === true ? "mat.with" : "mat.without"), depthLabel(frameDepthOf(product))]
      : []),
    t("buy.paperValue"),
  ].join(" · ");

  const formatCm = (value: number) => String(Math.round(value * 10) / 10).replace(".", language === "en" ? "." : ",");

  return (
    <aside className="studio-buy" aria-label={t("buy.yourPoster")}>
      <p className="store-eyebrow">{isEditing ? t("buy.editing") : t("buy.yourPoster")}</p>
      <h2 className="studio-buy__title">{title}</h2>
      {state.form.displayCountry ? (
        <p className="studio-buy__subtitle">
          <LuMapPin aria-hidden="true" /> {state.form.displayCountry}
        </p>
      ) : null}

      <ol className="buy-steps">
        <BuyStep
          index={1}
          title={t("buy.size")}
          summary={`${formatRatio(product.sizeId, product.orientation)} ${shapeName(product.sizeId, product.orientation)} · ${sizeLabel(product.sizeId)}`}
          open={step === 1}
          onOpen={() => setStep(1)}
          onNext={() => setStep(2)}
          nextLabel={t("buyStep.next")}
          changeLabel={t("buyStep.change")}
        >
          <section className="studio-buy__group" aria-labelledby="buy-format">
            <div className="studio-buy__group-head">
              <h3 id="buy-format">{t("sizes.orientation")}</h3>
              <div className="studio-buy__orient" role="radiogroup" aria-label={t("sizes.orientation")}>
                {(["portrait", "landscape"] as Orientation[]).map((orientation) => {
                  const label = t(orientation === "portrait" ? "orientation.portrait" : "orientation.landscape");
                  return (
                    <button
                      key={orientation}
                      type="button"
                      role="radio"
                      aria-checked={product.orientation === orientation}
                      aria-label={label}
                      title={label}
                      className={product.orientation === orientation ? "is-selected" : ""}
                      onClick={() => setProduct({ orientation })}
                    >
                      {orientation === "portrait" ? <LuRectangleVertical aria-hidden="true" /> : <LuRectangleHorizontal aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="studio-buy__sizes" role="radiogroup" aria-labelledby="buy-format">
              {PRINT_SIZES.map((size) => {
                const dims = resolveDimensions({ ...product, sizeId: size.id });
                const selected = product.sizeId === size.id;
                return (
                  <button
                    key={size.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`buy-size${selected ? " is-selected" : ""}`}
                    title={`${formatCm(dims.widthCm)} × ${formatCm(dims.heightCm)} cm`}
                    onClick={() => setProduct({ sizeId: size.id })}
                  >
                    <strong>{formatRatio(size.id, product.orientation)}</strong>
                    <small>{shapeName(size.id, product.orientation)}</small>
                    <span>{money(unitPrice({ ...product, sizeId: size.id }))}</span>
                  </button>
                );
              })}
            </div>
          </section>


        </BuyStep>

        <BuyStep
          index={2}
          title={t("buy.frame")}
          summary={frameLabel(product.frameId)}
          open={step === 2}
          onOpen={() => setStep(2)}
          onNext={() => setStep(3)}
          nextLabel={t("buyStep.next")}
          changeLabel={t("buyStep.change")}
        >
          <section className="studio-buy__group" aria-label={t("buy.frame")}>
            <div className="studio-buy__frames" role="radiogroup" aria-label={t("buy.frame")}>
              {FRAME_OPTIONS.map((frame) => {
                const selected = product.frameId === frame.id;
                return (
                  <button
                    key={frame.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`buy-frame${selected ? " is-selected" : ""}`}
                    onClick={() => setProduct({ frameId: frame.id })}
                  >
                    <span className={`buy-frame__swatch buy-frame__swatch--${frame.id}`} aria-hidden="true">
                      {frame.id === "none" ? <LuBan /> : null}
                    </span>
                    <span className="buy-frame__label">{t(`frameShort.${frame.id}` as StoreTextKey)}</span>
                  </button>
                );
              })}
            </div>
          </section>


        </BuyStep>

        <BuyStep
          index={3}
          title={t("buyStep.finish")}
          summary={finishSummary}
          open={step === 3}
          onOpen={() => setStep(3)}
          changeLabel={t("buyStep.change")}
        >
          {product.frameId !== "none" ? (
            <section className="studio-buy__group" aria-labelledby="buy-mat">
              <h3 id="buy-mat">{t("mat.title")}</h3>
              <div className="studio-buy__mats" role="radiogroup" aria-labelledby="buy-mat">
                {[true, false].map((mat) => {
                  const selected = (product.mat === true) === mat;
                  const extra = unitPrice({ ...product, mat: true }) - unitPrice({ ...product, mat: false });
                  return (
                    <button
                      key={String(mat)}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      className={`buy-frame buy-mat${selected ? " is-selected" : ""}`}
                      onClick={() => setProduct({ mat })}
                    >
                      <span
                        className={`buy-frame__swatch buy-frame__swatch--${product.frameId}${mat ? " has-mat" : ""}`}
                        aria-hidden="true"
                      />
                      <span className="buy-frame__label">{t(mat ? "mat.with" : "mat.without")}</span>
                      {mat ? <span className="buy-mat__price">+ {money(extra)}</span> : null}
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}


          {product.frameId !== "none" ? (
            <section className="studio-buy__group" aria-labelledby="buy-depth">
              <h3 id="buy-depth">{t("depth.title")}</h3>
              <div className="studio-buy__mats" role="radiogroup" aria-labelledby="buy-depth">
                {FRAME_DEPTHS.map((depth) => {
                  const selected = frameDepthOf(product) === depth;
                  const extra = unitPrice({ ...product, frameDepth: depth }) - unitPrice({ ...product, frameDepth: "1.5" });
                  return (
                    <button
                      key={depth}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      className={`buy-frame buy-depth${selected ? " is-selected" : ""}`}
                      onClick={() => setProduct({ frameDepth: depth })}
                    >
                      <span className={`buy-frame__swatch buy-frame__swatch--${product.frameId} buy-depth__swatch--${depth === "3" ? "thick" : "thin"}`} aria-hidden="true" />
                      <span className="buy-frame__label">{depthLabel(depth)}</span>
                      {extra > 0 ? <span className="buy-mat__price">+ {money(extra)}</span> : null}
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}


          <section className="studio-buy__group" aria-labelledby="buy-paper">
            <h3 id="buy-paper">
              {t("buy.paper")}
              <LuInfo aria-hidden="true" title={t("buy.paperNote")} />
            </h3>
            <p className="studio-buy__paper" title={t("buy.paperNote")}>
              {t("buy.paperValue")}
              <LuCheck aria-hidden="true" />
            </p>
          </section>


        </BuyStep>
      </ol>

      <div className="studio-buy__checkout">
      <div className="studio-buy__price">
        <span className="studio-buy__amount">{money(price)}</span>
        <span className="studio-buy__note">
          <LuTruck aria-hidden="true" />
          {price >= FREE_SHIPPING_THRESHOLD
            ? t("buy.freeIncluded")
            : t("buy.freeFrom", { amount: money(FREE_SHIPPING_THRESHOLD) })}
        </span>
      </div>

      {button}
      {isEditing ? (
        <button
          type="button"
          className="store-btn store-btn--ghost store-btn--block store-btn--sm"
          onClick={() => {
            setEditingItemId(null);
            navigate("/cart");
          }}
        >
          {t("buy.cancel")}
        </button>
      ) : null}
      {errorText ? <p className="store-error" role="alert">{errorText}</p> : null}
      </div>

      <ul className="studio-buy__trust">
        <li><LuPrinter aria-hidden="true" /> {t("buy.trust1")}</li>
        <li><LuPackage aria-hidden="true" /> {t("buy.trust2")}</li>
        <li><LuLock aria-hidden="true" /> {t("buy.trust3")}</li>
      </ul>
    </aside>
  );
}

/** One numbered step of the buy box: open shows its options, closed shows the choice. */
function BuyStep({
  index,
  title,
  summary,
  open,
  onOpen,
  onNext,
  nextLabel,
  changeLabel,
  children,
}: {
  index: number;
  title: string;
  summary: string;
  open: boolean;
  onOpen: () => void;
  onNext?: () => void;
  nextLabel?: string;
  changeLabel: string;
  children: ReactNode;
}) {
  const bodyId = `buy-step-${index}`;
  return (
    <li className={`buy-step${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="buy-step__head"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={onOpen}
      >
        <span className="buy-step__num" aria-hidden="true">{index}</span>
        <span className="buy-step__text">
          <span className="buy-step__title">{title}</span>
          {open ? null : <span className="buy-step__summary">{summary}</span>}
        </span>
        {open ? null : (
          <span className="buy-step__change">
            {changeLabel} <LuChevronDown aria-hidden="true" />
          </span>
        )}
      </button>
      {open ? (
        <div className="buy-step__body" id={bodyId}>
          {children}
          {onNext ? (
            <button type="button" className="store-btn store-btn--outline store-btn--block store-btn--sm buy-step__next" onClick={onNext}>
              {nextLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
