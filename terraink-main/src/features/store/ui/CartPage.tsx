import { LuArrowRight, LuMinus, LuPencil, LuPlus, LuTrash2, LuTruck } from "react-icons/lu";
import { Link, useRouter } from "@/core/router/router";
import {
  FREE_SHIPPING_THRESHOLD,
  MAX_QUANTITY_PER_ITEM,
  resolveDimensions,
  unitPrice,
} from "../domain/catalog";
import FramedPoster from "./FramedPoster";
import StoreFooter from "./StoreFooter";
import StoreHeader from "./StoreHeader";
import { useStore } from "./StoreContext";
import OrderTotalsList from "./OrderTotalsList";
import { useStoreText } from "./storeText";

export default function CartPage() {
  const { cart, totals, removeItem, setQuantity } = useStore();
  const { navigate } = useRouter();
  const { t, money, describe } = useStoreText();
  const remaining = FREE_SHIPPING_THRESHOLD - totals.subtotal;

  return (
    <div className="store-page store-page--cart">
      <StoreHeader variant="site" />
      <main className="store-container">
        <div className="page-head">
          <h1 className="page-title">{t("cart.title")}</h1>
          {cart.length > 0 ? (
            <Link to="/create" className="store-link">
              {t("cart.another")}
            </Link>
          ) : null}
        </div>

        {cart.length === 0 ? (
          <div className="empty-state">
            <h2>{t("cart.empty")}</h2>
            <p>{t("cart.emptyText")}</p>
            <Link to="/create" className="store-btn store-btn--primary store-btn--lg">
              {t("cart.create")} <LuArrowRight className="rtl-flip" aria-hidden="true" />
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
                        alt={t("cart.previewAlt", { title: item.summary.title })}
                        frameId={item.product.frameId}
                        ratio={widthCm / heightCm}
                        size="sm"
                      />
                    </div>
                    <div className="cart-line__body">
                      <div className="cart-line__head">
                        <div>
                          <h2 className="cart-line__title">{item.summary.title}</h2>
                          <p className="cart-line__meta">{describe(item.product)}</p>
                          <p className="cart-line__meta cart-line__meta--soft">
                            {item.summary.themeName} · {item.summary.fontFamily}
                          </p>
                        </div>
                        <p className="cart-line__price">{money(price * item.quantity)}</p>
                      </div>
                      <div className="cart-line__actions">
                        <div className="qty" role="group" aria-label={t("cart.qtyFor", { title: item.summary.title })}>
                          <button
                            type="button"
                            onClick={() => setQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            aria-label={t("cart.decrease")}
                          >
                            <LuMinus />
                          </button>
                          <span aria-live="polite">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => setQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= MAX_QUANTITY_PER_ITEM}
                            aria-label={t("cart.increase")}
                          >
                            <LuPlus />
                          </button>
                        </div>
                        <button
                          type="button"
                          className="store-btn store-btn--ghost store-btn--sm"
                          onClick={() => navigate(`/create?edit=${encodeURIComponent(item.id)}`)}
                        >
                          <LuPencil aria-hidden="true" /> {t("cart.edit")}
                        </button>
                        <button
                          type="button"
                          className="store-btn store-btn--ghost store-btn--sm store-btn--danger"
                          onClick={() => removeItem(item.id)}
                        >
                          <LuTrash2 aria-hidden="true" /> {t("cart.remove")}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <aside className="summary-card">
              <h2 className="summary-card__title">{t("cart.summary")}</h2>
              {remaining > 0 ? (
                <div className="ship-progress">
                  <p>
                    <LuTruck aria-hidden="true" /> {t("cart.addMore", { amount: money(remaining) })}
                  </p>
                  <div className="ship-progress__bar">
                    <span style={{ width: `${Math.min(100, (totals.subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }} />
                  </div>
                </div>
              ) : (
                <p className="ship-progress ship-progress--done">
                  <LuTruck aria-hidden="true" /> {t("cart.free")}
                </p>
              )}
              <OrderTotalsList totals={totals} />
              <Link to="/checkout" className="store-btn store-btn--primary store-btn--block store-btn--lg">
                {t("cart.checkout")} <LuArrowRight className="rtl-flip" aria-hidden="true" />
              </Link>
              <p className="summary-card__note">{t("cart.note")}</p>
            </aside>
          </div>
        )}
      </main>
      <StoreFooter />
    </div>
  );
}
