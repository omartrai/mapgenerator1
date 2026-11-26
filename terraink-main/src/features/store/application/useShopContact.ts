import { useEffect, useState } from "react";
import { contactApi } from "@/core/services";

// One request per page load; the number only changes with a redeploy.
let whatsappPromise: Promise<string> | null = null;

function loadWhatsApp(): Promise<string> {
  whatsappPromise ??= contactApi
    .get()
    .then((body) => body.whatsapp ?? "")
    .catch(() => {
      whatsappPromise = null;
      return "";
    });
  return whatsappPromise;
}

/** The shop's WhatsApp number in wa.me form, or "" until one is set. */
export function useShopWhatsApp(): string {
  const [number, setNumber] = useState("");
  useEffect(() => {
    let active = true;
    void loadWhatsApp().then((value) => active && setNumber(value));
    return () => {
      active = false;
    };
  }, []);
  return number;
}
