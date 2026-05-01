import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import PageContainer from "../../components/layout/PageContainer";
import AlertMessage from "../../components/ui/AlertMessage";
import Button from "../../components/ui/Button";
import InputField from "../../components/ui/InputField";
import PasswordField from "../../components/ui/PasswordField";
import { useAuth } from "../../hooks/useAuth";
import { authService } from "../../services/auth.service";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState("");

  useEffect(() => {
    const stateBanner = location.state?.banner;
    if (typeof stateBanner === "string" && stateBanner) {
      setBanner(stateBanner);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await authService.login(form);
      const authData = response?.data?.data;
      login(authData);
      navigate("/dashboard");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const soft = "form-input--soft";

  return (
    <PageContainer title="Welcome back" subtitle="Sign in to open your overview and tasks." layout="auth">
      <div className="auth-layout">
        <article className="card auth-card">
          <form className="auth-form" onSubmit={onSubmit}>
            <InputField
              id="login-email"
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
              id="login-password"
              label="Password"
              name="password"
              value={form.password}
              onChange={onChange}
              required
              autoComplete="current-password"
              inputClassName={soft}
            />
            <p className="auth-forgot-wrap">
              <Link to="/forgot-password">Forgot password?</Link>
            </p>
            <AlertMessage type="success" message={banner} />
            <AlertMessage message={error} />
            <Button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <p className="auth-footer">
            No account yet? <Link to="/register">Create one</Link>
          </p>
        </article>
      </div>
    </PageContainer>
  );
}

export default LoginPage;
