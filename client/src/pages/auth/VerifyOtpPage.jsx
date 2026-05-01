import { useMemo } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import VerifyEmailModal from "../../components/auth/VerifyEmailModal";
import PageContainer from "../../components/layout/PageContainer";

function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const email = useMemo(() => {
    const fromState = location.state?.email;
    const fromQuery = searchParams.get("email");
    let raw = fromState || fromQuery || "";
    if (typeof raw !== "string") return "";
    raw = raw.trim();
    if (!fromState && fromQuery) {
      try {
        raw = decodeURIComponent(raw);
      } catch {
        /* keep raw */
      }
    }
    return raw.trim();
  }, [location.state, searchParams]);

  if (!email) {
    return (
      <PageContainer
        title="Verify email"
        subtitle="We could not detect which address to verify."
        layout="auth"
      >
        <div className="auth-layout">
          <article className="card auth-card auth-card--narrow">
            <p className="muted-text auth-copy">
              Open this page from registration, or include your email in the URL, for example{" "}
              <code className="inline-code">/verify-otp?email=you@example.com</code>.
            </p>
            <p className="auth-footer auth-footer--solo">
              <Link to="/register">Back to registration</Link>
            </p>
          </article>
        </div>
      </PageContainer>
    );
  }

  return (
    <>
      <PageContainer
        title="Verify email"
        subtitle="Enter the 6-digit code we sent you. This dialog opens automatically."
        layout="auth"
      />
      <VerifyEmailModal
        isOpen
        email={email}
        onClose={() => navigate("/register", { replace: true })}
      />
    </>
  );
}

export default VerifyOtpPage;
