import { LuArrowLeft, LuCheck, LuDownload, LuLoader } from "react-icons/lu";
import { Link } from "@/core/router/router";
import type { ExportFormat } from "@/features/export/domain/types";
import { usePrintFiles } from "../application/usePrintFiles";
import { describeProduct } from "../domain/catalog";
import { useStore, type AdminTask } from "./StoreContext";

const FORMATS: ExportFormat[] = ["png", "pdf", "svg"];

/** Shown in the studio instead of the buy box while producing an order's print files. */
export default function AdminExportPanel({ task, isMobile }: { task: AdminTask; isMobile: boolean }) {
  const { product } = useStore();
  const { generate, status, error, labels } = usePrintFiles(task.orderNumber, task.itemId);
  const busy = Object.values(status).some((value) => value === "rendering");

  return (
    <aside className={`studio-buy studio-buy--admin${isMobile ? " is-mobile" : ""}`} aria-label="Print files">
      <p className="store-eyebrow">Admin · print files</p>
      <h2 className="studio-buy__title">{task.orderNumber}</h2>
      <p className="studio-buy__subtitle">{describeProduct(product)}</p>
      <p className="studio-buy__note">
        The customer's exact design is loaded. Don't change it — each button renders the file at
        print size and downloads it to this computer. Nothing is stored online.
      </p>
      <div className="admin-export__buttons">
        {FORMATS.map((format) => {
          const state = status[format] ?? "idle";
          return (
            <button
              key={format}
              type="button"
              className={`store-btn ${format === "png" ? "store-btn--primary" : "store-btn--outline"} store-btn--block`}
              disabled={busy}
              onClick={() => void generate(format)}
            >
              {state === "rendering" ? (
                <LuLoader className="store-spin" aria-hidden="true" />
              ) : state === "done" ? (
                <LuCheck aria-hidden="true" />
              ) : (
                <LuDownload aria-hidden="true" />
              )}
              {state === "rendering" ? "Rendering…" : labels[format]}
            </button>
          );
        })}
      </div>
      {error ? <p className="store-error" role="alert">{error}</p> : null}
      <Link to={`/admin/orders/${task.orderNumber}`} className="store-btn store-btn--ghost store-btn--block store-btn--sm">
        <LuArrowLeft aria-hidden="true" /> Back to order
      </Link>
    </aside>
  );
}
