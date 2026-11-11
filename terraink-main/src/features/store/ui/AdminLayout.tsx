import { useState, type FormEvent, type ReactNode } from "react";
import { LuLoader, LuLock, LuLogOut } from "react-icons/lu";
import { Link } from "@/core/router/router";
import BrandMark, { BrandWordmark } from "@/shared/ui/BrandMark";
import { useAdminSession } from "../application/useAdmin";

/** Shared chrome and password gate for the admin pages. */
export default function AdminLayout({ children }: { children: (info: { storage: string; fulfillment: string } | null) => ReactNode }) {
  const session = useAdminSession();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    await session.signIn(password);
    setSubmitting(false);
  };

  return (
    <div className="store-page admin-page">
      <header className="admin-header">
        <Link to="/admin" className="store-brand">
          <BrandMark />
          <BrandWordmark />
          <span className="admin-header__tag">Orders</span>
        </Link>
        <div className="admin-header__actions">
          <Link to="/" className="store-link">View shop</Link>
          {session.status === "signed-in" ? (
            <button type="button" className="store-btn store-btn--ghost store-btn--sm" onClick={session.signOut}>
              <LuLogOut aria-hidden="true" /> Sign out
            </button>
          ) : null}
        </div>
      </header>

      <main className="admin-main">
        {session.status === "checking" ? (
          <p className="loading-line">
            <LuLoader className="store-spin" aria-hidden="true" /> Checking session…
          </p>
        ) : null}

        {session.status === "signed-out" ? (
          <form className="admin-login" onSubmit={onSubmit}>
            <span className="admin-login__icon" aria-hidden="true">
              <LuLock />
            </span>
            <h1>Order management</h1>
            <p>Enter the admin password set in your Vercel project (ADMIN_PASSWORD).</p>
            <div className="field">
              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoFocus
                required
              />
            </div>
            {session.error ? <p className="store-error" role="alert">{session.error}</p> : null}
            <button type="submit" className="store-btn store-btn--primary store-btn--block" disabled={submitting || !password}>
              {submitting ? <LuLoader className="store-spin" aria-hidden="true" /> : null} Sign in
            </button>
          </form>
        ) : null}

        {session.status === "signed-in" ? children(session.info) : null}
      </main>
    </div>
  );
}
