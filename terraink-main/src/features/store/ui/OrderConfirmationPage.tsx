import { useEffect, useState } from "react";
import { LuArrowRight, LuCheck, LuLoader } from "react-icons/lu";
import { Link, useRouter } from "@/core/router/router";
import { ordersApi } from "@/core/services";
import type { PublicOrder } from "../domain/order";
import FramedPoster from "./FramedPoster";
import OrderTotalsList from "./OrderTotalsList";
import StoreFooter from "./StoreFooter";
import StoreHeader from "./StoreHeader";
import { useStore } from "./StoreContext";
import { useStoreText } from "./storeText";

export default function OrderConfirmationPage({ number }: { number: string }) {
  const { search } = useRouter();
  const { lastOrder } = useStore();
  const accessKey =
    search.get("key") ?? (lastOrder?.number === number ? lastOrder.accessKey : "");
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [error, setError] = useState("");
  const { t, money, language, describeItem } = useStoreText();

  useEffect(() => {
    if (!accessKey) {
      setError("incomplete");
      return;
    }
    let cancelled = false;
    ordersApi
      .getOrder(number, accessKey)
      .then(({ order: loaded }) => !cancelled && setOrder(loaded))
      .catch((err: Error) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [number, accessKey]);

  const placedAt = order
    ? new Date(order.createdAt).toLocaleString(language === "ar" ? "ar-MA" : language === "fr" ? "fr-MA" : "en-GB", { dateStyle: "long", timeStyle: "short" })
    : "";

  return (
    <div className="store-page store-page--confirmation">
      <StoreHeader variant="site" />
      <main className="store-container store-container--narrow">
        {!order && !error ? (
          <p className="loading-line">
            <LuLoader className="store-spin" aria-hidden="true" /> {t("confirm.loading")}
          </p>
        ) : null}
        {error ? (
          <div className="empty-state">
            <h1>{t("confirm.error")}</h1>
            <p>{error === "incomplete" ? t("confirm.incomplete") : error}</p>
            <Link to="/" className="store-btn store-btn--outline">{t("confirm.back")}</Link>
          </div>
        ) : null}

        {order ? (
          <>
            <section className="confirm-hero">
              <span className="confirm-hero__check" aria-hidden="true">
                <LuCheck />
              </span>
              <p className="store-eyebrow">{t("confirm.eyebrow")}</p>
              <h1 className="confirm-hero__title">
                {t("confirm.thanks", { name: order.customer.fullName.split(" ")[0] })}
              </h1>
              <p className="confirm-hero__lede">
                {t("confirm.lede", { number: order.number, phone: order.customer.phone })}
              </p>
              <p className="confirm-hero__meta">{t("confirm.placed", { date: placedAt })}</p>
            </section>

            <ol className="timeline" aria-label={t("confirm.next")}>
              <li className="is-done"><span>{t("confirm.step1")}</span></li>
              <li><span>{t("confirm.step2")}</span></li>
              <li><span>{t("confirm.step3")}</span></li>
              <li><span>{t("confirm.step4")}</span></li>
            </ol>

            <section className="confirm-grid">
              <div className="confirm-card">
                <h2>{t("confirm.posters")}</h2>
                <ul className="mini-lines">
                  {order.items.map((item) => (
                    <li key={item.id} className="mini-line">
                      <div className="mini-line__visual">
                        {item.preview || item.collection ? (
                          <FramedPoster
                            src={
                              item.preview
                                ? ordersApi.previewUrl(order.number, item.preview.name, accessKey)
                                : item.collection!.image
                            }
                            alt={`${item.summary.title} poster`}
                            frameId={item.product.frameId} mat={item.product.mat === true}
                            ratio={item.widthCm / item.heightCm}
                            size="sm"
                          />
                        ) : null}
                        {item.quantity > 1 ? <span className="mini-line__qty">{item.quantity}</span> : null}
                      </div>
                      <div className="mini-line__text">
                        <p className="mini-line__title">{item.summary.title}</p>
                        <p className="mini-line__meta">{describeItem(item)}</p>
                        {item.collection ? null : <p className="mini-line__meta">{item.summary.themeName}</p>}
                      </div>
                      <p className="mini-line__price">{money(item.lineTotal, order.totals.currency)}</p>
                    </li>
                  ))}
                </ul>
                <OrderTotalsList totals={order.totals} />
                <p className="summary-card__note">{t("confirm.payment")}</p>
              </div>
              <div className="confirm-card">
                <h2>{t("confirm.delivery")}</h2>
                <address className="address-block">
                  {order.customer.fullName}
                  <br />
                  {order.customer.address}
                  <br />
                  {[order.customer.postalCode, order.customer.city].filter(Boolean).join(" ")}
                  <br />
                  {order.customer.country}
                </address>
                {order.customer.notes ? (
                  <p className="confirm-card__notes">“{order.customer.notes}”</p>
                ) : null}
                <p className="summary-card__note">
                  {t("confirm.keep")}
                </p>
              </div>
            </section>

            <div className="confirm-actions">
              <Link to="/create" className="store-btn store-btn--primary store-btn--lg">
                {t("cart.another")} <LuArrowRight className="rtl-flip" aria-hidden="true" />
              </Link>
            </div>
          </>
        ) : null}
      </main>
      <StoreFooter />
    </div>
  );
}
