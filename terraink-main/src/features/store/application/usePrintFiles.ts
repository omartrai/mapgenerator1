import { useCallback, useState } from "react";
import { useExport } from "@/features/export/application/useExport";
import type { ExportFormat } from "@/features/export/domain/types";
import { adminApi, triggerDownloadBlob } from "@/core/services";
import type { Order } from "../domain/order";

export type PrintFileState = "idle" | "rendering" | "uploading" | "done" | "error";

const LABELS: Record<ExportFormat, string> = {
  png: "PNG · 300 DPI",
  pdf: "PDF · print size",
  svg: "SVG · layered vector",
};

/**
 * Renders print files for an order item with the export pipeline, saves
 * them to the order's storage and downloads a copy for the owner.
 */
export function usePrintFiles(orderNumber: string, itemId: string) {
  const { createPosterFile } = useExport();
  const [status, setStatus] = useState<Partial<Record<ExportFormat, PrintFileState>>>({});
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<Order | null>(null);

  const generate = useCallback(
    async (format: ExportFormat, options: { download?: boolean } = {}) => {
      setError("");
      setStatus((prev) => ({ ...prev, [format]: "rendering" }));
      try {
        const { blob } = await createPosterFile(format, { profile: "print" });
        const fileName = `poster-${itemId.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8)}-print.${format}`;
        setStatus((prev) => ({ ...prev, [format]: "uploading" }));
        setProgress(0);
        const updated = await adminApi.uploadPrintFile(
          orderNumber,
          itemId,
          fileName,
          blob,
          LABELS[format],
          setProgress,
        );
        setOrder(updated);
        if (options.download !== false) {
          await triggerDownloadBlob(blob, `${orderNumber}-${fileName}`);
        }
        setStatus((prev) => ({ ...prev, [format]: "done" }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not create the print file.");
        setStatus((prev) => ({ ...prev, [format]: "error" }));
      }
    },
    [createPosterFile, itemId, orderNumber],
  );

  return { generate, status, progress, error, order, labels: LABELS };
}
