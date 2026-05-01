import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import AlertMessage from "../ui/AlertMessage";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import OtpInput from "../ui/OtpInput";
import { useAuth } from "../../hooks/useAuth";
import { authService } from "../../services/auth.service";

const getReadableApiError = (requestError) => {
  const message = requestError?.response?.data?.message;
  const errors = requestError?.response?.data?.errors;
  if (Array.isArray(errors) && errors.length > 0) {
    const detail = errors.map((item) => item.message).filter(Boolean).join(" ");
    return detail || message || "Request failed";
  }
  return message || "Request failed";
};

/**
 * Email is shown read-only; OTP is entered via six digit cells.
 */
function VerifyEmailModal({ isOpen, email, onClose }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    setOtp("");
    setError("");
    setSuccess("");
  }, [email]);

  useEffect(() => {
    if (!isOpen) {
      setOtp("");
      setError("");
      setSuccess("");
    }
  }, [isOpen]);

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    setLoading(true);
    resetMessages();
    try {
      const response = await authService.verifyOtp({ email, otp });
      const authData = response?.data?.data;
      const sessionReady =
        authData?.accessToken && authData?.refreshToken && authData?.user;

      if (sessionReady) {
        login(authData);
        setSuccess("You are signed in. Redirecting...");
        setOtp("");
        setTimeout(() => {
          onClose?.();
          navigate("/dashboard", { replace: true });
        }, 600);
      } else {
        setSuccess("Email verified. Please log in.");
        setOtp("");
        setTimeout(() => {
          onClose?.();
          navigate("/login", { replace: true });
        }, 900);
      }
    } catch (requestError) {
      setError(getReadableApiError(requestError));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    resetMessages();
    try {
      await authService.resendOtp({ email });
      setSuccess("A new code has been sent to your email.");
      setOtp("");
    } catch (requestError) {
      setError(getReadableApiError(requestError));
    } finally {
      setResendLoading(false);
    }
  };

  const handleClose = () => {
    setOtp("");
    resetMessages();
    onClose?.();
  };

  return (
    <Modal isOpen={isOpen} title="OTP verification" onClose={handleClose} wide>
      <p className="otp-instructions">
        Enter the code sent to{" "}
        <strong className="otp-email-sent">{email}</strong>
      </p>

      <form onSubmit={handleVerify}>
        <OtpInput value={otp} onChange={setOtp} disabled={loading} idPrefix="verify-otp" />

        <AlertMessage message={error} />
        <AlertMessage type="success" message={success} />

        <div className="otp-actions otp-actions--stack">
          <Button type="submit" disabled={loading || otp.length !== 6}>
            {loading ? "Verifying…" : "Verify"}
          </Button>
        </div>
      </form>

      <p className="otp-resend-hint">
        Don&apos;t receive the OTP?{" "}
        <button
          type="button"
          className="link-inline"
          disabled={resendLoading || loading}
          onClick={() => void handleResend()}
        >
          {resendLoading ? "Sending…" : "Resend OTP"}
        </button>
      </p>
    </Modal>
  );
}

export default VerifyEmailModal;
