import { useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import AppNav from "./AppNav";

function AppHeader() {
  const { isAuthenticated, logout, role, user } = useAuth();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const closeLogoutModal = () => {
    if (!loggingOut) setLogoutOpen(false);
  };

  const confirmLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
      setLogoutOpen(false);
    }
  };

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link to="/" className="brand" title="Go to overview">
          <span className="brand-text">
            <span className="brand-prime">Prime</span>
            <span className="brand-trade">Trade</span>
          </span>
        </Link>

        <AppNav role={role} isAuthenticated={isAuthenticated} />

        {isAuthenticated ? (
          <div className="app-header-actions">
            {user?.name ? (
              <span className="header-user-chip" title={user.email || undefined}>
                {user.name}
              </span>
            ) : null}
            <Link to="/account" className="header-btn header-btn--ghost header-account-btn">
              Account
            </Link>
            <Button variant="secondary" onClick={() => setLogoutOpen(true)} className="header-logout-btn">
              Logout
            </Button>
            <Modal isOpen={logoutOpen} title="Sign out?" onClose={closeLogoutModal}>
              <p className="modal-text">
                Are you sure you want to sign out? You will need to log in again to use your account.
              </p>
              <div className="modal-actions">
                <Button type="button" variant="secondary" disabled={loggingOut} onClick={closeLogoutModal}>
                  Stay signed in
                </Button>
                <Button type="button" disabled={loggingOut} onClick={() => void confirmLogout()}>
                  {loggingOut ? "Signing out..." : "Log out"}
                </Button>
              </div>
            </Modal>
          </div>
        ) : (
          <div className="header-guest-actions">
            <Link to="/register" className="header-btn header-btn--ghost">
              Register
            </Link>
            <Link to="/login" className="header-btn header-btn--solid">
              Login
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

export default AppHeader;
