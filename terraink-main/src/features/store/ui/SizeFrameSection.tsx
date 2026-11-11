import { LuRectangleHorizontal, LuRectangleVertical } from "react-icons/lu";
import {
  FRAME_OPTIONS,
  PAPER_DESCRIPTION,
  PRINT_SIZES,
  formatMoney,
  resolveDimensions,
  unitPrice,
  type Orientation,
} from "../domain/catalog";
import { useStore } from "./StoreContext";

const formatCm = (value: number) => String(Math.round(value * 10) / 10);

/** Step 4 of the studio: print size, orientation and frame, with live prices. */
export default function SizeFrameSection() {
  const { product, setProduct } = useStore();

  return (
    <div className="size-frame">
      <section className="size-frame__group" aria-labelledby="size-frame-size">
        <h3 id="size-frame-size" className="size-frame__title">Print size</h3>
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
                <span className="size-card__label">{size.label}</span>
                <span className="size-card__dims">
                  {formatCm(dims.widthCm)} × {formatCm(dims.heightCm)} cm
                </span>
                <span className="size-card__price">{formatMoney(size.price)}</span>
                {size.popular ? <span className="size-card__badge">Most popular</span> : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="size-frame__group" aria-labelledby="size-frame-orientation">
        <h3 id="size-frame-orientation" className="size-frame__title">Orientation</h3>
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
              {orientation === "portrait" ? "Portrait" : "Landscape"}
            </button>
          ))}
        </div>
      </section>

      <section className="size-frame__group" aria-labelledby="size-frame-frame">
        <h3 id="size-frame-frame" className="size-frame__title">Frame</h3>
        <div className="size-frame__frames" role="radiogroup" aria-labelledby="size-frame-frame">
          {FRAME_OPTIONS.map((frame) => {
            const selected = product.frameId === frame.id;
            const extra = unitPrice({ ...product, frameId: frame.id }) - unitPrice({ ...product, frameId: "none" });
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
                  <span className="frame-card__label">{frame.label}</span>
                  <span className="frame-card__desc">{frame.description}</span>
                </span>
                <span className="frame-card__price">{extra > 0 ? `+ ${formatMoney(extra)}` : "Included"}</span>
              </button>
            );
          })}
        </div>
      </section>

      <p className="size-frame__paper">{PAPER_DESCRIPTION}</p>
    </div>
  );
}
