import { useEffect } from "react";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { resolveDimensions, type ProductOptions } from "../domain/catalog";

/** Keeps the poster's aspect ratio in step with the chosen print size. */
export function useProductSync(product: ProductOptions) {
  const { state, dispatch } = usePosterContext();
  const { width, height } = state.form;

  useEffect(() => {
    const { widthCm, heightCm } = resolveDimensions(product);
    if (Number(width) === widthCm && Number(height) === heightCm) return;
    dispatch({
      type: "SET_LAYOUT",
      layoutId: `store_${product.sizeId}_${product.orientation}`,
      widthCm: String(widthCm),
      heightCm: String(heightCm),
    });
  }, [product, width, height, dispatch]);
}
