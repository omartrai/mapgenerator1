import { useCallback, useState } from "react";
import { useExport } from "@/features/export/application/useExport";
import type { ExportFormat } from "@/features/export/domain/types";
import { adminApi, triggerDownloadBlob } from "@/core/services";
import type { Order } from "../domain/order";

export type PrintFileState = "idle" | "rendering" | "done" | "error";

const LABELS: Record<ExportFormat, string> = {
  png: "PNG · 300 DPI",
  pdf: "PDF · print size",
  svg: "SVG · layered vector",
};

/**
 * Renders print files for an order item with the export pipeline and
 * downloads them to the owner's computer. Nothing is stored online; the
 * order only notes that the file was downloaded.
 */
export function usePrintFiles(orderNumber: string, itemId: string) {
  const { createPosterFile } = useExport();
  const [status, setStatus] = useState<Partial<Record<ExportFormat, PrintFileState>>>({});
  const [error, setError] = useState("");
  const [order, setOrder] = useState<Order | null>(null);

  const generate = useCallback(
    async (format: ExportFormat) => {
      setError("");
      setStatus((prev) => ({ ...prev, [format]: "rendering" }));
      try {
        const { blob } = await createPosterFile(format, { profile: "print" });
        const fileName = `poster-${itemId.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8)}-print.${format}`;
        // Download only: the file goes to this computer, nothing is stored online.
        await triggerDownloadBlob(blob, `${orderNumber}-${fileName}`);
        setStatus((prev) => ({ ...prev, [format]: "done" }));
        try {
          const { order: updated } = await adminApi.logPrintDownload(orderNumber, {
            itemId,
            name: fileName,
            contentType: blob.type || "application/octet-stream",
            size: blob.size,
            label: LABELS[format],
          });
          setOrder(updated);
        } catch {
          // The file is downloaded; only the note in the order failed.
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not create the print file.");
        setStatus((prev) => ({ ...prev, [format]: "error" }));
      }
    },
    [createPosterFile, itemId, orderNumber],
  );

  return { generate, status, error, order, labels: LABELS };
}
