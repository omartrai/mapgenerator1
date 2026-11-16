import type { Order } from "../src/features/store/domain/order.js";

/**
 * Telegram alert to the shop owner for each new order.
 *
 * Set TELEGRAM_BOT_TOKEN (from @BotFather). TELEGRAM_CHAT_ID is optional:
 * without it, the chat that last wrote to the bot (send it /start) is used.
 * Several chat ids can be listed, comma-separated. A failed alert never
 * blocks or fails the order.
 */
type Env = Record<string, string | undefined>;

const API = "https://api.telegram.org";
const TIMEOUT_MS = 8000;

export interface OrderNotifier {
  newOrder(order: Order): Promise<void>;
  /** Sends a test message; returns where it went. */
  test(): Promise<{ chatIds: string[] }>;
}

const escape = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const money = (centimes: number) => `${Math.round(centimes / 100)} DH`;

/** "#ML-261116-AB12" message in French, HTML formatted. */
export function newOrderMessage(order: Order, siteUrl: string): string {
  const c = order.customer;
  const lines = order.items.map((item) => {
    const title = item.collection?.title || item.summary?.title || "Poster";
    const product = item.productLabel || (item.collection ? "" : `${item.widthCm}×${item.heightCm} cm`);
    return `• ${item.quantity} × ${escape(title)}${product ? ` — ${escape(product)}` : ""} — ${money(item.lineTotal)}`;
  });
  const link = siteUrl ? `${siteUrl.replace(/\/$/, "")}/admin/orders/${encodeURIComponent(order.number)}` : "";
  return [
    `🛒 <b>Nouvelle commande ${escape(order.number)}</b>`,
    "",
    `👤 ${escape(c.fullName)}`,
    `📞 ${escape(c.phone)}${c.email ? ` · ${escape(c.email)}` : ""}`,
    `📍 ${escape([c.address, c.postalCode, c.city].filter(Boolean).join(", "))}`,
    "",
    ...lines,
    "",
    `💰 <b>Total ${money(order.totals.total)}</b>${order.totals.shipping ? ` (livraison ${money(order.totals.shipping)})` : " (livraison offerte)"} · paiement à la livraison`,
    ...(c.notes?.trim() ? ["", `📝 ${escape(c.notes.trim())}`] : []),
    ...(link ? ["", `<a href="${link}">Ouvrir la commande</a>`] : []),
  ].join("\n");
}

export function createTelegramNotifier(env: Env): OrderNotifier | null {
  const token = String(env.TELEGRAM_BOT_TOKEN ?? "").trim();
  if (!token) return null;
  const configured = String(env.TELEGRAM_CHAT_ID ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const siteUrl =
    String(env.SITE_URL ?? env.VITE_SITE_URL ?? "").trim() ||
    (env.RAILWAY_PUBLIC_DOMAIN ? `https://${env.RAILWAY_PUBLIC_DOMAIN}` : "");
  let discovered: string | null = null;

  async function call(method: string, body: unknown): Promise<any> {
    const response = await fetch(`${API}/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const data = (await response.json().catch(() => null)) as { ok?: boolean; result?: unknown; description?: string } | null;
    if (!response.ok || !data?.ok) throw new Error(data?.description || `Telegram ${method} failed (${response.status})`);
    return data.result;
  }

  /** Without TELEGRAM_CHAT_ID: the last chat that wrote to the bot. */
  async function chatIds(): Promise<string[]> {
    if (configured.length) return configured;
    if (discovered) return [discovered];
    const updates = (await call("getUpdates", { limit: 100 })) as { message?: { chat?: { id?: number } } }[];
    const last = [...updates].reverse().find((update) => update.message?.chat?.id);
    if (!last) throw new Error("No chat yet: send /start to your bot on Telegram, then try again.");
    discovered = String(last.message!.chat!.id);
    console.info("[telegram] using chat", discovered, "— set TELEGRAM_CHAT_ID to make it permanent");
    return [discovered];
  }

  async function send(text: string): Promise<string[]> {
    const ids = await chatIds();
    await Promise.all(ids.map((chat_id) => call("sendMessage", { chat_id, text, parse_mode: "HTML", disable_web_page_preview: true })));
    return ids;
  }

  return {
    async newOrder(order) {
      try {
        await send(newOrderMessage(order, siteUrl));
      } catch (error) {
        console.warn("[telegram] order alert not sent", order.number, error instanceof Error ? error.message : error);
      }
    },
    async test() {
      const ids = await send("✅ Noria : les alertes de nouvelles commandes arriveront ici.");
      return { chatIds: ids };
    },
  };
}
