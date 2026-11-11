import type { ProductOptions } from "./catalog.js";
import type { DesignSummary, PosterDesign } from "./design.js";

export interface CartItem {
  id: string;
  product: ProductOptions;
  quantity: number;
  design: PosterDesign;
  summary: DesignSummary;
  previewDataUrl: string;
  addedAt: string;
}

export interface LastOrderRef {
  number: string;
  accessKey: string;
  createdAt: string;
}
