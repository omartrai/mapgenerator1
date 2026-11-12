import { useEffect, useState } from "react";
import {
  LuArrowLeft,
  LuCheck,
  LuCopy,
  LuDownload,
  LuFileText,
  LuLoader,
  LuPrinter,
  LuSend,
} from "react-icons/lu";
import { FaWhatsapp } from "react-icons/fa";
import { Link, useRouter } from "@/core/router/router";
import { useAdminOrder } from "../application/useAdmin";
import { formatMoney } from "../domain/catalog";
import { ORDER_STATUSES, statusLabel, type Order, type OrderItem } from "../domain/order";
import AdminLayout from "./AdminLayout";
import FramedPoster from "./FramedPoster";
import OrderTotalsList from "./OrderTotalsList";
import {
  formatMoneyPlain,
  orderItemsLine,
  toWhatsAppNumber,
  type ConfirmationStatus,
} from "../domain/whatsapp";

export default function AdminOrderPage({ number }: { number: string }) {
  return <AdminLayout>{() => <OrderDetail number={number} />}</AdminLayout>;
}

function useCopy() {
  const [copied, setCopied] = useState("");
  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(""), 1600);
    } catch {
      // Clipboard can be blocked; the text is selectable on the page anyway.
    }
  };
  return { copied, copy };
}

