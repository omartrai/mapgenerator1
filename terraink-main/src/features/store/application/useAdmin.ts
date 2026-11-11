import { useCallback, useEffect, useState } from "react";
import { ApiError, adminApi, triggerDownloadBlob } from "@/core/services";
import type { Order, OrderSummaryRow } from "../domain/order";

/** Password session for the admin area (kept in sessionStorage only). */
export function useAdminSession() {
  const [status, setStatus] = useState<"checking" | "signed-out" | "signed-in">(
    adminApi.hasSession() ? "checking" : "signed-out",
  );
  const [info, setInfo] = useState<{ storage: string; fulfillment: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status !== "checking") return;
    adminApi
      .session()
      .then((result) => {
        setInfo(result);
        setStatus("signed-in");
      })
      .catch(() => {
        adminApi.signOut();
        setStatus("signed-out");
      });
  }, [status]);

  const signIn = useCallback(async (password: string) => {
    setError("");
    try {
      const result = await adminApi.signIn(password);
      setInfo(result);
      setStatus("signed-in");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    }
  }, []);

  const signOut = useCallback(() => {
    adminApi.signOut();
    setStatus("signed-out");
  }, []);

  return { status, info, error, signIn, signOut };
}

export function useAdminOrders(enabled: boolean) {
  const [orders, setOrders] = useState<OrderSummaryRow[] | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await adminApi.listOrders();
      setOrders(result.orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load orders.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) void refresh();
  }, [enabled, refresh]);

  return { orders, error, isLoading, refresh };
}

export function useAdminOrder(number: string, enabled: boolean) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    adminApi
      .getOrder(number)
      .then(({ order: loaded }) => !cancelled && setOrder(loaded))
      .catch((err: Error) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [number, enabled]);

  // Preview images are private; fetch them with auth and show object URLs.
  useEffect(() => {
    if (!order) return;
    let cancelled = false;
    const urls: string[] = [];
    void Promise.all(
      order.items
        .filter((item) => item.preview)
        .map(async (item) => {
          try {
            const blob = await adminApi.fetchFile(order.number, item.preview!.name);
            const url = URL.createObjectURL(blob);
            urls.push(url);
            return [item.id, url] as const;
          } catch {
            return [item.id, ""] as const;
          }
        }),
    ).then((entries) => {
      if (!cancelled) setPreviews(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [order?.number, order?.items.length]);

  const update = useCallback(
    async (patch: Record<string, unknown>) => {
      setIsSaving(true);
      setError("");
      try {
        const result = await adminApi.updateOrder(number, patch);
        setOrder(result.order);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save changes.");
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [number],
  );

  const downloadFile = useCallback(
    async (fileName: string) => {
      try {
        const blob = await adminApi.fetchFile(number, fileName);
        await triggerDownloadBlob(blob, `${number}-${fileName}`);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Download failed.");
      }
    },
    [number],
  );

  const downloadDesign = useCallback(async () => {
    if (!order) return;
    const blob = new Blob(
      [JSON.stringify({ order: order.number, items: order.items.map((item) => ({ id: item.id, product: item.product, design: item.design })) }, null, 2)],
      { type: "application/json" },
    );
    await triggerDownloadBlob(blob, `${order.number}-design.json`);
  }, [order]);

  return { order, error, isSaving, update, previews, downloadFile, downloadDesign };
}
