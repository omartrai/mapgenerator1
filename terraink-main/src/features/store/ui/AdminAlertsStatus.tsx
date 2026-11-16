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
    <p className="admin-subtle admin-alerts">
      <LuBellRing aria-hidden="true" />
      {enabled ? (
        <>
          Telegram alerts on ·{" "}
          <button type="button" className="admin-alerts__test" onClick={() => void test()} disabled={busy}>
            {busy ? "Sending…" : "Send a test"}
          </button>
        </>
      ) : (
        <>Telegram alerts off — set TELEGRAM_BOT_TOKEN on Railway.</>
      )}
      {message ? <span className="admin-alerts__msg"> {message}</span> : null}
    </p>
  );
}
