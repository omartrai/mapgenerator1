import { LuArrowRight, LuMinus, LuPencil, LuPlus, LuTrash2, LuTruck } from "react-icons/lu";
import { Link, useRouter } from "@/core/router/router";
import {
  FREE_SHIPPING_THRESHOLD,
  MAX_QUANTITY_PER_ITEM,
  describeProduct,
  formatMoney,
  resolveDimensions,
  unitPrice,
} from "../domain/catalog";
import FramedPoster from "./FramedPoster";
import StoreFooter from "./StoreFooter";
import StoreHeader from "./StoreHeader";
import { useStore } from "./StoreContext";
import OrderTotalsList from "./OrderTotalsList";

export default function CartPage() {
  const { cart, totals, removeItem, setQuantity } = useStore();
  const { navigate } = useRouter();
  const remaining = FREE_SHIPPING_THRESHOLD - totals.subtotal;

  return (
    <div className="store-page store-page--cart">
      <StoreHeader variant="site" />
      <main className="store-container">
        <div className="page-head">
          <h1 className="page-title">Your cart</h1>
          {cart.length > 0 ? (
            <Link to="/create" className="store-link">
              Design another poster
            </Link>
          ) : null}
        </div>

        {cart.length === 0 ? (
          <div className="empty-state">
            <h2>Your cart is empty</h2>
            <p>Design a poster of a place you love. It only takes a few minutes.</p>
            <Link to="/create" className="store-btn store-btn--primary store-btn--lg">
              Create your map <LuArrowRight aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            <ul className="cart-list">
              {cart.map((item) => {
                const { widthCm, heightCm } = resolveDimensions(item.product);
                const price = unitPrice(item.product);
                return (
                  <li key={item.id} className="cart-line">
                    <div className="cart-line__visual">
                      <FramedPoster
                        src={item.previewDataUrl}
                        alt={`${item.summary.title} poster preview`}
                        frameId={item.product.frameId}
                        ratio={widthCm / heightCm}
                        size="sm"
                      />
                    </div>
                    <div className="cart-line__body">
                      <div className="cart-line__head">
                        <div>
                          <h2 className="cart-line__title">{item.summary.title}</h2>
                          <p className="cart-line__meta">{describeProduct(item.product)}</p>
                          <p className="cart-line__meta cart-line__meta--soft">
                            {item.summary.themeName} · {item.summary.fontFamily}
                          </p>
                        </div>
                        <p className="cart-line__price">{formatMoney(price * item.quantity)}</p>
                      </div>
                      <div className="cart-line__actions">
                        <div className="qty" role="group" aria-label={`Quantity for ${item.summary.title}`}>
                          <button
                            type="button"
                            onClick={() => setQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            aria-label="Decrease quantity"
                          >
                            <LuMinus />
                          </button>
                          <span aria-live="polite">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => setQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= MAX_QUANTITY_PER_ITEM}
                            aria-label="Increase quantity"
                          >
                            <LuPlus />
                          </button>
                        </div>
                        <button
                          type="button"
                          className="store-btn store-btn--ghost store-btn--sm"
                          onClick={() => navigate(`/create?edit=${encodeURIComponent(item.id)}`)}
                        >
                          <LuPencil aria-hidden="true" /> Edit design
                        </button>
                        <button
                          type="button"
                          className="store-btn store-btn--ghost store-btn--sm store-btn--danger"
                          onClick={() => removeItem(item.id)}
                        >
                          <LuTrash2 aria-hidden="true" /> Remove
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <aside className="summary-card">
              <h2 className="summary-card__title">Order summary</h2>
              {remaining > 0 ? (
                <div className="ship-progress">
                  <p>
                    <LuTruck aria-hidden="true" /> Add {formatMoney(remaining)} more for free shipping
                  </p>
                  <div className="ship-progress__bar">
                    <span style={{ width: `${Math.min(100, (totals.subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }} />
                  </div>
                </div>
              ) : (
                <p className="ship-progress ship-progress--done">
                  <LuTruck aria-hidden="true" /> Your order ships free
                </p>
              )}
              <OrderTotalsList totals={totals} />
              <Link to="/checkout" className="store-btn store-btn--primary store-btn--block store-btn--lg">
                Checkout <LuArrowRight aria-hidden="true" />
              </Link>
              <p className="summary-card__note">Pay on delivery. Nothing to pay online.</p>
            </aside>
          </div>
        )}
      </main>
      <StoreFooter />
    </div>
  );
}
