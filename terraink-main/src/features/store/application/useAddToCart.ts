import { useCallback, useState } from "react";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { useExport } from "@/features/export/application/useExport";
import { useStore } from "../ui/StoreContext";
import { useDesignSnapshot } from "./useDesignSnapshot";
import type { CartItem } from "../domain/cart";

const PREVIEW_LONG_SIDE_PX = 1400;

function createId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

/**
 * Renders a preview of the live design and puts it in the cart (or updates
 * the cart line being edited), together with the full design snapshot.
 */
export function useAddToCart() {
  const { state } = usePosterContext();
  const { renderPosterCanvas } = useExport();
  const { captureDesign, summarize } = useDesignSnapshot();
  const { product, editingItemId, cart, addItem, replaceItem, setEditingItemId } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");

  const addToCart = useCallback(async () => {
    setIsAdding(true);
    setError("");
    try {
      const widthCm = Number(state.form.width) || 30;
      const heightCm = Number(state.form.height) || 40;
      const scale = PREVIEW_LONG_SIDE_PX / Math.max(widthCm, heightCm);
      const canvas = await renderPosterCanvas(
        Math.round(widthCm * scale),
        Math.round(heightCm * scale),
      );
      const previewDataUrl = canvas.toDataURL("image/jpeg", 0.86);
      const existing = editingItemId ? cart.find((item) => item.id === editingItemId) : null;

      const item: CartItem = {
        id: existing?.id ?? createId(),
        product: { ...product },
        quantity: existing?.quantity ?? 1,
        design: captureDesign(),
        summary: summarize(),
        previewDataUrl,
        addedAt: new Date().toISOString(),
      };

      if (existing) {
        replaceItem(item);
        setEditingItemId(null);
      } else {
        addItem(item);
      }
      return item;
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? `We couldn't prepare your poster: ${err.message}`
          : "We couldn't prepare your poster. Please try again.",
      );
      return null;
    } finally {
      setIsAdding(false);
    }
  }, [
    state.form.width,
    state.form.height,
    renderPosterCanvas,
    editingItemId,
    cart,
    product,
    captureDesign,
    summarize,
    replaceItem,
    addItem,
    setEditingItemId,
  ]);

  return { addToCart, isAdding, error, isEditing: !!editingItemId };
}
