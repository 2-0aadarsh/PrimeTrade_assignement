import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import PageContainer from "../../components/layout/PageContainer";
import AlertMessage from "../../components/ui/AlertMessage";
import Button from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { taskService } from "../../services/task.service";

const formatUpdated = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusLabel = (s) =>
  ({ todo: "To do", in_progress: "In progress", done: "Done" }[s] || s);

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const firstName = (name) => {
  if (!name) return "there";
  const part = name.trim().split(/\s+/)[0];
  return part || "there";
};

function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton" aria-busy="true" aria-label="Loading overview">
      <div className="dashboard-skeleton__grid">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="dashboard-skeleton__card">
            <div className="dashboard-skeleton__line dashboard-skeleton__line--short" />
            <div className="dashboard-skeleton__line dashboard-skeleton__line--value" />
            <div className="dashboard-skeleton__bar" />
          </div>
        ))}
      </div>
      <div className="card dashboard-skeleton__panel">
        <div className="dashboard-skeleton__line dashboard-skeleton__line--title" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="dashboard-skeleton__row">
            <div className="dashboard-skeleton__line dashboard-skeleton__line--long" />
            <div className="dashboard-skeleton__pill" />
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardPage() {
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalTasks, setTotalTasks] = useState(0);
  const [counts, setCounts] = useState({ todo: 0, in_progress: 0, done: 0 });
  const [recentTasks, setRecentTasks] = useState([]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [recentRes, todoRes, progressRes, doneRes] = await Promise.all([
        taskService.list({
          page: 1,
          limit: 5,
          sortBy: "updatedAt",
          sortOrder: "desc",
        }),
        taskService.list({ page: 1, limit: 1, status: "todo" }),
        taskService.list({ page: 1, limit: 1, status: "in_progress" }),
        taskService.list({ page: 1, limit: 1, status: "done" }),
      ]);

      const recentData = recentRes?.data?.data;
      setRecentTasks(recentData?.tasks || []);
      setTotalTasks(recentData?.pagination?.total ?? 0);

      setCounts({
        todo: todoRes?.data?.data?.pagination?.total ?? 0,
        in_progress: progressRes?.data?.data?.pagination?.total ?? 0,
        done: doneRes?.data?.data?.pagination?.total ?? 0,
      });
    } catch (e) {
      setError(e?.response?.data?.message || "Could not load dashboard data.");
      setRecentTasks([]);
      setTotalTasks(0);
      setCounts({ todo: 0, in_progress: 0, done: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const completedPct = totalTasks > 0 ? Math.round((counts.done / totalTasks) * 100) : 0;
  const pct = (n) => (totalTasks > 0 ? Math.min(100, Math.round((n / totalTasks) * 100)) : 0);

  const today = new Date();

  return (
    <PageContainer title="Overview">
      <div className="dashboard">
        <section className="card dashboard-intro">
          <div className="dashboard-intro__main">
            <div className="dashboard-avatar" aria-hidden="true">
              {getInitials(user?.name)}
            </div>
            <div className="dashboard-intro__copy">
              <h2 className="dashboard-intro__title">
                Hello, {firstName(user?.name)}
              </h2>
              <p className="dashboard-intro__meta">
                {user?.email ? (
                  <span className="dashboard-intro__email">{user.email}</span>
                ) : null}
                <span className={`role-pill role-pill--${role === "admin" ? "admin" : "user"}`}>
                  {role === "admin" ? "Administrator" : "Member"}
                </span>
              </p>
            </div>
            <div className="dashboard-intro__date">
              <time dateTime={today.toISOString()}>
                <span className="dashboard-intro__weekday">
                  {today.toLocaleDateString(undefined, { weekday: "long" })}
                </span>
                <span className="dashboard-intro__fulldate">
                  {today.toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </time>
            </div>
          </div>
          {role === "admin" ? (
            <p className="dashboard-admin-banner">
              You are viewing aggregated task metrics for all accounts. User actions live under{" "}
              <Link to="/admin">Admin</Link>.
            </p>
          ) : null}
        </section>

        <AlertMessage message={error} />

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            <section className="dashboard-stats" aria-label="Task counts">
              <article className="stat-card stat-card--total">
                <h3 className="stat-card__label">Total</h3>
                <p className="stat-card__value">{totalTasks}</p>
                <div className="stat-card__bar" aria-hidden="true">
                  <span className="stat-card__bar-fill stat-card__bar-fill--neutral" style={{ width: "100%" }} />
                </div>
              </article>
              <article className="stat-card stat-card--todo">
                <h3 className="stat-card__label">To do</h3>
                <p className="stat-card__value">{counts.todo}</p>
                <div className="stat-card__bar" aria-hidden="true">
                  <span
                    className="stat-card__bar-fill stat-card__bar-fill--todo"
                    style={{ width: `${pct(counts.todo)}%` }}
                  />
                </div>
              </article>
              <article className="stat-card stat-card--progress">
                <h3 className="stat-card__label">In progress</h3>
                <p className="stat-card__value">{counts.in_progress}</p>
                <div className="stat-card__bar" aria-hidden="true">
                  <span
                    className="stat-card__bar-fill stat-card__bar-fill--progress"
                    style={{ width: `${pct(counts.in_progress)}%` }}
                  />
                </div>
              </article>
              <article className="stat-card stat-card--done">
                <h3 className="stat-card__label">Done</h3>
                <p className="stat-card__value">{counts.done}</p>
                <div className="stat-card__bar" aria-hidden="true">
                  <span
                    className="stat-card__bar-fill stat-card__bar-fill--done"
                    style={{ width: `${pct(counts.done)}%` }}
                  />
                </div>
              </article>
            </section>

            {totalTasks > 0 ? (
              <section className="card dashboard-summary" aria-label="Completion summary">
                <div className="dashboard-summary__text">
                  <span className="dashboard-summary__label">Completed</span>
                  <strong className="dashboard-summary__value">{completedPct}%</strong>
                  <span className="dashboard-summary__hint">of all tasks marked done</span>
                </div>
                <div
                  className="dashboard-summary__track"
                  role="progressbar"
                  aria-valuenow={completedPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${completedPct} percent of tasks completed`}
                >
                  <div className="dashboard-summary__fill" style={{ width: `${completedPct}%` }} />
                </div>
              </section>
            ) : null}

            <section className="card dashboard-recent">
              <header className="dashboard-recent__header">
                <h2 className="dashboard-recent__title">Recently updated</h2>
                <Button type="button" variant="secondary" onClick={() => void loadDashboard()}>
                  Refresh
                </Button>
              </header>

              {recentTasks.length === 0 ? (
                <div className="dashboard-empty">
                  <p className="muted-text">No tasks yet. Start on the Tasks page.</p>
                  <Link to="/tasks" className="btn btn-primary dashboard-empty__cta">
                    Go to tasks
                  </Link>
                </div>
              ) : (
                <ul className="dashboard-recent-list">
                  {recentTasks.map((task) => (
                    <li key={task._id} className="dashboard-recent-item">
                      <div className="dashboard-recent-item__main">
                        <span className="dashboard-recent-item__title">{task.title}</span>
                        <span
                          className={`task-badge task-badge--${task.status}`}
                          title={statusLabel(task.status)}
                        >
                          {statusLabel(task.status)}
                        </span>
                      </div>
                      <span className="dashboard-recent-item__meta muted-text">
                        Updated {formatUpdated(task.updatedAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <p className="dashboard-recent__footer">
                <Link to="/tasks">View all tasks</Link>
              </p>
            </section>
          </>
        )}
      </div>
    </PageContainer>
  );
}

export default DashboardPage;
