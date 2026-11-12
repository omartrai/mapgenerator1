import { LuCheck, LuRectangleHorizontal, LuRectangleVertical } from "react-icons/lu";
import {
  FRAME_DEPTHS,
  FRAME_OPTIONS,
  frameDepthOf,
  PRINT_SIZES,
  resolveDimensions,
  unitPrice,
  type Orientation,
} from "../domain/catalog";
import { useStore } from "./StoreContext";
import { useStoreText, type StoreTextKey } from "./storeText";

const formatCm = (value: number) => String(Math.round(value * 10) / 10);

/**
 * Step 4 of the studio: orientation, print size, frame and frame depth.
 * One decision per block, read top to bottom, each with its price.
 */
export default function SizeFrameSection() {
  const { product, setProduct } = useStore();
  const { t, money, frameLabel, shapeName, depthLabel } = useStoreText();

  const selectedFrame = FRAME_OPTIONS.find((frame) => frame.id === product.frameId) ?? FRAME_OPTIONS[0];
  const frameExtra = (frameId: string) =>
    unitPrice({ ...product, frameId: frameId as typeof product.frameId, mat: false }) - unitPrice({ ...product, frameId: "none" });

  return (
    <div className="sf">
      <section className="sf-block" aria-labelledby="sf-orientation">
        <h3 id="sf-orientation" className="sf-block__title">{t("sizes.orientation")}</h3>
        <div className="sf-orientation" role="radiogroup" aria-labelledby="sf-orientation">
          {(["portrait", "landscape"] as Orientation[]).map((orientation) => (
            <button
              key={orientation}
              type="button"
              role="radio"
              aria-checked={product.orientation === orientation}
              className={`sf-orientation__opt${product.orientation === orientation ? " is-selected" : ""}`}
              onClick={() => setProduct({ orientation })}
            >
              {orientation === "portrait" ? <LuRectangleVertical aria-hidden="true" /> : <LuRectangleHorizontal aria-hidden="true" />}
              {t(orientation === "portrait" ? "orientation.portrait" : "orientation.landscape")}
            </button>
          ))}
        </div>
      </section>

      <section className="sf-block" aria-labelledby="sf-size">
        <h3 id="sf-size" className="sf-block__title">{t("sizes.print")}</h3>
        <div className="sf-list" role="radiogroup" aria-labelledby="sf-size">
          {PRINT_SIZES.map((size) => {
            const selected = product.sizeId === size.id;
            const dims = resolveDimensions({ ...product, sizeId: size.id });
            return (
              <button
                key={size.id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`sf-row${selected ? " is-selected" : ""}`}
                onClick={() => setProduct({ sizeId: size.id })}
              >
                <span className="sf-row__radio" aria-hidden="true">{selected ? <LuCheck /> : null}</span>
                <span className="sf-row__main" title={shapeName(size.id, product.orientation)}>
                  <strong>
                    {formatCm(dims.widthCm)} × {formatCm(dims.heightCm)} cm
                  </strong>
                  {size.popular ? <span className="sf-row__badge">{t("sizes.popular")}</span> : null}
                </span>
                <span className="sf-row__price">{money(size.price)}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="sf-block" aria-labelledby="sf-frame">
        <h3 id="sf-frame" className="sf-block__title">{t("sizes.frame")}</h3>
        <div className="sf-swatches" role="radiogroup" aria-labelledby="sf-frame">
          {FRAME_OPTIONS.map((frame) => {
            const selected = product.frameId === frame.id;
            return (
              <button
                key={frame.id}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={frameLabel(frame.id)}
                title={frameLabel(frame.id)}
                className={`sf-swatch${selected ? " is-selected" : ""}`}
                onClick={() => setProduct({ frameId: frame.id })}
              >
                <span className={`frame-card__swatch frame-card__swatch--${frame.id} sf-swatch__tile`} aria-hidden="true" />
              </button>
            );
          })}
        </div>
        <div className="sf-frame-info">
          <p>
            <strong>{frameLabel(selectedFrame.id)}</strong>
            <span>{frameExtra(selectedFrame.id) > 0 ? `+ ${money(frameExtra(selectedFrame.id))}` : t("sizes.included")}</span>
          </p>
          <small>
            {t(`frame.${selectedFrame.id}.desc` as StoreTextKey)} {t("paper")}
          </small>
        </div>
      </section>

      {product.frameId !== "none" ? (
        <section className="sf-block" aria-labelledby="sf-depth">
          <h3 id="sf-depth" className="sf-block__title">{t("depth.title")}</h3>
          <div className="sf-orientation" role="radiogroup" aria-labelledby="sf-depth">
            {FRAME_DEPTHS.map((depth) => {
              const selected = frameDepthOf(product) === depth;
              const extra = unitPrice({ ...product, frameDepth: depth }) - unitPrice({ ...product, frameDepth: "1.5" });
              return (
                <button
                  key={depth}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`sf-orientation__opt${selected ? " is-selected" : ""}`}
                  onClick={() => setProduct({ frameDepth: depth })}
                >
                  {depthLabel(depth)}
                  {extra > 0 ? <small>+ {money(extra)}</small> : null}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
