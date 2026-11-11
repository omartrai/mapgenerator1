import type { Order } from "../../src/features/store/domain/order.js";
import { formatMoney } from "../../src/features/store/domain/catalog.js";
import type { IFulfillmentProvider } from "./ports.js";

/**
 * Manual fulfillment: nothing is sent anywhere automatically. If
 * ORDER_WEBHOOK_URL is set, a short order notification is POSTed to it
 * (works with Slack, Discord, Zapier, Make or n8n incoming webhooks), so the
 * owner hears about new orders right away.
 */
function createManualProvider(webhookUrl: string): IFulfillmentProvider {
  return {
    id: "manual",
    label: "Manual (external print service)",
    async onOrderCreated(order: Order) {
      if (!webhookUrl) return;
      const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
      const text =
        `New Noria order ${order.number}: ${itemCount} poster(s), ` +
        `${formatMoney(order.totals.total, order.totals.currency)} — ` +
        `${order.customer.fullName}, ${order.customer.city}`;
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            content: text,
            event: "order.created",
            order: {
              number: order.number,
              createdAt: order.createdAt,
              total: order.totals.total,
              currency: order.totals.currency,
              items: itemCount,
              city: order.customer.city,
            },
          }),
          signal: AbortSignal.timeout(4000),
        });
      } catch (error) {
        console.warn("[orders] webhook notification failed", error);
      }
    },
    async submit() {
      // The owner submits the print file to the external platform by hand and
      // records its reference in the admin; nothing to call here.
      return { externalReference: "" };
    },
  };
}

export function createFulfillmentProvider(env: Record<string, string | undefined>): IFulfillmentProvider {
  const providerId = String(env.FULFILLMENT_PROVIDER ?? "manual").trim() || "manual";
  switch (providerId) {
    case "manual":
    default:
      return createManualProvider(String(env.ORDER_WEBHOOK_URL ?? "").trim());
  }
}
