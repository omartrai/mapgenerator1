import { LuBadgeCheck, LuStar } from "react-icons/lu";
import { useReviews } from "../application/useReviews";
import { useStoreText } from "./storeText";

/** Five stars, filled up to the rating. */
export function Stars({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  return (
    <span className={`stars stars--${size}`} aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <LuStar key={n} className={n <= Math.round(rating) ? "is-on" : ""} />
      ))}
    </span>
  );
}

/** Homepage reviews: approved, verified-purchase reviews only. */
export default function ReviewsSection() {
  const { t, language } = useStoreText();
  const { reviews, count, average, status } = useReviews();
  const locale = language === "ar" ? "ar-MA" : language === "fr" ? "fr-MA" : "en-GB";
  const averageText = average.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  return (
    <section className="home-block reviews" id="reviews" aria-labelledby="reviews-title">
      <div className="reviews__head">
        <div>
          <h2 id="reviews-title" className="home-heading">{t("reviews.title")}</h2>
          <span className="home-rule" aria-hidden="true" />
        </div>
        {count > 0 ? (
          <p className="reviews__score">
            <strong>{averageText}</strong>
            <span>
              <Stars rating={average} size="lg" />
              <span className="sr-only">{t("reviews.outOf", { rating: averageText })}</span>
              <small>{count === 1 ? t("reviews.countOne") : t("reviews.count", { count })}</small>
            </span>
          </p>
        ) : null}
      </div>

      {status === "loading" ? (
        <div className="reviews__grid" aria-busy="true">
          {[0, 1, 2].map((n) => <div key={n} className="review-card is-skeleton" />)}
        </div>
      ) : null}

      {status !== "loading" && count === 0 ? (
        <p className="reviews__empty">{t("reviews.empty")}</p>
      ) : null}

      {reviews.length > 0 ? (
        <ul className="reviews__grid">
          {reviews.map((review) => (
            <li key={review.id} className="review-card">
              <Stars rating={review.rating} size="sm" />
              <span className="sr-only">{t("reviews.outOf", { rating: review.rating })}</span>
              <blockquote className="review-card__text">{review.text}</blockquote>
              <footer className="review-card__by">
                <strong>{review.name}</strong>
                {review.city ? <span> · {review.city}</span> : null}
                <span className="review-card__meta">
                  <LuBadgeCheck aria-hidden="true" /> {t("reviews.verified")}
                  {" · "}
                  {new Date(review.createdAt).toLocaleDateString(locale, { month: "long", year: "numeric" })}
                </span>
              </footer>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
