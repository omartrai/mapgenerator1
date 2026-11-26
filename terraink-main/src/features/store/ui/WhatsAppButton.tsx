import { WhatsAppIcon } from "@/shared/ui/Icons";
import { useShopWhatsApp } from "../application/useShopContact";
import { useStoreText } from "./storeText";

/**
 * Floating "chat on WhatsApp" button on the shop pages. Hidden until the
 * WHATSAPP_CONTACT_NUMBER variable is set on the server.
 */
export default function WhatsAppButton() {
  const { t } = useStoreText();
  const number = useShopWhatsApp();
  if (!number) return null;
  const href = `https://wa.me/${number}?text=${encodeURIComponent(t("whatsapp.message"))}`;
  return (
    <a
      className="whatsapp-fab"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("whatsapp.label")}
      title={t("whatsapp.label")}
    >
      <WhatsAppIcon className="whatsapp-fab__icon" aria-hidden="true" />
      <span className="whatsapp-fab__label">{t("whatsapp.label")}</span>
    </a>
  );
}
