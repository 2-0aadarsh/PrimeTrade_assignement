import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import PageContainer from "../../components/layout/PageContainer";
import AlertMessage from "../../components/ui/AlertMessage";
import Button from "../../components/ui/Button";
import InputField from "../../components/ui/InputField";
import PasswordField from "../../components/ui/PasswordField";
import { authService } from "../../services/auth.service";

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const initialEmail = useMemo(() => searchParams.get("email") || "", [searchParams]);
  const initialToken = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const soft = "form-input--soft";

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword({ email, token, newPassword });
      setDone(true);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Reset failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer
      title="Reset password"
      subtitle="Paste the token from your email, choose a new password, and sign in again."
      layout="auth"
    >
      <div className="auth-layout">
        <article className="card auth-card">
          {done ? (
            <>
              <AlertMessage type="success" message="Password reset. You can sign in with your new password." />
              <p className="auth-footer auth-footer--solo">
                <Link to="/login">Go to login</Link>
              </p>
            </>
          ) : (
            <form className="auth-form" onSubmit={onSubmit}>
              <InputField
                id="reset-email"
                label="Email"
                type="email"
                name="email"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                required
                autoComplete="email"
                inputClassName={soft}
              />
              <InputField
                id="reset-token"
                label="Reset token"
                name="token"
                value={token}
                onChange={(ev) => setToken(ev.target.value)}
                required
                autoComplete="one-time-code"
                inputClassName={soft}
              />
              <PasswordField
                id="reset-new-password"
                label="New password"
                name="newPassword"
                value={newPassword}
                onChange={(ev) => setNewPassword(ev.target.value)}
                required
                autoComplete="new-password"
                inputClassName={soft}
              />
              <PasswordField
                id="reset-confirm"
                label="Confirm new password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(ev) => setConfirmPassword(ev.target.value)}
                required
                autoComplete="new-password"
                inputClassName={soft}
              />
              <p className="auth-hint">Use 8–64 characters with upper, lower, number, and special character.</p>
              <AlertMessage message={error} />
              <Button type="submit" className="auth-submit" disabled={loading}>
                {loading ? "Updating…" : "Update password"}
              </Button>
            </form>
          )}
          {!done ? (
            <p className="auth-footer auth-footer--solo">
              <Link to="/login">Back to login</Link>
            </p>
          ) : null}
        </article>
      </div>
    </PageContainer>
  );
}

export default ResetPasswordPage;
