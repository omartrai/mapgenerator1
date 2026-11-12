import { useMemo, useState } from "react";
import { LuCheck, LuRefreshCw, LuX } from "react-icons/lu";
import { Link } from "@/core/router/router";
import { useAdminReviews } from "../application/useReviews";
import type { ReviewStatus } from "../domain/review";
import AdminLayout from "./AdminLayout";
import { Stars } from "./ReviewsSection";

const FILTERS: { id: ReviewStatus | "all"; label: string }[] = [
  { id: "pending", label: "To review" },
  { id: "approved", label: "Published" },
  { id: "rejected", label: "Hidden" },
  { id: "all", label: "All" },
];

export default function AdminReviewsPage() {
  return <AdminLayout>{() => <ReviewsList />}</AdminLayout>;
}

function ReviewsList() {
  const { reviews, error, busyId, refresh, setStatus } = useAdminReviews();
  const [filter, setFilter] = useState<ReviewStatus | "all">("pending");
  const shown = useMemo(
    () => (reviews ?? []).filter((review) => filter === "all" || review.status === filter),
    [reviews, filter],
  );

  return (
    <div className="admin-orders">
      <div className="admin-title-row">
        <div>
          <h1 className="page-title">Reviews</h1>
          <p className="admin-subtle">Customers can review an order once it is marked Delivered. Only published reviews appear on the site.</p>
        </div>
        <button type="button" className="store-btn store-btn--outline store-btn--sm" onClick={() => void refresh()}>
          <LuRefreshCw aria-hidden="true" /> Refresh
        </button>
      </div>

      <div className="admin-filters" role="tablist" aria-label="Filter reviews">
        {FILTERS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={filter === entry.id}
            className={`admin-filter${filter === entry.id ? " is-active" : ""}`}
            onClick={() => setFilter(entry.id)}
          >
            {entry.label} ({(reviews ?? []).filter((r) => entry.id === "all" || r.status === entry.id).length})
          </button>
        ))}
      </div>

      {error ? <p className="store-error" role="alert">{error}</p> : null}
      {reviews && shown.length === 0 ? <p className="admin-subtle">No reviews here.</p> : null}

      <ul className="admin-reviews">
        {shown.map((review) => (
          <li key={review.id} className="admin-card admin-review">
            <div className="admin-review__head">
              <Stars rating={review.rating} size="sm" />
              <strong>{review.name}</strong>
              <span className="admin-subtle">{review.city}</span>
              <Link to={`/admin/orders/${review.orderNumber}`} className="store-link">{review.orderNumber}</Link>
              <span className={`admin-review__status is-${review.status}`}>{review.status}</span>
            </div>
            <p className="admin-review__text">{review.text}</p>
            <div className="admin-review__actions">
              {review.status !== "approved" ? (
                <button type="button" className="store-btn store-btn--dark store-btn--sm" disabled={busyId === review.id} onClick={() => void setStatus(review.id, "approved")}>
                  <LuCheck aria-hidden="true" /> Publish
                </button>
              ) : null}
              {review.status !== "rejected" ? (
                <button type="button" className="store-btn store-btn--ghost store-btn--sm" disabled={busyId === review.id} onClick={() => void setStatus(review.id, "rejected")}>
                  <LuX aria-hidden="true" /> Hide
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
