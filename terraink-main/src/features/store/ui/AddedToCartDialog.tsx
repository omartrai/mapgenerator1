import { useEffect, useRef } from "react";
import { LuCheck, LuX } from "react-icons/lu";
import { useRouter } from "@/core/router/router";
import { describeProduct, formatMoney, resolveDimensions, unitPrice } from "../domain/catalog";
import FramedPoster from "./FramedPoster";
import { useStore } from "./StoreContext";

export default function AddedToCartDialog() {
  const { lastAdded, dismissLastAdded, cartCount, totals } = useStore();
  const { navigate } = useRouter();
  const primaryRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!lastAdded) return;
    primaryRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismissLastAdded();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lastAdded, dismissLastAdded]);

  if (!lastAdded) return null;
  const { widthCm, heightCm } = resolveDimensions(lastAdded.product);

  return (
    <div className="store-dialog" role="dialog" aria-modal="true" aria-labelledby="added-title">
      <div className="store-dialog__backdrop" onClick={dismissLastAdded} aria-hidden="true" />
      <div className="store-dialog__panel added-dialog">
        <button type="button" className="store-dialog__close" onClick={dismissLastAdded} aria-label="Close">
          <LuX />
        </button>
        <div className="added-dialog__visual">
          <FramedPoster
            src={lastAdded.previewDataUrl}
            alt={`${lastAdded.summary.title} poster`}
            frameId={lastAdded.product.frameId}
            ratio={widthCm / heightCm}
            size="md"
            loading="eager"
          />
        </div>
        <div className="added-dialog__body">
          <p className="added-dialog__check">
            <LuCheck aria-hidden="true" /> Added to your cart
          </p>
          <h2 id="added-title" className="added-dialog__title">{lastAdded.summary.title}</h2>
          <p className="added-dialog__meta">{describeProduct(lastAdded.product)}</p>
          <p className="added-dialog__price">{formatMoney(unitPrice(lastAdded.product))}</p>
          <div className="added-dialog__actions">
            <button
              ref={primaryRef}
              type="button"
              className="store-btn store-btn--primary store-btn--block"
              onClick={() => {
                dismissLastAdded();
                navigate("/checkout");
              }}
            >
              Checkout · {formatMoney(totals.total)}
            </button>
            <button
              type="button"
              className="store-btn store-btn--outline store-btn--block"
              onClick={() => {
                dismissLastAdded();
                navigate("/cart");
              }}
            >
              View cart ({cartCount})
            </button>
            <button type="button" className="store-btn store-btn--ghost store-btn--block" onClick={dismissLastAdded}>
              Keep designing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
