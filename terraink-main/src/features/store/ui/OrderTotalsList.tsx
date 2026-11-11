import { formatMoney, type OrderTotals } from "../domain/catalog";

export default function OrderTotalsList({ totals }: { totals: OrderTotals }) {
  return (
    <dl className="totals">
      <div>
        <dt>Subtotal</dt>
        <dd>{formatMoney(totals.subtotal, totals.currency)}</dd>
      </div>
      <div>
        <dt>Shipping</dt>
        <dd>{totals.shipping === 0 ? "Free" : formatMoney(totals.shipping, totals.currency)}</dd>
      </div>
      <div className="totals__grand">
        <dt>Total</dt>
        <dd>{formatMoney(totals.total, totals.currency)}</dd>
      </div>
    </dl>
  );
}
