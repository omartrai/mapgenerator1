import { createHmac, timingSafeEqual } from "node:crypto";
import type { Order } from "../src/features/store/domain/order.js";
import {
  confirmationPayload,
  formatMoneyPlain,
  orderItemsLine,
  type OrderLanguage,
} from "../src/features/store/domain/whatsapp.js";

/**
 * WhatsApp Business Platform (Meta Cloud API) client: sends the order
 * confirmation template with "Confirmer" / "Annuler" quick-reply buttons,
 * sends the follow-up text, and reads Meta's webhook. Everything secret
 * stays in server environment variables (see docs/WHATSAPP.md).
 */
type Env = Record<string, string | undefined>;

const TIMEOUT_MS = 8000;

export interface WhatsAppClient {
  /** Meta's webhook verification handshake (GET). */
  verifyToken: string;
  sendOrderConfirmation(order: Order, to: string): Promise<{ messageId: string }>;
  sendText(to: string, text: string): Promise<void>;
  /** Checks X-Hub-Signature-256 against the app secret. */
  verifySignature(rawBody: string, header: string | null): boolean;
}

export interface WebhookReply {
  from: string;
  /** Quick-reply button payload, when a button was tapped. */
  payload?: string;
  /** Free text, when the customer typed an answer. */
  text?: string;
}

export interface WebhookStatus {
  messageId: string;
  status: string;
  error?: string;
}

export function createWhatsApp(env: Env): WhatsAppClient | null {
  const token = String(env.WHATSAPP_TOKEN ?? "").trim();
  const phoneNumberId = String(env.WHATSAPP_PHONE_NUMBER_ID ?? "").trim();
  if (!token || !phoneNumberId) return null;

  const version = String(env.WHATSAPP_GRAPH_VERSION ?? "").trim() || "v23.0";
  const template = String(env.WHATSAPP_TEMPLATE ?? "").trim() || "confirmation_commande";
  const languages = String(env.WHATSAPP_TEMPLATE_LANGUAGES ?? "fr")
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean);
  const appSecret = String(env.WHATSAPP_APP_SECRET ?? "").trim();
  const verifyToken = String(env.WHATSAPP_VERIFY_TOKEN ?? "").trim();
  // Overridable only for local testing against a stand-in server.
  const apiBase = (String(env.WHATSAPP_API_BASE ?? "").trim() || "https://graph.facebook.com").replace(/\/+$/, "");
  const endpoint = `${apiBase}/${version}/${phoneNumberId}/messages`;

  /** Template language for the customer: theirs if the template exists in it. */
  function templateLanguage(language: OrderLanguage | undefined): string {
    const wanted = language ?? "fr";
    return languages.find((code) => code === wanted || code.startsWith(`${wanted}_`)) ?? languages[0] ?? "fr";
  }

  async function send(body: Record<string, unknown>): Promise<{ messageId: string }> {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", ...body }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const result = (await response.json().catch(() => ({}))) as {
      messages?: { id?: string }[];
      error?: { message?: string; code?: number };
    };
    if (!response.ok) {
      throw new Error(result.error?.message || `WhatsApp answered ${response.status}`);
    }
    return { messageId: result.messages?.[0]?.id ?? "" };
  }

  return {
    verifyToken,

    async sendOrderConfirmation(order, to) {
      const language = templateLanguage(order.language);
      const lang = (language.slice(0, 2) as OrderLanguage) || "fr";
      const firstName = order.customer.fullName.trim().split(/\s+/)[0] || order.customer.fullName;
      const text = (value: string) => ({ type: "text", text: value.replace(/\s+/g, " ").trim() || "-" });
      return send({
        to,
        type: "template",
        template: {
          name: template,
          language: { code: language },
          components: [
            {
              type: "body",
              parameters: [
                text(firstName),
                text(order.number),
                text(orderItemsLine(order.items, ["fr", "ar", "en"].includes(lang) ? lang : "fr")),
                text(formatMoneyPlain(order.totals.total)),
              ],
            },
            {
              type: "button",
              sub_type: "quick_reply",
              index: "0",
              parameters: [{ type: "payload", payload: confirmationPayload("confirm", order.number) }],
            },
            {
              type: "button",
              sub_type: "quick_reply",
              index: "1",
              parameters: [{ type: "payload", payload: confirmationPayload("cancel", order.number) }],
            },
          ],
        },
      });
    },

    async sendText(to, text) {
      await send({ to, type: "text", text: { body: text, preview_url: false } });
    },

    verifySignature(rawBody, header) {
      if (!appSecret || !header?.startsWith("sha256=")) return false;
      const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest();
      const provided = Buffer.from(header.slice(7), "hex");
      return provided.length === expected.length && timingSafeEqual(provided, expected);
    },
  };
}

/** Pulls customer answers and delivery receipts out of a webhook body. */
export function parseWebhook(body: unknown): { replies: WebhookReply[]; statuses: WebhookStatus[] } {
  const replies: WebhookReply[] = [];
  const statuses: WebhookStatus[] = [];
  const entries = (body as { entry?: unknown[] })?.entry;
  for (const entry of Array.isArray(entries) ? entries : []) {
    const changes = (entry as { changes?: unknown[] })?.changes;
    for (const change of Array.isArray(changes) ? changes : []) {
      const value = (change as { value?: Record<string, unknown> })?.value ?? {};
      for (const message of Array.isArray(value.messages) ? value.messages : []) {
        const m = message as Record<string, any>;
        const from = String(m.from ?? "");
        if (!from) continue;
        if (m.type === "button" && m.button) {
          replies.push({ from, payload: String(m.button.payload ?? ""), text: String(m.button.text ?? "") });
        } else if (m.type === "interactive" && m.interactive?.button_reply) {
          replies.push({ from, payload: String(m.interactive.button_reply.id ?? "") });
        } else if (m.type === "text" && m.text) {
          replies.push({ from, text: String(m.text.body ?? "") });
        }
      }
      for (const status of Array.isArray(value.statuses) ? value.statuses : []) {
        const s = status as Record<string, any>;
        if (!s.id || !s.status) continue;
        const error = Array.isArray(s.errors) && s.errors[0] ? String(s.errors[0].title ?? s.errors[0].message ?? "") : undefined;
        statuses.push({ messageId: String(s.id), status: String(s.status), ...(error ? { error } : {}) });
      }
    }
  }
  return { replies, statuses };
}
