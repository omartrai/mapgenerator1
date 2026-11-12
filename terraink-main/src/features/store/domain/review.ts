/**
 * Customer reviews. A review can only be left from a delivered order (so
 * every review is a verified purchase), one per order, and appears on the
 * site once the shop owner approves it.
 */

export type ReviewStatus = "pending" | "approved" | "rejected";

export const REVIEW_TEXT_MIN = 10;
export const REVIEW_TEXT_MAX = 600;
export const REVIEW_NAME_MAX = 40;

export interface Review {
  /** Same as the order number: one review per order. */
  id: string;
  orderNumber: string;
  rating: number;
  text: string;
  /** Name shown with the review, e.g. "Salma B." */
  name: string;
  city: string;
  /** Poster titles from the order. */
  posters: string[];
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}

/** What visitors see: no order number. */
export interface PublicReview {
  id: string;
  rating: number;
  text: string;
  name: string;
  city: string;
  posters: string[];
  createdAt: string;
}

export interface ReviewSummary {
  reviews: PublicReview[];
  count: number;
  /** Mean rating, one decimal; 0 when there are none. */
  average: number;
}

export interface ReviewInput {
  rating: number;
  text: string;
  name?: string;
}

/** "Salma Bennani" → "Salma B." */
export function shortName(fullName: string): string {
  const parts = String(fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const first = parts[0];
  const last = parts.length > 1 ? ` ${parts[parts.length - 1][0].toUpperCase()}.` : "";
  return `${first}${last}`.slice(0, REVIEW_NAME_MAX);
}

/** Field errors keyed by field name; empty when the input is fine. */
export function validateReview(input: ReviewInput): Record<string, string> {
  const errors: Record<string, string> = {};
  const rating = Number(input?.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) errors.rating = "rating";
  const text = String(input?.text ?? "").trim();
  if (text.length < REVIEW_TEXT_MIN || text.length > REVIEW_TEXT_MAX) errors.text = "text";
  return errors;
}

export function toPublicReview(review: Review): PublicReview {
  return {
    id: review.id,
    rating: review.rating,
    text: review.text,
    name: review.name,
    city: review.city,
    posters: review.posters,
    createdAt: review.createdAt,
  };
}
