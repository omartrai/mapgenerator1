import { useCallback, useEffect, useState } from "react";
import { adminApi, reviewsApi } from "@/core/services";
import type { Review, ReviewInput, ReviewStatus, ReviewSummary } from "../domain/review";

const EMPTY: ReviewSummary = { reviews: [], count: 0, average: 0 };

/** Approved reviews for the site. */
export function useReviews() {
  const [summary, setSummary] = useState<ReviewSummary>(EMPTY);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    reviewsApi
      .list()
      .then((result) => {
        if (cancelled) return;
        setSummary(result);
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, []);

  return { ...summary, status };
}

type OwnReview = Omit<Review, "orderNumber">;

/** The customer's own review of one order: load it and send it. */
export function useOrderReview(number: string, accessKey: string, enabled: boolean) {
  const [review, setReview] = useState<OwnReview | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled || !accessKey) return;
    let cancelled = false;
    reviewsApi
      .forOrder(number, accessKey)
      .then((result) => !cancelled && setReview(result.review))
      .catch(() => undefined)
      .finally(() => !cancelled && setIsLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [number, accessKey, enabled]);

  const submit = useCallback(
    async (input: ReviewInput) => {
      setIsSending(true);
      setError("");
      try {
        const result = await reviewsApi.submit(number, accessKey, input);
        setReview(result.review);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "error");
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [number, accessKey],
  );

  return { review, isLoaded, isSending, error, submit };
}

/** All reviews for moderation. */
export function useAdminReviews() {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    try {
      setReviews((await adminApi.listReviews()).reviews);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load reviews.");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setStatus = useCallback(async (id: string, status: ReviewStatus) => {
    setBusyId(id);
    try {
      const { review } = await adminApi.setReviewStatus(id, status);
      setReviews((current) => (current ?? []).map((entry) => (entry.id === id ? review : entry)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the review.");
    } finally {
      setBusyId("");
    }
  }, []);

  return { reviews, error, busyId, refresh, setStatus };
}
