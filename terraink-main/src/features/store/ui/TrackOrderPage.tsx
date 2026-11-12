import { useEffect, useState, type FormEvent } from "react";
import { LuCheck, LuExternalLink, LuLoader, LuPackageSearch, LuX } from "react-icons/lu";
import { Link, useRouter } from "@/core/router/router";
import { trackingApi } from "@/core/services";
import type { OrderStatus, OrderTracking } from "../domain/order";
import StoreFooter from "./StoreFooter";
import StoreHeader from "./StoreHeader";
import { useStoreText, type StoreTextKey } from "./storeText";

/**
 * /suivi — "Suivre ma commande": the customer enters their order number and
 * phone (or arrives with the private link) and sees where their poster is.
 */
export default function TrackOrderPage() {
  const { search } = useRouter();
  const { t, money, language, describeItem } = useStoreText();
  const [number, setNumber] = useState(search.get("n") ?? "");
  const [phone, setPhone] = useState("");
  const [tracking, setTracking] = useState<OrderTracking | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const lookup = async (proof: { phone?: string; key?: string }, orderNumber = number) => {
    setLoading(true);
    setError("");
    try {
      const result = await trackingApi.track(orderNumber.trim().toUpperCase(), proof);
      setTracking(result.tracking);
    } catch (err) {
      setTracking(null);
      setError(err instanceof Error && /many attempts/i.test(err.message) ? t("track.tooMany") : t("track.notFound"));
    } finally {
      setLoading(false);
    }
  };

  // Private link from the confirmation page: /suivi?n=…&key=…
  useEffect(() => {
    const key = search.get("key");
    const n = search.get("n");
    if (key && n) void lookup({ key }, n);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (number.trim() && phone.trim()) void lookup({ phone });
  };

  const locale = language === "ar" ? "ar-MA" : language === "fr" ? "fr-MA" : "en-GB";
  const date = (iso: string) => new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "long" });
  const current = tracking?.steps.filter((step) => step.done).at(-1)?.status ?? "new";

  return (
    <div className="store-page track-page">
      <StoreHeader variant="site" />
      <main className="store-container store-container--narrow track-page__main">
        <header className="track-head">
          <span className="track-head__icon" aria-hidden="true"><LuPackageSearch /></span>
          <h1>{t("track.title")}</h1>
          <p>{t("track.lede")}</p>
        </header>

        {!tracking ? (
          <form className="track-form" onSubmit={submit}>
            <label>
              <span>{t("track.number")}</span>
              <input
                value={number}
                onChange={(event) => setNumber(event.target.value)}
                placeholder="ML-261112-ABCDE"
                autoCapitalize="characters"
                required
              />
            </label>
            <label>
              <span>{t("track.phone")}</span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="06 12 34 56 78"
                inputMode="tel"
                autoComplete="tel"
                required
              />
            </label>
            <button type="submit" className="store-btn store-btn--primary store-btn--block" disabled={loading}>
              {loading ? <LuLoader className="store-spin" aria-hidden="true" /> : null} {t("track.submit")}
            </button>
            {error ? <p className="store-error" role="alert">{error}</p> : null}
            <p className="track-form__hint">{t("track.hint")}</p>
          </form>
        ) : (
          <section className="track-result" aria-live="polite">
            <div className="track-result__head">
              <div>
                <p className="track-result__number">{tracking.number}</p>
                <p className="track-result__meta">
                  {t("track.placed", { date: date(tracking.createdAt) })} · {money(tracking.total)} · {tracking.city}
                </p>
              </div>
              <span className={`track-badge track-badge--${tracking.status}`}>
                {t(`track.status.${tracking.status}` as StoreTextKey)}
              </span>
            </div>

            {tracking.status === "cancelled" ? (
              <p className="track-cancelled"><LuX aria-hidden="true" /> {t("track.cancelledText")}</p>
            ) : (
              <ol className="track-steps">
                {tracking.steps.map((step) => (
                  <li
                    key={step.status}
                    className={`track-step${step.done ? " is-done" : ""}${step.status === current ? " is-current" : ""}`}
                  >
                    <span className="track-step__dot" aria-hidden="true">{step.done ? <LuCheck /> : null}</span>
                    <span className="track-step__text">
                      <strong>{t(`track.step.${step.status}` as StoreTextKey)}</strong>
                      <small>
                        {step.done && step.at
                          ? date(step.at)
                          : step.status === current
                            ? ""
                            : t(`track.next.${step.status as OrderStatus}` as StoreTextKey)}
                      </small>
                    </span>
                  </li>
                ))}
              </ol>
            )}

            {tracking.trackingUrl ? (
              <a className="store-btn store-btn--outline store-btn--block" href={tracking.trackingUrl} target="_blank" rel="noreferrer">
                <LuExternalLink aria-hidden="true" /> {t("track.carrier")}
              </a>
            ) : null}

            <ul className="track-items">
              {tracking.items.map((item, index) => (
                <li key={index}>
                  <strong>{item.quantity > 1 ? `${item.quantity} × ` : ""}{item.title}</strong>
                  <span>{item.product ? describeItem(item) : item.detail}</span>
                </li>
              ))}
            </ul>

            <div className="track-actions">
              <button type="button" className="store-btn store-btn--ghost" onClick={() => setTracking(null)}>
                {t("track.another")}
              </button>
              <Link to="/create" className="store-btn store-btn--outline">{t("cart.another")}</Link>
            </div>
          </section>
        )}
      </main>
      <StoreFooter />
    </div>
  );
}
