import { useEffect, type FormEvent } from "react";
import { LuArrowLeft, LuBanknote, LuLoader, LuLock } from "react-icons/lu";
import { Link, useRouter } from "@/core/router/router";
import { useCheckout } from "../application/useCheckout";
import { itemDimensions, itemUnitPrice } from "../domain/cart";
import type { CustomerInfo } from "../domain/order";
import FramedPoster from "./FramedPoster";
import OrderTotalsList from "./OrderTotalsList";
import StoreHeader from "./StoreHeader";
import { useStore } from "./StoreContext";
import { useStoreText, type StoreTextKey } from "./storeText";

interface FieldConfig {
  name: keyof CustomerInfo;
  label: StoreTextKey;
  type?: string;
  autoComplete: string;
  placeholder?: StoreTextKey;
  list?: string;
  wide?: boolean;
  optional?: boolean;
  inputMode?: "text" | "email" | "tel" | "numeric";
}

const CONTACT_FIELDS: FieldConfig[] = [
  { name: "fullName", label: "checkout.fullName", autoComplete: "name", wide: true },
  { name: "phone", label: "checkout.phone", type: "tel", autoComplete: "tel", inputMode: "tel", placeholder: "checkout.phoneHint" },
  { name: "email", label: "checkout.email", type: "email", autoComplete: "email", inputMode: "email" },
];

const ADDRESS_FIELDS: FieldConfig[] = [
  { name: "address", label: "checkout.street", autoComplete: "street-address", placeholder: "checkout.streetHint", wide: true },
  { name: "city", label: "checkout.city", autoComplete: "address-level2", list: "checkout-cities" },
  { name: "postalCode", label: "checkout.postalCode", autoComplete: "postal-code", optional: true, inputMode: "numeric" },
  { name: "country", label: "checkout.country", autoComplete: "country-name", wide: true },
];

const MOROCCAN_CITIES = [
  "Casablanca", "Rabat", "Marrakech", "Fès", "Tanger", "Agadir", "Meknès", "Oujda",
  "Kénitra", "Tétouan", "Salé", "Témara", "Mohammedia", "El Jadida", "Safi", "Nador",
  "Béni Mellal", "Khouribga", "Settat", "Larache", "Ksar El Kébir", "Essaouira",
  "Chefchaouen", "Ouarzazate", "Errachidia", "Taza", "Guelmim", "Laâyoune", "Dakhla",
  "Al Hoceïma", "Ifrane", "Berrechid", "Khémisset", "Taroudant", "Tiznit",
];

export default function CheckoutPage() {
  const { cart, totals } = useStore();
  const { navigate } = useRouter();
  const { t, money, describeItem, language } = useStoreText();
  const checkout = useCheckout(language);

  useEffect(() => {
    if (!checkout.customer.country) checkout.setField("country", t("checkout.defaultCountry"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <label htmlFor={id}>
          {t(field.label)}
          {field.optional ? <span className="field__optional"> {t("checkout.optional")}</span> : null}
        </label>
        <input
          id={id}
          name={field.name}
          type={field.type ?? "text"}
          inputMode={field.inputMode}
          autoComplete={field.autoComplete}
          placeholder={field.placeholder ? t(field.placeholder) : undefined}
          list={field.list}
          dir={field.name === "phone" || field.name === "email" ? "ltr" : undefined}
          value={checkout.customer[field.name]}
          onChange={(event) => checkout.setField(field.name, event.target.value)}
          onBlur={() => checkout.customer[field.name] && checkout.validateField(field.name)}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          required={!field.optional}
        />
        {error ? (
          <p id={`${id}-error`} className="field__error">
            {t(`error.${field.name}` as StoreTextKey)}
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
          <LuArrowLeft className="rtl-flip" aria-hidden="true" /> {t("checkout.back")}
        </Link>
        <h1 className="page-title">{t("checkout.title")}</h1>

        <form className="checkout-layout" onSubmit={onSubmit} noValidate>
          <div className="checkout-form">
            <fieldset className="checkout-block">
              <legend>
                <span className="checkout-block__num">1</span> {t("checkout.contact")}
              </legend>
              <div className="field-grid">{CONTACT_FIELDS.map(renderField)}</div>
            </fieldset>

            <fieldset className="checkout-block">
              <legend>
                <span className="checkout-block__num">2</span> {t("checkout.address")}
              </legend>
              <div className="field-grid">{ADDRESS_FIELDS.map(renderField)}</div>
              <datalist id="checkout-cities">
                {MOROCCAN_CITIES.map((city) => (
                  <option key={city} value={city} />
                ))}
              </datalist>
              <div className="field field--wide">
                <label htmlFor="checkout-notes">
                  {t("checkout.notes")} <span className="field__optional">{t("checkout.optional")}</span>
                </label>
                <textarea
                  id="checkout-notes"
                  name="notes"
                  rows={3}
                  placeholder={t("checkout.notesHint")}
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
                <span className="checkout-block__num">3</span> {t("checkout.payment")}
              </legend>
              <label className="pay-option is-selected">
                <input type="radio" name="payment" value="cash_on_delivery" checked readOnly />
                <LuBanknote aria-hidden="true" />
                <span>
                  <strong>{t("checkout.cod")}</strong>
                  <span>{t("checkout.codText")}</span>
                </span>
              </label>
            </fieldset>
          </div>

          <aside className="summary-card summary-card--sticky">
            <h2 className="summary-card__title">{t("checkout.yourOrder")}</h2>
            <ul className="mini-lines">
              {cart.map((item) => {
                const { widthCm, heightCm } = itemDimensions(item);
                return (
                  <li key={item.id} className="mini-line">
                    <div className="mini-line__visual">
                      <FramedPoster
                        src={item.previewDataUrl}
                        alt=""
                        frameId={item.product.frameId} mat={item.product.mat === true}
                        ratio={widthCm / heightCm}
                        size="sm"
                      />
                      {item.quantity > 1 ? <span className="mini-line__qty">{item.quantity}</span> : null}
                    </div>
                    <div className="mini-line__text">
                      <p className="mini-line__title">{item.summary.title}</p>
                      <p className="mini-line__meta">{describeItem(item)}</p>
                    </div>
                    <p className="mini-line__price">{money(itemUnitPrice(item) * item.quantity)}</p>
                  </li>
                );
              })}
            </ul>
            <OrderTotalsList totals={totals} />
            {checkout.submitError ? (
              <p className="store-error" role="alert">
                {language === "en" ? checkout.submitError : t("checkout.failed")}
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
                  <LuLoader className="store-spin" aria-hidden="true" /> {t("checkout.placing")}
                </>
              ) : (
                <>
                  <LuLock aria-hidden="true" /> {t("checkout.place", { amount: money(totals.total) })}
                </>
              )}
            </button>
            <p className="summary-card__note">
              {t("checkout.agree", { amount: money(totals.total) })}
            </p>
            <p className="summary-card__note summary-card__legal">
              {t("checkout.legal", { terms: "\u0001", privacy: "\u0002" })
                .split(/(\u0001|\u0002)/)
                .map((part, index) =>
                  part === "\u0001" ? (
                    <Link key={index} to="/legal/cgv">{t("legal.cgv")}</Link>
                  ) : part === "\u0002" ? (
                    <Link key={index} to="/legal/confidentialite">{t("legal.confidentialite")}</Link>
                  ) : (
                    part
                  ),
                )}
            </p>
          </aside>
        </form>
      </main>
    </div>
  );
}
