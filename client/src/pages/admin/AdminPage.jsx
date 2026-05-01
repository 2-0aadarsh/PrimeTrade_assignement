import { useCallback, useEffect, useState } from "react";

import PageContainer from "../../components/layout/PageContainer";
import AlertMessage from "../../components/ui/AlertMessage";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import { useToast } from "../../context/ToastContext.jsx";
import { useAuth } from "../../hooks/useAuth";
import { adminService } from "../../services/admin.service";

const errMessage = (e) => e?.response?.data?.message || "Something went wrong.";

function AdminPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [loadError, setLoadError] = useState("");
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rowBusy, setRowBusy] = useState(null);
  const [disableTarget, setDisableTarget] = useState(null);
  const [disableReason, setDisableReason] = useState("");
  const [disabling, setDisabling] = useState(false);

  const myId = currentUser?._id;

  const load = useCallback(async () => {
    setLoadError("");
    setLoading(true);
    try {
      const [sumRes, usersRes] = await Promise.all([adminService.getSummary(), adminService.getUsers()]);
      setSummary(sumRes?.data?.data || null);
      setUsers(usersRes?.data?.data?.users || []);
    } catch (e) {
      setLoadError(errMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRoleChange = async (userId, nextRole) => {
    setRowBusy(userId);
    try {
      await adminService.setUserRole(userId, { role: nextRole });
      setUsers((list) => list.map((u) => (u._id === userId ? { ...u, role: nextRole } : u)));
      toast("Role updated.", "success");
    } catch (e) {
      toast(errMessage(e), "error");
    } finally {
      setRowBusy(null);
    }
  };

  const onEnable = async (userId) => {
    setRowBusy(userId);
    try {
      await adminService.setUserStatus(userId, { isActive: true, reason: null });
      setUsers((list) =>
        list.map((u) =>
          u._id === userId ? { ...u, isActive: true, disabledAt: null, disabledReason: null } : u,
        ),
      );
      toast("Account enabled.", "success");
    } catch (e) {
      toast(errMessage(e), "error");
    } finally {
      setRowBusy(null);
    }
  };

  const confirmDisable = async () => {
    if (!disableTarget) return;
    setDisabling(true);
    try {
      await adminService.setUserStatus(disableTarget._id, {
        isActive: false,
        reason: disableReason.trim() || null,
      });
      setUsers((list) =>
        list.map((u) =>
          u._id === disableTarget._id
            ? { ...u, isActive: false, disabledAt: new Date().toISOString(), disabledReason: disableReason.trim() || null }
            : u,
        ),
      );
      toast("Account disabled.", "success");
      setDisableTarget(null);
      setDisableReason("");
    } catch (e) {
      toast(errMessage(e), "error");
    } finally {
      setDisabling(false);
    }
  };

  const onForceLogout = async (userId) => {
    setRowBusy(userId);
    try {
      await adminService.forceLogout(userId);
      toast("Sessions cleared for that user.", "success");
    } catch (e) {
      toast(errMessage(e), "error");
    } finally {
      setRowBusy(null);
    }
  };

  return (
    <PageContainer title="Admin" subtitle="System overview and user management.">
      <AlertMessage message={loadError} />

      {loading ? (
        <p className="muted-text">Loading admin data…</p>
      ) : (
        <>
          {summary ? (
            <section className="admin-summary-grid" aria-label="System summary">
              <article className="stat-card">
                <p className="stat-card__label">Users</p>
                <p className="stat-card__value">{summary.users?.total ?? "—"}</p>
                <p className="admin-summary-sub muted-text">
                  {summary.users?.verified ?? 0} verified
                </p>
              </article>
              <article className="stat-card">
                <p className="stat-card__label">Tasks (active)</p>
                <p className="stat-card__value">{summary.tasks?.active ?? "—"}</p>
                <p className="admin-summary-sub muted-text">
                  {summary.tasks?.total ?? 0} total rows
                </p>
              </article>
              <article className="stat-card">
                <p className="stat-card__label">Soft-deleted tasks</p>
                <p className="stat-card__value">{summary.tasks?.softDeleted ?? "—"}</p>
              </article>
            </section>
          ) : null}

          <section className="card admin-users-card">
            <header className="admin-users-header">
              <h2 className="admin-users-title">Users</h2>
              <Button type="button" variant="secondary" onClick={() => void load()}>
                Refresh
              </Button>
            </header>

            <div className="tasks-table-scroll">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Email</th>
                    <th scope="col">Role</th>
                    <th scope="col">Verified</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="admin-users-th-actions">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isSelf = String(u._id) === String(myId);
                    const busy = rowBusy === u._id;
                    return (
                      <tr key={u._id}>
                        <td className="admin-users-name">{u.name}</td>
                        <td>
                          <span className="admin-users-email">{u.email}</span>
                        </td>
                        <td>
                          <select
                            className="form-input--soft admin-role-select"
                            value={u.role}
                            disabled={busy || isSelf}
                            title={isSelf ? "You cannot change your own role here." : undefined}
                            onChange={(e) => void onRoleChange(u._id, e.target.value)}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td>{u.isEmailVerified ? "Yes" : "No"}</td>
                        <td>
                          {u.isActive ? (
                            <span className="task-pill task-pill--st-done">Active</span>
                          ) : (
                            <span className="task-pill task-pill--pri-high" title={u.disabledReason || undefined}>
                              Disabled
                            </span>
                          )}
                        </td>
                        <td className="admin-users-td-actions">
                          <div className="admin-user-actions">
                            {u.isActive && !isSelf ? (
                              <Button
                                type="button"
                                variant="secondary"
                                disabled={busy}
                                onClick={() => {
                                  setDisableTarget(u);
                                  setDisableReason("");
                                }}
                              >
                                Disable
                              </Button>
                            ) : null}
                            {!u.isActive && !isSelf ? (
                              <Button type="button" variant="secondary" disabled={busy} onClick={() => void onEnable(u._id)}>
                                Enable
                              </Button>
                            ) : null}
                            {!isSelf ? (
                              <Button
                                type="button"
                                variant="secondary"
                                disabled={busy}
                                onClick={() => void onForceLogout(u._id)}
                              >
                                Invalidate sessions
                              </Button>
                            ) : (
                              <span className="muted-text admin-you-label">You</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <Modal
        isOpen={Boolean(disableTarget)}
        title="Disable account?"
        onClose={() => !disabling && setDisableTarget(null)}
      >
        <p className="modal-text">
          This signs the user out on next refresh and blocks login until the account is enabled again.
          {disableTarget ? (
            <>
              <strong className="admin-disable-name"> {disableTarget.name}</strong>
              <span> ({disableTarget.email})</span>
            </>
          ) : null}
        </p>
        <label className="form-field">
          <span className="form-label">Reason (optional)</span>
          <textarea
            className="form-input task-textarea"
            rows={2}
            value={disableReason}
            onChange={(e) => setDisableReason(e.target.value)}
            placeholder="Shown internally for audit context"
          />
        </label>
        <div className="modal-actions">
          <Button type="button" variant="secondary" disabled={disabling} onClick={() => setDisableTarget(null)}>
            Cancel
          </Button>
          <Button type="button" variant="danger" disabled={disabling} onClick={() => void confirmDisable()}>
            {disabling ? "Disabling…" : "Disable account"}
          </Button>
        </div>
      </Modal>
    </PageContainer>
  );
}

export default AdminPage;
