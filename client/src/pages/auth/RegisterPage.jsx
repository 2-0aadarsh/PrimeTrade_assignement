import { useState } from "react";
import { Link } from "react-router-dom";

import VerifyEmailModal from "../../components/auth/VerifyEmailModal";
import PageContainer from "../../components/layout/PageContainer";
import AlertMessage from "../../components/ui/AlertMessage";
import Button from "../../components/ui/Button";
import InputField from "../../components/ui/InputField";
import PasswordField from "../../components/ui/PasswordField";
import { authService } from "../../services/auth.service";

const getReadableApiError = (requestError) => {
  const message = requestError?.response?.data?.message;
  const errors = requestError?.response?.data?.errors;

  if (Array.isArray(errors) && errors.length > 0) {
    const detail = errors.map((item) => item.message).filter(Boolean).join(" ");
    return detail || message || "Registration failed";
  }

  return message || "Registration failed";
};

function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const passwordsMatch = form.password === form.confirmPassword;
  const isFormReady =
    form.name.trim() &&
    form.email.trim() &&
    form.password &&
    form.confirmPassword &&
    passwordsMatch;

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!passwordsMatch) return;

    setLoading(true);
    setError("");

    try {
      await authService.register({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      setPendingVerificationEmail(form.email.trim());
    } catch (requestError) {
      setError(getReadableApiError(requestError));
    } finally {
      setLoading(false);
    }
  };

  const soft = "form-input--soft";

  return (
    <PageContainer
      title="Create account"
      subtitle="Join PrimeTrade to manage tasks with your team."
      layout="auth"
    >
      <VerifyEmailModal
        isOpen={Boolean(pendingVerificationEmail)}
        email={pendingVerificationEmail}
        onClose={() => setPendingVerificationEmail("")}
      />
      <div className="auth-layout">
        <article className="card auth-card">
          <form className="auth-form" onSubmit={onSubmit}>
            <InputField
              id="name"
              label="Full name"
              name="name"
              value={form.name}
              onChange={onChange}
              required
              autoComplete="name"
              inputClassName={soft}
            />
            <InputField
              id="email"
              label="Email"
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              required
              autoComplete="email"
              inputClassName={soft}
            />
            <PasswordField
              id="password"
              label="Password"
              name="password"
              value={form.password}
              onChange={onChange}
              required
              autoComplete="new-password"
              inputClassName={soft}
            />
            <PasswordField
              id="confirmPassword"
              label="Confirm password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={onChange}
              required
              autoComplete="new-password"
              inputClassName={soft}
            />
            {form.confirmPassword && !passwordsMatch ? (
              <AlertMessage message="Password and confirm password do not match." />
            ) : null}
            <p className="auth-hint">
              Use 8+ characters with uppercase, lowercase, a number, and a special character.
            </p>
            <AlertMessage message={error} />
            <Button type="submit" className="auth-submit" disabled={loading || !isFormReady}>
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </form>
          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </article>
      </div>
    </PageContainer>
  );
}

export default RegisterPage;
