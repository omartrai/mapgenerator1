import { useEffect, type FormEvent } from "react";
import { LuArrowLeft, LuBanknote, LuLoader, LuLock } from "react-icons/lu";
import { Link, useRouter } from "@/core/router/router";
import { useCheckout } from "../application/useCheckout";
import { describeProduct, formatMoney, resolveDimensions, unitPrice } from "../domain/catalog";
import type { CustomerInfo } from "../domain/order";
import FramedPoster from "./FramedPoster";
import OrderTotalsList from "./OrderTotalsList";
import StoreHeader from "./StoreHeader";
import { useStore } from "./StoreContext";

interface FieldConfig {
  name: keyof CustomerInfo;
  label: string;
  type?: string;
  autoComplete: string;
  placeholder?: string;
  wide?: boolean;
  optional?: boolean;
  inputMode?: "text" | "email" | "tel" | "numeric";
}

const CONTACT_FIELDS: FieldConfig[] = [
  { name: "fullName", label: "Full name", autoComplete: "name", wide: true },
  { name: "email", label: "Email address", type: "email", autoComplete: "email", inputMode: "email" },
  { name: "phone", label: "Phone number", type: "tel", autoComplete: "tel", inputMode: "tel" },
];

const ADDRESS_FIELDS: FieldConfig[] = [
  { name: "address", label: "Street address", autoComplete: "street-address", placeholder: "Street, number, apartment", wide: true },
  { name: "city", label: "City", autoComplete: "address-level2" },
  { name: "postalCode", label: "Postal code", autoComplete: "postal-code" },
  { name: "country", label: "Country", autoComplete: "country-name", wide: true },
];

export default function CheckoutPage() {
  const { cart, totals } = useStore();
  const { navigate } = useRouter();
  const checkout = useCheckout();

  useEffect(() => {
    if (cart.length === 0 && !checkout.isSubmitting) navigate("/cart", { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const result = await checkout.placeOrder();
    if (result) {
      navigate(`/order/${result.number}?key=${encodeURIComponent(result.accessKey)}`);
      return;
    }
    requestAnimationFrame(() => {
      const firstInvalid = document.querySelector<HTMLElement>("[aria-invalid='true']");
      firstInvalid?.focus();
    });
  };

  const renderField = (field: FieldConfig) => {
    const error = checkout.errors[field.name];
    const id = `checkout-${field.name}`;
    return (
      <div key={field.name} className={`field${field.wide ? " field--wide" : ""}${error ? " has-error" : ""}`}>
        <label htmlFor={id}>{field.label}</label>
        <input
          id={id}
          name={field.name}
          type={field.type ?? "text"}
          inputMode={field.inputMode}
          autoComplete={field.autoComplete}
          placeholder={field.placeholder}
          value={checkout.customer[field.name]}
          onChange={(event) => checkout.setField(field.name, event.target.value)}
          onBlur={() => checkout.customer[field.name] && checkout.validateField(field.name)}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          required={!field.optional}
        />
        {error ? (
          <p id={`${id}-error`} className="field__error">
            {error}
          </p>
        ) : null}
      </div>
    );
  };

  return (
    <div className="store-page store-page--checkout">
      <StoreHeader variant="checkout" />
      <main className="store-container">
        <Link to="/cart" className="store-link store-link--back">
          <LuArrowLeft aria-hidden="true" /> Back to cart
        </Link>
        <h1 className="page-title">Checkout</h1>

        <form className="checkout-layout" onSubmit={onSubmit} noValidate>
          <div className="checkout-form">
            <fieldset className="checkout-block">
              <legend>
                <span className="checkout-block__num">1</span> Contact
              </legend>
              <div className="field-grid">{CONTACT_FIELDS.map(renderField)}</div>
            </fieldset>

            <fieldset className="checkout-block">
              <legend>
                <span className="checkout-block__num">2</span> Delivery address
              </legend>
              <div className="field-grid">{ADDRESS_FIELDS.map(renderField)}</div>
              <div className="field field--wide">
                <label htmlFor="checkout-notes">
                  Delivery instructions <span className="field__optional">(optional)</span>
                </label>
                <textarea
                  id="checkout-notes"
                  name="notes"
                  rows={3}
                  placeholder="Door code, best time to deliver, a gift message…"
                  value={checkout.customer.notes}
                  onChange={(event) => checkout.setField("notes", event.target.value)}
                />
              </div>
              <div className="hp-field" aria-hidden="true">
                <label htmlFor="checkout-website">Website</label>
                <input
                  id="checkout-website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={checkout.honeypot}
                  onChange={(event) => checkout.setHoneypot(event.target.value)}
                />
              </div>
            </fieldset>

            <fieldset className="checkout-block">
              <legend>
                <span className="checkout-block__num">3</span> Payment
              </legend>
              <label className="pay-option is-selected">
                <input type="radio" name="payment" value="cash_on_delivery" checked readOnly />
                <LuBanknote aria-hidden="true" />
                <span>
                  <strong>Pay on delivery</strong>
                  <span>Pay in cash or by card when your poster arrives. We'll contact you to confirm the order first.</span>
                </span>
              </label>
            </fieldset>
          </div>

          <aside className="summary-card summary-card--sticky">
            <h2 className="summary-card__title">Your order</h2>
            <ul className="mini-lines">
              {cart.map((item) => {
                const { widthCm, heightCm } = resolveDimensions(item.product);
                return (
                  <li key={item.id} className="mini-line">
                    <div className="mini-line__visual">
                      <FramedPoster
                        src={item.previewDataUrl}
                        alt=""
                        frameId={item.product.frameId}
                        ratio={widthCm / heightCm}
                        size="sm"
                      />
                      {item.quantity > 1 ? <span className="mini-line__qty">{item.quantity}</span> : null}
                    </div>
                    <div className="mini-line__text">
                      <p className="mini-line__title">{item.summary.title}</p>
                      <p className="mini-line__meta">{describeProduct(item.product)}</p>
                    </div>
                    <p className="mini-line__price">{formatMoney(unitPrice(item.product) * item.quantity)}</p>
                  </li>
                );
              })}
            </ul>
            <OrderTotalsList totals={totals} />
            {checkout.submitError ? (
              <p className="store-error" role="alert">
                {checkout.submitError}
              </p>
            ) : null}
            <button
              type="submit"
              className="store-btn store-btn--primary store-btn--block store-btn--lg"
              disabled={checkout.isSubmitting || cart.length === 0}
              aria-busy={checkout.isSubmitting}
            >
              {checkout.isSubmitting ? (
                <>
                  <LuLoader className="store-spin" aria-hidden="true" /> Placing your order…
                </>
              ) : (
                <>
                  <LuLock aria-hidden="true" /> Place order · {formatMoney(totals.total)}
                </>
              )}
            </button>
            <p className="summary-card__note">
              By placing your order you agree to pay {formatMoney(totals.total)} on delivery.
            </p>
          </aside>
        </form>
      </main>
    </div>
  );
}
