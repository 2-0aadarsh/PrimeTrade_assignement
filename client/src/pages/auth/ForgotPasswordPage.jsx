import { useState } from "react";
import { Link } from "react-router-dom";

import PageContainer from "../../components/layout/PageContainer";
import AlertMessage from "../../components/ui/AlertMessage";
import Button from "../../components/ui/Button";
import InputField from "../../components/ui/InputField";
import { authService } from "../../services/auth.service";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const soft = "form-input--soft";

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authService.forgotPassword({ email });
      setSent(true);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer
      title="Forgot password"
      subtitle="We’ll email you a reset token if the account exists."
      layout="auth"
    >
      <div className="auth-layout">
        <article className="card auth-card">
          {sent ? (
            <>
              <p className="auth-copy">
                If an account exists for that email, we sent a message with a reset token. Check your inbox and use it on
                the reset page. Tokens expire after a short time.
              </p>
              <p className="auth-footer auth-footer--solo">
                <Link to="/reset-password">Enter reset token</Link>
                {" · "}
                <Link to="/login">Back to login</Link>
              </p>
            </>
          ) : (
            <form className="auth-form" onSubmit={onSubmit}>
              <InputField
                id="forgot-email"
                label="Email"
                type="email"
                name="email"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                required
                autoComplete="email"
                inputClassName={soft}
              />
              <AlertMessage message={error} />
              <Button type="submit" className="auth-submit" disabled={loading}>
                {loading ? "Sending…" : "Send reset instructions"}
              </Button>
            </form>
          )}
          {!sent ? (
            <p className="auth-footer auth-footer--solo">
              <Link to="/login">Back to login</Link>
            </p>
          ) : null}
        </article>
      </div>
    </PageContainer>
  );
}

export default ForgotPasswordPage;
