import { LuRectangleHorizontal, LuRectangleVertical } from "react-icons/lu";
import {
  FRAME_OPTIONS,
  PRINT_SIZES,
  formatRatio,
  resolveDimensions,
  unitPrice,
  type Orientation,
} from "../domain/catalog";
import { useStore } from "./StoreContext";
import { useStoreText, type StoreTextKey } from "./storeText";

const formatCm = (value: number) => String(Math.round(value * 10) / 10);

/** Step 4 of the studio: print size, orientation and frame, with live prices. */
export default function SizeFrameSection() {
  const { product, setProduct } = useStore();
  const { t, money, frameLabel, shapeName } = useStoreText();

  return (
    <div className="size-frame">
      <section className="size-frame__group" aria-labelledby="size-frame-size">
        <h3 id="size-frame-size" className="size-frame__title">{t("sizes.print")}</h3>
        <div className="size-frame__sizes" role="radiogroup" aria-labelledby="size-frame-size">
          {PRINT_SIZES.map((size) => {
            const selected = product.sizeId === size.id;
            const dims = resolveDimensions({ ...product, sizeId: size.id });
            return (
              <button
                key={size.id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`size-card${selected ? " is-selected" : ""}`}
                onClick={() => setProduct({ sizeId: size.id })}
              >
                <span
                  className="size-card__glyph"
                  aria-hidden="true"
                  style={{
                    width: `${Math.round((dims.widthCm / 70) * 30 + 10)}px`,
                    height: `${Math.round((dims.heightCm / 70) * 30 + 10)}px`,
                  }}
                />
                <span className="size-card__label">{formatRatio(size.id, product.orientation)}</span>
                <span className="size-card__name">{shapeName(size.id, product.orientation)}</span>
                <span className="size-card__dims">
                  {formatCm(dims.widthCm)} × {formatCm(dims.heightCm)} cm
                </span>
                <span className="size-card__price">{money(size.price)}</span>
                {size.popular ? <span className="size-card__badge">{t("sizes.popular")}</span> : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="size-frame__group" aria-labelledby="size-frame-orientation">
        <h3 id="size-frame-orientation" className="size-frame__title">{t("sizes.orientation")}</h3>
        <div className="segmented" role="radiogroup" aria-labelledby="size-frame-orientation">
          {(["portrait", "landscape"] as Orientation[]).map((orientation) => (
            <button
              key={orientation}
              type="button"
              role="radio"
              aria-checked={product.orientation === orientation}
              className={`segmented__option${product.orientation === orientation ? " is-selected" : ""}`}
              onClick={() => setProduct({ orientation })}
            >
              {orientation === "portrait" ? (
                <LuRectangleVertical aria-hidden="true" />
              ) : (
                <LuRectangleHorizontal aria-hidden="true" />
              )}
              {t(orientation === "portrait" ? "orientation.portrait" : "orientation.landscape")}
            </button>
          ))}
        </div>
      </section>

      <section className="size-frame__group" aria-labelledby="size-frame-frame">
        <h3 id="size-frame-frame" className="size-frame__title">{t("sizes.frame")}</h3>
        <div className="size-frame__frames" role="radiogroup" aria-labelledby="size-frame-frame">
          {FRAME_OPTIONS.map((frame) => {
            const selected = product.frameId === frame.id;
            const extra =
              unitPrice({ ...product, frameId: frame.id, mat: false }) - unitPrice({ ...product, frameId: "none" });
            return (
              <button
                key={frame.id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`frame-card${selected ? " is-selected" : ""}`}
                onClick={() => setProduct({ frameId: frame.id })}
              >
                <span className={`frame-card__swatch frame-card__swatch--${frame.id}`} aria-hidden="true" />
                <span className="frame-card__text">
                  <span className="frame-card__label">{frameLabel(frame.id)}</span>
                  <span className="frame-card__desc">{t(`frame.${frame.id}.desc` as StoreTextKey)}</span>
                </span>
                <span className="frame-card__price">{extra > 0 ? `+ ${money(extra)}` : t("sizes.included")}</span>
              </button>
            );
          })}
        </div>
      </section>

      {product.frameId !== "none" ? (
        <section className="size-frame__group" aria-labelledby="size-frame-mat">
          <h3 id="size-frame-mat" className="size-frame__title">{t("mat.title")}</h3>
          <p className="size-frame__note">{t("mat.note")}</p>
          <div className="size-frame__mats" role="radiogroup" aria-labelledby="size-frame-mat">
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

      <p className="size-frame__paper">{t("paper")}</p>
    </div>
  );
}
