import { useEffect, useRef } from "react";
import { LuCheck, LuX } from "react-icons/lu";
import { useRouter } from "@/core/router/router";
import { itemDimensions, itemUnitPrice } from "../domain/cart";
import FramedPoster from "./FramedPoster";
import { useStore } from "./StoreContext";
import { useStoreText } from "./storeText";

export default function AddedToCartDialog({ keepLabel }: { keepLabel?: string } = {}) {
  const { lastAdded, dismissLastAdded, cartCount, totals } = useStore();
  const { navigate } = useRouter();
  const { t, money, describeItem } = useStoreText();
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
  const { widthCm, heightCm } = itemDimensions(lastAdded);

  return (
    <div className="store-dialog" role="dialog" aria-modal="true" aria-labelledby="added-title">
      <div className="store-dialog__backdrop" onClick={dismissLastAdded} aria-hidden="true" />
      <div className="store-dialog__panel added-dialog">
        <button type="button" className="store-dialog__close" onClick={dismissLastAdded} aria-label={t("common.close")}>
          <LuX />
        </button>
        <div className="added-dialog__visual">
          <FramedPoster
            src={lastAdded.previewDataUrl}
            alt={`${lastAdded.summary.title} poster`}
            frameId={lastAdded.product.frameId} mat={lastAdded.product.mat === true}
            ratio={widthCm / heightCm}
            size="md"
            loading="eager"
          />
        </div>
        <div className="added-dialog__body">
          <p className="added-dialog__check">
            <LuCheck aria-hidden="true" /> {t("added.title")}
          </p>
          <h2 id="added-title" className="added-dialog__title">{lastAdded.summary.title}</h2>
          <p className="added-dialog__meta">{describeItem(lastAdded)}</p>
          <p className="added-dialog__price">{money(itemUnitPrice(lastAdded))}</p>
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
              {t("added.checkout", { amount: money(totals.total) })}
            </button>
            <button
              type="button"
              className="store-btn store-btn--outline store-btn--block"
              onClick={() => {
                dismissLastAdded();
                navigate("/cart");
              }}
            >
              {t("added.view", { count: cartCount })}
            </button>
            <button type="button" className="store-btn store-btn--ghost store-btn--block" onClick={dismissLastAdded}>
              {keepLabel ?? t("added.keep")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
