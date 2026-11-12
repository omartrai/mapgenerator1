/**
 * Order confirmation over WhatsApp: phone formatting, button payloads,
 * free-text answers and the reply sent back. Pure, shared by server and UI.
 */

export type OrderLanguage = "fr" | "ar" | "en";

export type ConfirmationStatus =
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "confirmed"
  | "cancelled"
  | "skipped";

export interface OrderConfirmation {
  channel: "whatsapp";
  status: ConfirmationStatus;
  /** WhatsApp number the message went to (digits, with country code). */
  to?: string;
  /** Meta message id, used to match delivery/read receipts. */
  messageId?: string;
  error?: string;
  updatedAt: string;
}

export type ConfirmationAction = "confirm" | "cancel";

const PAYLOAD_PREFIX: Record<ConfirmationAction, string> = { confirm: "CONFIRM:", cancel: "CANCEL:" };

export function confirmationPayload(action: ConfirmationAction, orderNumber: string): string {
  return `${PAYLOAD_PREFIX[action]}${orderNumber}`;
}

export function parseConfirmationPayload(
  payload: string,
): { action: ConfirmationAction; orderNumber: string } | null {
  for (const action of ["confirm", "cancel"] as ConfirmationAction[]) {
    if (payload.startsWith(PAYLOAD_PREFIX[action])) {
      const orderNumber = payload.slice(PAYLOAD_PREFIX[action].length).trim();
      if (orderNumber) return { action, orderNumber };
    }
  }
  return null;
}

/** Customers often just type an answer: "oui", "ok", "نعم", "non", "لا"… */
export function parseYesNo(text: string): ConfirmationAction | null {
  const value = text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[!.?،,👍✅❌]/gu, "")
    .trim();
  if (/^(oui|ouii+|wi|yes|ok|okay|d'accord|daccord|confirme|confirmer|je confirme|نعم|اه|آه|واخا|wakha|ewa|iyeh|ah|confirm)$/.test(value)) {
    return "confirm";
  }
  if (/^(non|no|annuler|annule|j'annule|cancel|لا|la|ila)$/.test(value)) return "cancel";
  return null;
}

/**
 * WhatsApp number (digits with country code) from what the customer typed.
 * Moroccan numbers: 06…/07…/05… (10 digits), 6…/7… (9 digits), +212…/00212….
 */
export function toWhatsAppNumber(phone: string, country = "MA"): string | null {
  const raw = phone.trim();
  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  const international = raw.startsWith("+") || digits.startsWith("00");
  if (digits.startsWith("00")) digits = digits.slice(2);
  const morocco = !country || /^(ma|maroc|morocco|المغرب)$/i.test(country.trim());

  if (digits.startsWith("212")) {
    const local = digits.slice(3).replace(/^0/, "");
    return /^[5-7]\d{8}$/.test(local) ? `212${local}` : null;
  }
  if (morocco && !international) {
    if (/^0[5-7]\d{8}$/.test(digits)) return `212${digits.slice(1)}`;
    if (/^[5-7]\d{8}$/.test(digits)) return `212${digits}`;
    return null;
  }
  return international && digits.length >= 8 && digits.length <= 15 ? digits : null;
}

/** The message sent after the customer answers. */
export function confirmationReply(action: ConfirmationAction, language: OrderLanguage, orderNumber: string): string {
  const replies: Record<OrderLanguage, Record<ConfirmationAction, string>> = {
    fr: {
      confirm: `Merci ! Votre commande ${orderNumber} est confirmée ✅ Nous lançons l'impression et vous prévenons à l'expédition.`,
      cancel: `C'est noté, votre commande ${orderNumber} est annulée. Si c'est une erreur, répondez simplement à ce message.`,
    },
    ar: {
      confirm: `شكرًا! تم تأكيد طلبك ${orderNumber} ✅ سنبدأ الطباعة ونخبرك عند الشحن.`,
      cancel: `تم إلغاء طلبك ${orderNumber}. إذا كان ذلك عن طريق الخطأ، ما عليك سوى الرد على هذه الرسالة.`,
    },
    en: {
      confirm: `Thank you! Your order ${orderNumber} is confirmed ✅ We're sending it to print and will let you know when it ships.`,
      cancel: `Noted, your order ${orderNumber} is cancelled. If that was a mistake, just reply to this message.`,
    },
  };
  return replies[language]?.[action] ?? replies.fr[action];
}

/** Short "what you ordered" line for the template, e.g. "2 posters (Casablanca, Rabat)". */
export function orderItemsLine(
  items: { quantity: number; summary?: { title?: string } | null; collection?: { title?: string } | null }[],
  language: OrderLanguage,
): string {
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const titles = [...new Set(items.map((item) => item.collection?.title || item.summary?.title || "").filter(Boolean))];
  const noun =
    language === "ar" ? (count > 1 ? "ملصقات" : "ملصق") : language === "en" ? (count > 1 ? "posters" : "poster") : count > 1 ? "posters" : "poster";
  const list = titles.slice(0, 3).join(", ");
  return `${count} ${noun}${list ? ` (${list})` : ""}`.slice(0, 120);
}

export function formatMoneyPlain(centimes: number): string {
  return `${Math.round(centimes / 100)} DH`;
}
