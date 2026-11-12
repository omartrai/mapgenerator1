import { useEffect, useState, type FormEvent } from "react";
import { LuLoader, LuStar } from "react-icons/lu";
import { useOrderReview } from "../application/useReviews";
import { REVIEW_TEXT_MAX, REVIEW_TEXT_MIN, shortName } from "../domain/review";
import type { PublicOrder } from "../domain/order";
import { useStoreText } from "./storeText";

/** On a delivered order: the customer rates it (one review per order). */
export default function OrderReviewCard({ order, accessKey }: { order: PublicOrder; accessKey: string }) {
  const { t } = useStoreText();
  const delivered = order.status === "delivered";
  const { review, isLoaded, isSending, error, submit } = useOrderReview(order.number, accessKey, delivered);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [name, setName] = useState(shortName(order.customer.fullName));
  const [editing, setEditing] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!review) return;
    setRating(review.rating);
    setText(review.text);
    setName(review.name);
  }, [review]);

  if (!delivered || !isLoaded) return null;

  const textOk = text.trim().length >= REVIEW_TEXT_MIN;
  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!rating || !textOk) return;
    if (await submit({ rating, text, name })) setEditing(false);
  };

  if (review && !editing) {
    return (
      <section className="confirm-card review-form">
        <h2>{t("reviewForm.thanksTitle")}</h2>
        <p className="review-form__status">
          {t(review.status === "approved" ? "reviewForm.published" : "reviewForm.pending")}
        </p>
        <button type="button" className="store-btn store-btn--ghost store-btn--sm" onClick={() => setEditing(true)}>
          {t("reviewForm.edit")}
        </button>
      </section>
    );
  }

  return (
    <form className="confirm-card review-form" onSubmit={onSubmit} noValidate>
      <h2>{t("reviewForm.title")}</h2>
      <p className="review-form__lede">{t("reviewForm.lede")}</p>

      <fieldset className="review-form__stars" onMouseLeave={() => setHover(0)}>
        <legend>{t("reviewForm.rating")}</legend>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={(hover || rating) >= n ? "is-on" : ""} onMouseEnter={() => setHover(n)}>
            <input
              type="radio"
              name="rating"
              value={n}
              checked={rating === n}
              onChange={() => setRating(n)}
            />
            <LuStar aria-hidden="true" />
            <span className="sr-only">{t("reviews.outOf", { rating: n })}</span>
          </label>
        ))}
      </fieldset>
      {touched && !rating ? <p className="field__error">{t("reviewForm.needRating")}</p> : null}

      <div className="field">
        <label htmlFor="review-text">{t("reviewForm.text")}</label>
        <textarea
          id="review-text"
          rows={4}
          maxLength={REVIEW_TEXT_MAX}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={t("reviewForm.placeholder")}
        />
        {touched && !textOk ? <p className="field__error">{t("reviewForm.needText", { min: REVIEW_TEXT_MIN })}</p> : null}
      </div>

      <div className="field">
        <label htmlFor="review-name">{t("reviewForm.name")}</label>
        <input id="review-name" value={name} maxLength={40} onChange={(event) => setName(event.target.value)} />
      </div>

      {error ? <p className="store-error" role="alert">{t("reviewForm.error")}</p> : null}
      <button type="submit" className="store-btn store-btn--primary" disabled={isSending}>
        {isSending ? <LuLoader className="store-spin" aria-hidden="true" /> : null} {t("reviewForm.send")}
      </button>
      <p className="summary-card__note">{t("reviewForm.note")}</p>
    </form>
  );
}
