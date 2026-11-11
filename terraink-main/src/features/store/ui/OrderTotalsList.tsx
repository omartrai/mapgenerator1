import type { OrderTotals } from "../domain/catalog";
import { useStoreText } from "./storeText";

export default function OrderTotalsList({ totals }: { totals: OrderTotals }) {
  const { t, money } = useStoreText();
  return (
    <dl className="totals">
      <div>
        <dt>{t("totals.subtotal")}</dt>
        <dd>{money(totals.subtotal, totals.currency)}</dd>
      </div>
      <div>
        <dt>{t("totals.shipping")}</dt>
        <dd>{totals.shipping === 0 ? t("totals.free") : money(totals.shipping, totals.currency)}</dd>
      </div>
      <div className="totals__grand">
        <dt>{t("totals.total")}</dt>
        <dd>{money(totals.total, totals.currency)}</dd>
      </div>
    </dl>
  );
}
