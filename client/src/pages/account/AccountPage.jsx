import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageContainer from "../../components/layout/PageContainer";
import AlertMessage from "../../components/ui/AlertMessage";
import Button from "../../components/ui/Button";
import InputField from "../../components/ui/InputField";
import PasswordField from "../../components/ui/PasswordField";
import { useToast } from "../../context/ToastContext.jsx";
import { useAuth } from "../../hooks/useAuth";
import { authService } from "../../services/auth.service";

function AccountPage() {
  const { user, refreshUser, logoutLocal } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || "");
  const [profileError, setProfileError] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const soft = "form-input--soft";

  useEffect(() => {
    setName(user?.name || "");
  }, [user?.name]);

  const onSaveProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError("");
    try {
      await authService.updateProfile({ name });
      await refreshUser();
      toast("Profile updated.", "success");
    } catch (requestError) {
      setProfileError(requestError?.response?.data?.message || "Could not update profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  const onChangePassword = async (e) => {
    e.preventDefault();
    setPwError("");
    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }
    setPwLoading(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      logoutLocal();
      navigate("/login", { replace: true, state: { banner: "Password updated. Sign in with your new password." } });
    } catch (requestError) {
      setPwError(requestError?.response?.data?.message || "Could not change password.");
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <PageContainer title="Account" subtitle="Profile and password settings for your workspace.">
      <div className="account-layout">
        <section className="card account-panel">
          <h2 className="account-panel__title">Profile</h2>
          <form className="auth-form" onSubmit={onSaveProfile}>
            <InputField
              id="account-name"
              label="Display name"
              name="name"
              value={name}
              onChange={(ev) => setName(ev.target.value)}
              required
              autoComplete="name"
              inputClassName={soft}
            />
            {user?.email ? (
              <p className="account-email-ro muted-text">
                Email <strong>{user.email}</strong> (sign-in identifier; contact support to change).
              </p>
            ) : null}
            <AlertMessage message={profileError} />
            <Button type="submit" disabled={profileLoading}>
              {profileLoading ? "Saving…" : "Save profile"}
            </Button>
          </form>
        </section>

        <section className="card account-panel">
          <h2 className="account-panel__title">Change password</h2>
          <p className="hint-text">Updates your password and signs out other sessions. You will sign in again here.</p>
          <form className="auth-form" onSubmit={onChangePassword}>
            <PasswordField
              id="account-current-pw"
              label="Current password"
              name="currentPassword"
              value={currentPassword}
              onChange={(ev) => setCurrentPassword(ev.target.value)}
              required
              autoComplete="current-password"
              inputClassName={soft}
            />
            <PasswordField
              id="account-new-pw"
              label="New password"
              name="newPassword"
              value={newPassword}
              onChange={(ev) => setNewPassword(ev.target.value)}
              required
              autoComplete="new-password"
              inputClassName={soft}
            />
            <PasswordField
              id="account-confirm-pw"
              label="Confirm new password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(ev) => setConfirmPassword(ev.target.value)}
              required
              autoComplete="new-password"
              inputClassName={soft}
            />
            <p className="auth-hint">8–64 characters with upper, lower, number, and special character.</p>
            <AlertMessage message={pwError} />
            <Button type="submit" variant="secondary" disabled={pwLoading}>
              {pwLoading ? "Updating…" : "Change password & sign in again"}
            </Button>
          </form>
        </section>
      </div>
    </PageContainer>
  );
}

export default AccountPage;
