import { LuBanknote, LuLoader, LuPrinter, LuShoppingBag, LuTruck } from "react-icons/lu";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { useRouter } from "@/core/router/router";
import { useAddToCart } from "../application/useAddToCart";
import { FREE_SHIPPING_THRESHOLD, unitPrice } from "../domain/catalog";
import { useStore } from "./StoreContext";
import { useStoreText } from "./storeText";

/** The "buy box": a summary of the configured poster with its price. */
export default function PurchasePanel({ isMobile }: { isMobile: boolean }) {
  const { state, effectiveTheme } = usePosterContext();
  const { product, setEditingItemId } = useStore();
  const { navigate } = useRouter();
  const { addToCart, isAdding, error, isEditing } = useAddToCart();

  const { t, money, sizeLabel, frameLabel, language } = useStoreText();
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
          <LuShoppingBag aria-hidden="true" /> {buttonLabel} · {money(price)}
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
            {sizeLabel(product.sizeId)} · {frameLabel(product.frameId)}
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
          {isAdding ? t("buy.preparingShort") : isEditing ? t("buy.updateShort") : t("buy.add")}
        </button>
        {errorText ? <p className="studio-buy-bar__error" role="alert">{errorText}</p> : null}
      </div>
    );
  }

  return (
    <aside className="studio-buy" aria-label={t("buy.yourPoster")}>
      <p className="store-eyebrow">{isEditing ? t("buy.editing") : t("buy.yourPoster")}</p>
      <h2 className="studio-buy__title">{title}</h2>
      <p className="studio-buy__subtitle">
        {[state.form.displayCountry, effectiveTheme.name].filter(Boolean).join(" · ")}
      </p>

      <dl className="studio-buy__specs">
        <div>
          <dt>{t("buy.size")}</dt>
          <dd>
            {sizeLabel(product.sizeId)} ·{" "}
            {t(product.orientation === "landscape" ? "orientation.landscape" : "orientation.portrait")}
          </dd>
        </div>
        <div>
          <dt>{t("buy.frame")}</dt>
          <dd>{frameLabel(product.frameId)}</dd>
        </div>
        <div>
          <dt>{t("buy.paper")}</dt>
          <dd>{t("buy.paperValue")}</dd>
        </div>
      </dl>

      <div className="studio-buy__price">
        <span className="studio-buy__amount">{money(price)}</span>
        <span className="studio-buy__note">
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

      <ul className="studio-buy__trust">
        <li><LuPrinter aria-hidden="true" /> {t("buy.trust1")}</li>
        <li><LuTruck aria-hidden="true" /> {t("buy.trust2")}</li>
        <li><LuBanknote aria-hidden="true" /> {t("buy.trust3")}</li>
      </ul>
    </aside>
  );
}
