import { useMemo, useState } from "react";
import { LuFileImage, LuRefreshCw, LuSearch } from "react-icons/lu";
import { Link } from "@/core/router/router";
import { useAdminOrders } from "../application/useAdmin";
import { formatMoney } from "../domain/catalog";
import { ORDER_STATUSES, statusLabel, type OrderStatus } from "../domain/order";
import AdminLayout from "./AdminLayout";

export default function AdminOrdersPage() {
  return <AdminLayout>{(info) => <OrdersList storage={info?.storage ?? ""} />}</AdminLayout>;
}

function OrdersList({ storage }: { storage: string }) {
  const { orders, error, isLoading, refresh } = useAdminOrders(true);
  const [filter, setFilter] = useState<OrderStatus | "all" | "open">("open");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (orders ?? []).filter((order) => {
      if (filter === "open" && ["delivered", "cancelled"].includes(order.status)) return false;
      if (filter !== "all" && filter !== "open" && order.status !== filter) return false;
      if (!needle) return true;
      return [order.number, order.customerName, order.city].some((value) =>
        value.toLowerCase().includes(needle),
      );
    });
  }, [orders, filter, query]);

  const newCount = (orders ?? []).filter((order) => order.status === "new").length;
  const openRevenue = (orders ?? [])
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="admin-orders">
      <div className="admin-title-row">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="admin-subtle">
            Storage: {storage === "blob" ? "Vercel Blob (private)" : storage === "filesystem" ? "Local disk (development)" : storage}
          </p>
        </div>
        <button type="button" className="store-btn store-btn--outline store-btn--sm" onClick={() => void refresh()} disabled={isLoading}>
          <LuRefreshCw className={isLoading ? "store-spin" : ""} aria-hidden="true" /> Refresh
        </button>
      </div>

      <div className="admin-stats">
        <div className="admin-stat">
          <span>New orders</span>
          <strong>{newCount}</strong>
        </div>
        <div className="admin-stat">
          <span>All orders</span>
          <strong>{orders?.length ?? "—"}</strong>
        </div>
        <div className="admin-stat">
          <span>Order value (excl. cancelled)</span>
          <strong>{formatMoney(openRevenue)}</strong>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-filters" role="tablist" aria-label="Filter by status">
          {[{ id: "open", label: "Open" }, { id: "all", label: "All" }, ...ORDER_STATUSES].map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={filter === entry.id}
              className={`admin-filter${filter === entry.id ? " is-active" : ""}`}
              onClick={() => setFilter(entry.id as typeof filter)}
            >
              {entry.label}
            </button>
          ))}
        </div>
        <label className="admin-search">
          <LuSearch aria-hidden="true" />
          <input
            type="search"
            placeholder="Search number, name, city"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search orders"
          />
        </label>
      </div>

      {error ? <p className="store-error" role="alert">{error}</p> : null}

      {orders && filtered.length === 0 ? (
        <div className="empty-state empty-state--compact">
          <h2>No orders here yet</h2>
          <p>New orders appear here as soon as customers check out.</p>
        </div>
      ) : null}

      {filtered.length > 0 ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Posters</th>
                <th>Total</th>
                <th>Status</th>
                <th>Print files</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.number}>
                  <td>
                    <Link to={`/admin/orders/${order.number}`} className="admin-table__link">
                      {order.number}
                    </Link>
                  </td>
                  <td>{new Date(order.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</td>
                  <td>
                    {order.customerName}
                    <span className="admin-subtle"> · {order.city}</span>
                  </td>
                  <td>{order.itemCount}</td>
                  <td>{formatMoney(order.total, order.currency)}</td>
                  <td>
                    <span className={`status-chip status-chip--${order.status}`}>{statusLabel(order.status)}</span>
                  </td>
                  <td>
                    {order.hasPrintFiles ? (
                      <span className="admin-ready"><LuFileImage aria-hidden="true" /> Ready</span>
                    ) : (
                      <span className="admin-subtle">To generate</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
