import { useEffect, useState } from "react";
import { LuBellRing } from "react-icons/lu";
import { adminApi } from "@/core/services";

/** Orders page: whether Telegram order alerts are on, with a test button. */
export default function AdminAlertsStatus() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminApi
      .session()
      .then((info) => setEnabled(Boolean(info.alerts)))
      .catch(() => setEnabled(null));
  }, []);

  if (enabled === null) return null;

  const test = async () => {
    setBusy(true);
    setMessage("");
    try {
      await adminApi.testAlerts();
      setMessage("Test sent — check Telegram.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Test failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-alerts">
      <button
        type="button"
        className="store-btn store-btn--outline store-btn--sm"
        onClick={() => void test()}
        disabled={busy || !enabled}
        title={enabled ? "Send a test message to your Telegram" : "Set TELEGRAM_BOT_TOKEN on Railway"}
      >
        <LuBellRing aria-hidden="true" /> {busy ? "Sending…" : "Test Telegram alert"}
      </button>
      <span className="admin-subtle">
        {message || (enabled ? "Telegram alerts on" : "Telegram alerts off — set TELEGRAM_BOT_TOKEN on Railway")}
      </span>
    </div>
  );
}
