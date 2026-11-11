import { LuBanknote, LuLoader, LuPrinter, LuShoppingBag, LuTruck } from "react-icons/lu";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { useRouter } from "@/core/router/router";
import { useAddToCart } from "../application/useAddToCart";
import {
  FREE_SHIPPING_THRESHOLD,
  formatMoney,
  getFrame,
  getPrintSize,
  unitPrice,
} from "../domain/catalog";
import { useStore } from "./StoreContext";

/** The "buy box": a summary of the configured poster with its price. */
export default function PurchasePanel({ isMobile }: { isMobile: boolean }) {
  const { state, effectiveTheme } = usePosterContext();
  const { product, setEditingItemId } = useStore();
  const { navigate } = useRouter();
  const { addToCart, isAdding, error, isEditing } = useAddToCart();

  const size = getPrintSize(product.sizeId);
  const frame = getFrame(product.frameId);
  const price = unitPrice(product);
  const title = (state.form.displayCity || state.form.location || "Your map").trim();
  const buttonLabel = isEditing ? "Update cart item" : "Add to cart";

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
          <LuLoader className="store-spin" aria-hidden="true" /> Preparing your poster…
        </>
      ) : (
        <>
          <LuShoppingBag aria-hidden="true" /> {buttonLabel} · {formatMoney(price)}
        </>
      )}
    </button>
  );

  if (isMobile) {
    return (
      <div className="studio-buy-bar" role="region" aria-label="Purchase">
        <div className="studio-buy-bar__info">
          <span className="studio-buy-bar__price">{formatMoney(price)}</span>
          <span className="studio-buy-bar__meta">
            {size.label} · {frame.id === "none" ? "Print only" : frame.label}
          </span>
        </div>
        <button
          type="button"
          className="store-btn store-btn--primary studio-buy-bar__cta"
          onClick={() => void addToCart()}
          disabled={isAdding}
          aria-busy={isAdding}
        >
          {isAdding ? <LuLoader className="store-spin" aria-hidden="true" /> : <LuShoppingBag aria-hidden="true" />}
          {isAdding ? "Preparing…" : isEditing ? "Update" : "Add to cart"}
        </button>
        {error ? <p className="studio-buy-bar__error" role="alert">{error}</p> : null}
      </div>
    );
  }

  return (
    <aside className="studio-buy" aria-label="Your poster">
      <p className="store-eyebrow">{isEditing ? "Editing cart item" : "Your poster"}</p>
      <h2 className="studio-buy__title">{title}</h2>
      <p className="studio-buy__subtitle">
        {[state.form.displayCountry, effectiveTheme.name].filter(Boolean).join(" · ")}
      </p>

      <dl className="studio-buy__specs">
        <div>
          <dt>Size</dt>
          <dd>
            {size.label} · {product.orientation === "landscape" ? "Landscape" : "Portrait"}
          </dd>
        </div>
        <div>
          <dt>Frame</dt>
          <dd>{frame.label}</dd>
        </div>
        <div>
          <dt>Paper</dt>
          <dd>Museum matte, 200 g/m²</dd>
        </div>
      </dl>

      <div className="studio-buy__price">
        <span className="studio-buy__amount">{formatMoney(price)}</span>
        <span className="studio-buy__note">
          {price >= FREE_SHIPPING_THRESHOLD
            ? "Free shipping included"
            : `Free shipping over ${formatMoney(FREE_SHIPPING_THRESHOLD)}`}
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
          Cancel editing
        </button>
      ) : null}
      {error ? <p className="store-error" role="alert">{error}</p> : null}

      <ul className="studio-buy__trust">
        <li><LuPrinter aria-hidden="true" /> Printed with archival pigment inks</li>
        <li><LuTruck aria-hidden="true" /> Ships in 3–5 business days</li>
        <li><LuBanknote aria-hidden="true" /> Pay on delivery</li>
      </ul>
    </aside>
  );
}