function OrderDetail({ number }: { number: string }) {
  const { order, error, isSaving, update, sendWhatsApp, previews, downloadFile, downloadDesign } = useAdminOrder(number, true);
  const { copied, copy } = useCopy();

  if (error && !order) {
    return (
      <div className="empty-state">
        <h1>Order not available</h1>
        <p>{error}</p>
        <Link to="/admin" className="store-btn store-btn--outline">Back to orders</Link>
      </div>
    );
  }
  if (!order) {
    return (
      <p className="loading-line">
        <LuLoader className="store-spin" aria-hidden="true" /> Loading order…
      </p>
    );
  }

  const { customer } = order;
  const addressText = [
    customer.fullName,
    customer.address,
    `${customer.postalCode} ${customer.city}`,
    customer.country,
    customer.phone,
  ].join("\n");

  return (
    <div className="admin-order">
      <Link to="/admin" className="store-link store-link--back">
        <LuArrowLeft aria-hidden="true" /> All orders
      </Link>
      <div className="admin-title-row">
        <div>
          <h1 className="page-title">{order.number}</h1>
          <p className="admin-subtle">
            Placed {new Date(order.createdAt).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })}
          </p>
        </div>
        <span className={`status-chip status-chip--${order.status} status-chip--lg`}>{statusLabel(order.status)}</span>
      </div>
      {error ? <p className="store-error" role="alert">{error}</p> : null}

      <div className="admin-order__grid">
        <div className="admin-order__main">
          {order.items.map((item, index) => (
            <OrderItemCard
              key={item.id}
              order={order}
              item={item}
              index={index}
              preview={previews[item.id]}
              onDownload={downloadFile}
            />
          ))}
        </div>

        <aside className="admin-order__side">
          <section className="admin-card">
            <h2>Customer</h2>
            <dl className="admin-dl">
              <div><dt>Name</dt><dd>{customer.fullName}</dd></div>
              <div>
                <dt>Email</dt>
                <dd><a href={`mailto:${customer.email}?subject=${encodeURIComponent(`Your Noria order ${order.number}`)}`}>{customer.email}</a></dd>
              </div>
              <div><dt>Phone</dt><dd><a href={`tel:${customer.phone}`}>{customer.phone}</a></dd></div>
            </dl>
          </section>

          <WhatsAppCard order={order} isSaving={isSaving} onSend={sendWhatsApp} />

          <section className="admin-card">
            <div className="admin-card__head">
              <h2>Shipping address</h2>
              <button type="button" className="store-btn store-btn--ghost store-btn--sm" onClick={() => void copy("address", addressText)}>
                {copied === "address" ? <LuCheck aria-hidden="true" /> : <LuCopy aria-hidden="true" />}
                {copied === "address" ? "Copied" : "Copy"}
              </button>
            </div>
            <address className="address-block">
              {customer.fullName}<br />
              {customer.address}<br />
              {customer.postalCode} {customer.city}<br />
              {customer.country}
            </address>
            {customer.notes ? (
              <p className="admin-notes"><strong>Delivery instructions:</strong> {customer.notes}</p>
            ) : null}
          </section>

          <section className="admin-card">
            <h2>Payment</h2>
            <OrderTotalsList totals={order.totals} />
            <div className="admin-inline">
              <span>Pay on delivery ·</span>
              <button
                type="button"
                className="store-btn store-btn--outline store-btn--sm"
                disabled={isSaving}
                onClick={() => void update({ paymentStatus: order.payment.status === "paid" ? "pending" : "paid" })}
              >
                {order.payment.status === "paid" ? "Paid ✓ (undo)" : "Mark as paid"}
              </button>
            </div>
          </section>

          <StatusCard order={order} isSaving={isSaving} onSave={update} />

          <section className="admin-card">
            <h2>Data</h2>
            <button type="button" className="store-btn store-btn--outline store-btn--sm store-btn--block" onClick={() => void downloadDesign()}>
              <LuFileText aria-hidden="true" /> Download design data (JSON)
            </button>
          </section>

          <section className="admin-card">
            <h2>History</h2>
            <ol className="admin-history">
              {[...order.history].reverse().map((event, index) => (
                <li key={`${event.at}-${index}`}>
                  <time>{new Date(event.at).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}</time>
                  <span>{event.message}</span>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}

function OrderItemCard({
  order,
  item,
  index,
  preview,
  onDownload,
}: {
  order: Order;
  item: OrderItem;
  index: number;
  preview?: string;
  onDownload: (fileName: string) => Promise<void>;
}) {
  const { navigate } = useRouter();
  const line = item.collection;
  if (line || !item.design) {
    const rows: [string, string][] = line
      ? [
          ["Product", item.productLabel],
          ["Partner product", `UrbanArt #${line.productId} · ${line.title}`],
          ["Variant", `#${line.variantIndex}`],
          ["Size", `${item.widthCm} × ${item.heightCm} cm`],
          ["Frame colour", line.frameColor],
          ["Frame depth", `${line.frameDepthCm} cm`],
          ["Passe-partout", line.withMat ? "Yes" : "No"],
          ["Quantity", String(item.quantity)],
        ]
      : [["Product", item.productLabel], ["Quantity", String(item.quantity)]];
    return (
      <section className="admin-card admin-item">
        <div className="admin-card__head">
          <h2>
            Poster {index + 1} · {item.summary.title} {line ? "(collection)" : ""}
          </h2>
          <span className="admin-subtle">{formatMoney(item.lineTotal, order.totals.currency)}</span>
        </div>
        <div className="admin-item__body">
          <div className="admin-item__visual">
            {line ? (
              <FramedPoster src={line.image} alt={`${item.summary.title}`} frameId={line.frameColor} mat={line.withMat} ratio={item.widthCm / item.heightCm} size="md" />
            ) : null}
          </div>
          <div className="admin-item__details">
            <dl className="admin-dl admin-dl--compact">
              {rows.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value || "—"}</dd>
                </div>
              ))}
            </dl>
            <p className="admin-subtle">Ready-made poster: order it from UrbanArt with the product and options above. No print file needed.</p>
          </div>
        </div>
      </section>
    );
  }
  const form = item.design.form as Record<string, string | boolean>;
  const rows: [string, string][] = [
    ["Product", item.productLabel],
    ["Print size", `${item.widthCm} × ${item.heightCm} cm`],
    ["Quantity", String(item.quantity)],
    ["Title", String(form.displayCity ?? "")],
    ["Subtitle", String(form.displayCountry ?? "")],
    ["Text on poster", form.showPosterText === false ? "Hidden" : "Shown"],
    ["Style", item.summary.themeName],
    ["Typeface", item.summary.fontFamily],
    ...(item.summary.message ? ([["Message", item.summary.message]] as [string, string][]) : []),
    ["Place", String(form.location ?? "")],
    ["Centre", `${Number(form.latitude).toFixed(5)}, ${Number(form.longitude).toFixed(5)}`],
    ["Map width", `${(Number(form.distance) * 2 / 1000).toFixed(1)} km`],
    ["Rotation", `${Math.round(item.design.bearing)}°`],
    ["Markers", String(item.summary.markerCount)],
    ["Routes", String(item.summary.routeCount)],
    ["Colour overrides", String(Object.keys(item.design.customColors ?? {}).length)],
  ];

  return (
    <section className="admin-card admin-item">
      <div className="admin-card__head">
        <h2>
          Poster {index + 1} · {item.summary.title}
        </h2>
        <span className="admin-subtle">{formatMoney(item.lineTotal, order.totals.currency)}</span>
      </div>
      <div className="admin-item__body">
        <div className="admin-item__visual">
          {preview ? (
            <FramedPoster src={preview} alt={`${item.summary.title} preview`} frameId={item.product.frameId} mat={item.product.mat === true} ratio={item.widthCm / item.heightCm} size="md" />
          ) : (
            <div className="admin-item__placeholder">Preview loading…</div>
          )}
          {item.preview ? (
            <button type="button" className="store-btn store-btn--ghost store-btn--sm" onClick={() => void onDownload(item.preview!.name)}>
              <LuDownload aria-hidden="true" /> Customer preview
            </button>
          ) : null}
        </div>
        <div className="admin-item__details">
          <dl className="admin-dl admin-dl--compact">
            {rows.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value || "—"}</dd>
              </div>
            ))}
          </dl>

          <div className="admin-print">
            <h3>Print-ready files</h3>
            {item.printFiles.length === 0 ? (
              <p className="admin-subtle">
                Not generated yet. Generate them from the customer's saved design. It takes about 10 seconds.
              </p>
            ) : (
              <ul className="admin-files">
                {item.printFiles.map((file) => (
                  <li key={file.name}>
                    <span>
                      <strong>{file.label ?? file.name}</strong>
                      <span className="admin-subtle"> · {(file.size / 1024 / 1024).toFixed(1)} MB</span>
                    </span>
                    <button type="button" className="store-btn store-btn--outline store-btn--sm" onClick={() => void onDownload(file.name)}>
                      <LuDownload aria-hidden="true" /> Download
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              className="store-btn store-btn--dark store-btn--sm"
              onClick={() => navigate(`/create?order=${order.number}&item=${encodeURIComponent(item.id)}`)}
            >
              <LuPrinter aria-hidden="true" /> {item.printFiles.length ? "Regenerate print files" : "Generate print files"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusCard({
  order,
  isSaving,
  onSave,
}: {
  order: Order;
  isSaving: boolean;
  onSave: (patch: Record<string, unknown>) => Promise<boolean>;
}) {
  const [status, setStatus] = useState(order.status);
  const [reference, setReference] = useState(order.fulfillment.externalReference);
  const [tracking, setTracking] = useState(order.fulfillment.trackingUrl);
  const [note, setNote] = useState("");

  useEffect(() => {
    setStatus(order.status);
    setReference(order.fulfillment.externalReference);
    setTracking(order.fulfillment.trackingUrl);
  }, [order]);

  const dirty =
    status !== order.status ||
    reference !== order.fulfillment.externalReference ||
    tracking !== order.fulfillment.trackingUrl ||
    note.trim() !== "";

  const save = async () => {
    const patch: Record<string, unknown> = {};
    if (status !== order.status) patch.status = status;
    if (reference !== order.fulfillment.externalReference || tracking !== order.fulfillment.trackingUrl) {
      patch.fulfillment = {
        externalReference: reference,
        trackingUrl: tracking,
        ...(status === "in_production" && order.fulfillment.status === "pending" ? { status: "submitted" } : {}),
      };
    }
    if (note.trim()) patch.note = note;
    if (await onSave(patch)) setNote("");
  };

  return (
    <section className="admin-card">
      <h2>Fulfillment</h2>
      <div className="field">
        <label htmlFor="admin-status">Order status</label>
        <select id="admin-status" value={status} onChange={(event) => setStatus(event.target.value as Order["status"])}>
          {ORDER_STATUSES.map((entry) => (
            <option key={entry.id} value={entry.id}>{entry.label}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="admin-ref">urbanArt order reference</label>
        <input id="admin-ref" value={reference} onChange={(event) => setReference(event.target.value)} placeholder="e.g. APIAB12CD34 or the urbanArt order ID" />
        <p className="admin-subtle">
          Once filled in, the status follows urbanArt automatically (in production → shipped → delivered) and the
          customer sees it on “Suivre ma commande”.
          {order.fulfillment.partnerStatus ? ` urbanArt status: ${order.fulfillment.partnerStatus}.` : ""}
        </p>
      </div>
      <div className="field">
        <label htmlFor="admin-tracking">Tracking link</label>
        <input id="admin-tracking" value={tracking} onChange={(event) => setTracking(event.target.value)} placeholder="https://" />
      </div>
      <div className="field">
        <label htmlFor="admin-note">Internal note</label>
        <textarea id="admin-note" rows={2} value={note} onChange={(event) => setNote(event.target.value)} />
      </div>
      <button type="button" className="store-btn store-btn--primary store-btn--block" disabled={!dirty || isSaving} onClick={() => void save()}>
        {isSaving ? <LuLoader className="store-spin" aria-hidden="true" /> : null} Save changes
      </button>
    </section>
  );
}

const CONFIRMATION_LABELS: Record<ConfirmationStatus, string> = {
  sent: "⏳ Sent — waiting for the customer",
  delivered: "⏳ Delivered — waiting for the customer",
  read: "👀 Read — waiting for the customer",
  failed: "⚠️ Not delivered",
  confirmed: "✅ Confirmed by the customer",
  cancelled: "❌ Cancelled by the customer",
  skipped: "— Not sent (phone can't receive WhatsApp)",
};

/** Automatic WhatsApp confirmation status, resend, and a manual fallback link. */
function WhatsAppCard({ order, isSaving, onSend }: { order: Order; isSaving: boolean; onSend: () => Promise<void> }) {
  const confirmation = order.confirmation;
  const phone = toWhatsAppNumber(order.customer.phone, order.customer.country);
  const firstName = order.customer.fullName.trim().split(/\s+/)[0] ?? "";
  const manualText =
    `Bonjour ${firstName}, merci pour votre commande ${order.number} chez Noria : ` +
    `${orderItemsLine(order.items, "fr")}, ${formatMoneyPlain(order.totals.total)} à payer à la livraison. ` +
    "Pouvez-vous confirmer votre commande en répondant OUI ?";
  const final = confirmation?.status === "confirmed" || confirmation?.status === "cancelled";

  return (
    <section className="admin-card admin-whatsapp">
      <h2><FaWhatsapp aria-hidden="true" /> WhatsApp confirmation</h2>
      <p className={`admin-whatsapp__status admin-whatsapp__status--${confirmation?.status ?? "none"}`}>
        {confirmation ? CONFIRMATION_LABELS[confirmation.status] : "Not sent (automatic confirmation is off)"}
      </p>
      {confirmation?.error ? <p className="admin-subtle">{confirmation.error}</p> : null}
      <div className="admin-whatsapp__actions">
        {!final ? (
          <button type="button" className="store-btn store-btn--outline store-btn--sm" disabled={isSaving} onClick={() => void onSend()}>
            <LuSend aria-hidden="true" /> {confirmation ? "Send again" : "Send now"}
          </button>
        ) : null}
        {phone ? (
          <a
            className="store-btn store-btn--ghost store-btn--sm"
            href={`https://wa.me/${phone}?text=${encodeURIComponent(manualText)}`}
            target="_blank"
            rel="noreferrer"
          >
            <FaWhatsapp aria-hidden="true" /> Write manually
          </a>
        ) : null}
      </div>
    </section>
  );
}
