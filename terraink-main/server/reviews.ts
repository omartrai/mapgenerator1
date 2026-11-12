import {
  REVIEW_NAME_MAX,
  REVIEW_TEXT_MAX,
  shortName,
  toPublicReview,
  validateReview,
  type Review,
  type ReviewInput,
  type ReviewStatus,
  type ReviewSummary,
} from "../src/features/store/domain/review.js";
import type { Order } from "../src/features/store/domain/order.js";
import { HttpError } from "./orders.js";
import type { IOrderStorage } from "./storage/ports.js";

const REVIEW_PREFIX = "reviews/";
const PUBLIC_LIMIT = 24;
const CACHE_MS = 2 * 60 * 1000;
const STATUSES: ReviewStatus[] = ["pending", "approved", "rejected"];

const reviewPath = (orderNumber: string) => `${REVIEW_PREFIX}${orderNumber}.json`;

export function createReviewService(storage: IOrderStorage) {
  let cache: { at: number; value: ReviewSummary } | null = null;

  async function listAll(): Promise<Review[]> {
    const entries = (await storage.list(REVIEW_PREFIX)).filter((entry) => entry.path.endsWith(".json"));
    const reviews = await Promise.all(entries.slice(0, 500).map((entry) => storage.getJson<Review>(entry.path)));
    return reviews
      .filter((review): review is Review => !!review)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  return {
    listAll,

    /** Approved reviews for the site, newest first. */
    async summary(): Promise<ReviewSummary> {
      if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;
      const approved = (await listAll()).filter((review) => review.status === "approved");
      const total = approved.reduce((sum, review) => sum + review.rating, 0);
      const value: ReviewSummary = {
        reviews: approved.slice(0, PUBLIC_LIMIT).map(toPublicReview),
        count: approved.length,
        average: approved.length ? Math.round((total / approved.length) * 10) / 10 : 0,
      };
      cache = { at: Date.now(), value };
      return value;
    },

    forOrder(orderNumber: string): Promise<Review | null> {
      return storage.getJson<Review>(reviewPath(orderNumber));
    },

    /** Saves (or replaces) the review of a delivered order; it waits for approval. */
    async submit(order: Order, input: ReviewInput): Promise<Review> {
      if (order.status !== "delivered") {
        throw new HttpError(409, "You can review your order once it has been delivered.");
      }
      const errors = validateReview(input);
      if (Object.keys(errors).length) throw new HttpError(422, "Please check your review.", { fields: errors });
      const existing = await storage.getJson<Review>(reviewPath(order.number));
      const now = new Date().toISOString();
      const name = String(input.name ?? "").trim().slice(0, REVIEW_NAME_MAX) || shortName(order.customer.fullName);
      const review: Review = {
        id: order.number,
        orderNumber: order.number,
        rating: Number(input.rating),
        text: String(input.text).trim().slice(0, REVIEW_TEXT_MAX),
        name,
        city: order.customer.city.trim().slice(0, 60),
        posters: order.items.map((item) => item.summary?.title ?? "").filter(Boolean).slice(0, 5),
        status: "pending",
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      await storage.putJson(reviewPath(order.number), review);
      cache = null;
      return review;
    },

    async setStatus(id: string, status: ReviewStatus): Promise<Review> {
      if (!STATUSES.includes(status)) throw new HttpError(400, "Unknown status.");
      const review = await storage.getJson<Review>(reviewPath(id));
      if (!review) throw new HttpError(404, "Review not found.");
      review.status = status;
      review.updatedAt = new Date().toISOString();
      await storage.putJson(reviewPath(id), review);
      cache = null;
      return review;
    },
  };
}

export type ReviewService = ReturnType<typeof createReviewService>;
