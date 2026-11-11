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
import { formatMoney } from "../domain/catalog";

export default function OrderConfirmationPage({ number }: { number: string }) {
  const { search } = useRouter();
  const { lastOrder } = useStore();
  const accessKey =
    search.get("key") ?? (lastOrder?.number === number ? lastOrder.accessKey : "");
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!accessKey) {
      setError("This order link is incomplete. Use the link from your confirmation.");
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
    ? new Date(order.createdAt).toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" })
    : "";

  return (
    <div className="store-page store-page--confirmation">
      <StoreHeader variant="site" />
      <main className="store-container store-container--narrow">
        {!order && !error ? (
          <p className="loading-line">
            <LuLoader className="store-spin" aria-hidden="true" /> Loading your order…
          </p>
        ) : null}
        {error ? (
          <div className="empty-state">
            <h1>We couldn't show this order</h1>
            <p>{error}</p>
            <Link to="/" className="store-btn store-btn--outline">Back to the shop</Link>
          </div>
        ) : null}

        {order ? (
          <>
            <section className="confirm-hero">
              <span className="confirm-hero__check" aria-hidden="true">
                <LuCheck />
              </span>
              <p className="store-eyebrow">Order confirmed</p>
              <h1 className="confirm-hero__title">
                Thank you, {order.customer.fullName.split(" ")[0]}!
              </h1>
              <p className="confirm-hero__lede">
                Your order <strong>{order.number}</strong> is in. We'll contact you on{" "}
                {order.customer.phone} or at {order.customer.email} to confirm it before it goes to print.
              </p>
              <p className="confirm-hero__meta">Placed {placedAt}</p>
            </section>

            <ol className="timeline" aria-label="What happens next">
              <li className="is-done"><span>Order received</span></li>
              <li><span>We confirm with you</span></li>
              <li><span>Printed to order</span></li>
              <li><span>Delivered, pay on arrival</span></li>
            </ol>

            <section className="confirm-grid">
              <div className="confirm-card">
                <h2>Your posters</h2>
                <ul className="mini-lines">
                  {order.items.map((item) => (
                    <li key={item.id} className="mini-line">
                      <div className="mini-line__visual">
                        {item.preview ? (
                          <FramedPoster
                            src={ordersApi.previewUrl(order.number, item.preview.name, accessKey)}
                            alt={`${item.summary.title} poster`}
                            frameId={item.product.frameId}
                            ratio={item.widthCm / item.heightCm}
                            size="sm"
                          />
                        ) : null}
                        {item.quantity > 1 ? <span className="mini-line__qty">{item.quantity}</span> : null}
                      </div>
                      <div className="mini-line__text">
                        <p className="mini-line__title">{item.summary.title}</p>
                        <p className="mini-line__meta">{item.productLabel}</p>
                        <p className="mini-line__meta">{item.summary.themeName}</p>
                      </div>
                      <p className="mini-line__price">{formatMoney(item.lineTotal, order.totals.currency)}</p>
                    </li>
                  ))}
                </ul>
                <OrderTotalsList totals={order.totals} />
                <p className="summary-card__note">Payment: on delivery</p>
              </div>
              <div className="confirm-card">
                <h2>Delivery</h2>
                <address className="address-block">
                  {order.customer.fullName}
                  <br />
                  {order.customer.address}
                  <br />
                  {order.customer.postalCode} {order.customer.city}
                  <br />
                  {order.customer.country}
                </address>
                {order.customer.notes ? (
                  <p className="confirm-card__notes">“{order.customer.notes}”</p>
                ) : null}
                <p className="summary-card__note">
                  Keep this page's link to check your order later.
                </p>
              </div>
            </section>

            <div className="confirm-actions">
              <Link to="/create" className="store-btn store-btn--primary store-btn--lg">
                Design another poster <LuArrowRight aria-hidden="true" />
              </Link>
            </div>
          </>
        ) : null}
      </main>
      <StoreFooter />
    </div>
  );
}
