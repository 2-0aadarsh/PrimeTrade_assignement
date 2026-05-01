import { useCallback, useEffect, useRef, useState } from "react";

import PageContainer from "../../components/layout/PageContainer";
import AlertMessage from "../../components/ui/AlertMessage";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import { useAuth } from "../../hooks/useAuth";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { taskService } from "../../services/task.service";
import TaskFormModal from "./TaskFormModal";

const SEARCH_DEBOUNCE_MS = 400;

const SORT_OPTIONS = [
  { value: "createdAt", label: "Created" },
  { value: "updatedAt", label: "Updated" },
  { value: "title", label: "Title" },
  { value: "dueDate", label: "Due date" },
  { value: "priority", label: "Priority" },
];

const STATUS_FILTER = [
  { value: "", label: "All statuses" },
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

const PRIORITY_FILTER = [
  { value: "", label: "All priorities" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const formatDisplayDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const labelStatus = (s) =>
  ({ todo: "To do", in_progress: "In progress", done: "Done" }[s] || s);

const labelPriority = (p) =>
  ({ low: "Low", medium: "Medium", high: "High" }[p] || p);

const statusPillClass = (status) =>
  ({
    todo: "task-pill--st-todo",
    in_progress: "task-pill--st-progress",
    done: "task-pill--st-done",
  }[status] || "task-pill--st-todo");

const priorityPillClass = (priority) =>
  ({
    low: "task-pill--pri-low",
    medium: "task-pill--pri-medium",
    high: "task-pill--pri-high",
  }[priority] || "task-pill--pri-medium");

/** Owner may be populated `{ name, email }` from API or a legacy raw id string. */
const ownerDisplayLines = (owner) => {
  if (owner && typeof owner === "object" && owner !== null) {
    const name = owner.name?.trim();
    const email = owner.email?.trim();
    if (name && email) return { primary: name, secondary: email };
    if (name) return { primary: name, secondary: null };
    if (email) return { primary: email, secondary: null };
    if (owner._id) return { primary: String(owner._id), secondary: null };
  }
  const raw = owner != null ? String(owner) : "";
  if (!raw) return { primary: "—", secondary: null };
  return { primary: raw.length > 16 ? `…${raw.slice(-8)}` : raw, secondary: null };
};

const getListErrorMessage = (requestError) =>
  requestError?.response?.data?.message || "Could not load tasks.";

function TableSkeleton({ showOwnerColumn }) {
  const cols = showOwnerColumn ? 7 : 6;
  return (
    <div className="tasks-skeleton-wrap">
      <div className="tasks-table-scroll">
        <table className="tasks-skeleton-table">
          <thead>
            <tr>
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i}>
                  <div className="tasks-skel-bar tasks-skel-bar--short" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[0, 1, 2].map((row) => (
              <tr key={row}>
                <td>
                  <div className="tasks-skel-bar" style={{ width: "8rem" }} />
                </td>
                <td>
                  <div className="tasks-skel-bar tasks-skel-bar--mid" />
                </td>
                <td>
                  <div className="tasks-skel-bar tasks-skel-bar--mid" />
                </td>
                <td>
                  <div className="tasks-skel-bar tasks-skel-bar--short" />
                </td>
                <td>
                  <div className="tasks-skel-bar tasks-skel-bar--short" />
                </td>
                {showOwnerColumn ? (
                  <td>
                    <div className="tasks-skel-bar tasks-skel-bar--short" />
                  </td>
                ) : null}
                <td>
                  <div className="tasks-actions-row">
                    <span className="tasks-skel-bar tasks-skel-bar--btn" />
                    <span className="tasks-skel-bar tasks-skel-bar--btn" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TasksPage() {
  const { role } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearchInput = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    priority: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const lastAppliedSearchRef = useRef("");

  const fetchTasks = useCallback(async () => {
    setListLoading(true);
    setListError("");
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    };
    if (filters.search) params.search = filters.search;
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;

    try {
      const res = await taskService.list(params);
      const data = res?.data?.data;
      setTasks(data?.tasks || []);
      if (data?.pagination) {
        setPagination((prev) => ({
          ...prev,
          ...data.pagination,
        }));
      }
    } catch (e) {
      setListError(getListErrorMessage(e));
      setTasks([]);
    } finally {
      setListLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    filters.search,
    filters.status,
    filters.priority,
    filters.sortBy,
    filters.sortOrder,
  ]);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    const next = debouncedSearchInput.trim();
    if (lastAppliedSearchRef.current === next) return;
    lastAppliedSearchRef.current = next;
    setFilters((prev) => ({ ...prev, search: next }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearchInput]);

  const commitSearchNow = () => {
    const next = searchInput.trim();
    if (lastAppliedSearchRef.current === next) {
      setPagination((prev) => ({ ...prev, page: 1 }));
      return;
    }
    lastAppliedSearchRef.current = next;
    setFilters((prev) => ({ ...prev, search: next }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const onFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const openCreate = () => {
    setEditingTask(null);
    setFormOpen(true);
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingTask(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await taskService.remove(deleteTarget._id);
      setDeleteTarget(null);
      void fetchTasks();
    } catch (e) {
      setListError(e?.response?.data?.message || "Could not delete task.");
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const showOwner = role === "admin";
  const rangeStart = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const rangeEnd = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <PageContainer title="Tasks">
      <div className="tasks-layout">
        {showOwner ? (
          <div className="tasks-banner-admin">
            <span aria-hidden="true">👑</span>
            <span>As an admin, you are viewing tasks from all users.</span>
          </div>
        ) : null}

        <section className="card tasks-toolbar-card">
          <div className="tasks-toolbar-top">
            <div className="tasks-search-block">
              <label htmlFor="task-search" className="tasks-search-label">
                Search tasks
              </label>
              <div className="tasks-search-field">
                <input
                  id="task-search"
                  type="search"
                  className="form-input form-input--soft"
                  placeholder="Title or description..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitSearchNow();
                    }
                  }}
                  autoComplete="off"
                />
                <span className="tasks-search-icon" aria-hidden="true">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </span>
              </div>
              <p className="tasks-search-hint-modern">
                Updates as you type · Press Enter for instant search
              </p>
            </div>
            <Button type="button" onClick={openCreate} className="tasks-toolbar__cta">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              New task
            </Button>
          </div>

          <div className="tasks-filter-grid-modern">
            <div>
              <label htmlFor="filter-status" className="tasks-filter-label-modern">
                Status
              </label>
              <select
                id="filter-status"
                className="task-form-select-soft"
                value={filters.status}
                onChange={(e) => onFilterChange("status", e.target.value)}
              >
                {STATUS_FILTER.map((o) => (
                  <option key={o.value || "all"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filter-priority" className="tasks-filter-label-modern">
                Priority
              </label>
              <select
                id="filter-priority"
                className="task-form-select-soft"
                value={filters.priority}
                onChange={(e) => onFilterChange("priority", e.target.value)}
              >
                {PRIORITY_FILTER.map((o) => (
                  <option key={o.value || "all-p"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filter-sort" className="tasks-filter-label-modern">
                Sort by
              </label>
              <select
                id="filter-sort"
                className="task-form-select-soft"
                value={filters.sortBy}
                onChange={(e) => onFilterChange("sortBy", e.target.value)}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filter-order" className="tasks-filter-label-modern">
                Order
              </label>
              <select
                id="filter-order"
                className="task-form-select-soft"
                value={filters.sortOrder}
                onChange={(e) => onFilterChange("sortOrder", e.target.value)}
              >
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
            </div>
          </div>
        </section>

        <AlertMessage message={listError} />

        {listLoading ? (
          <TableSkeleton showOwnerColumn={showOwner} />
        ) : tasks.length === 0 ? (
          <div className="tasks-empty-modern">
            <div className="tasks-empty-emoji" aria-hidden="true">
              📭
            </div>
            <p className="muted-text">No tasks match your filters yet.</p>
            <Button type="button" onClick={openCreate} className="tasks-toolbar__cta">
              Create your first task
            </Button>
          </div>
        ) : (
          <div className="tasks-table-shell">
            <div className="tasks-table-scroll">
              <table className="tasks-table-min">
                <thead>
                  <tr>
                    <th scope="col" className="tasks-th-title">
                      Title
                    </th>
                    <th scope="col" className="tasks-th-pill">
                      Status
                    </th>
                    <th scope="col" className="tasks-th-pill">
                      Priority
                    </th>
                    <th scope="col" className="tasks-th-nowrap">
                      Due
                    </th>
                    <th scope="col" className="tasks-th-nowrap">
                      Updated
                    </th>
                    {showOwner ? <th scope="col">Owner</th> : null}
                    <th scope="col" className="tasks-th-actions">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => {
                    const ownerLines = ownerDisplayLines(task.owner);
                    return (
                    <tr key={task._id}>
                      <td className="tasks-td-title">
                        <div className="tasks-cell-title">{task.title}</div>
                        {task.description ? (
                          <p className="tasks-desc-clamp">{task.description}</p>
                        ) : null}
                      </td>
                      <td className="tasks-td-pill">
                        <span
                          className={`task-pill ${statusPillClass(task.status)}`}
                          title={labelStatus(task.status)}
                        >
                          {labelStatus(task.status)}
                        </span>
                      </td>
                      <td className="tasks-td-pill">
                        <span
                          className={`task-pill ${priorityPillClass(task.priority)}`}
                          title={labelPriority(task.priority)}
                        >
                          {labelPriority(task.priority)}
                        </span>
                      </td>
                      <td className="tasks-td-nowrap">{formatDisplayDate(task.dueDate)}</td>
                      <td className="tasks-td-nowrap">{formatDisplayDate(task.updatedAt)}</td>
                      {showOwner ? (
                        <td>
                          <div className="tasks-owner-cell">
                            <span className="tasks-owner-primary">{ownerLines.primary}</span>
                            {ownerLines.secondary ? (
                              <span className="tasks-owner-secondary">{ownerLines.secondary}</span>
                            ) : null}
                          </div>
                        </td>
                      ) : null}
                      <td className="tasks-td-actions">
                        <div className="tasks-actions-row">
                          <button type="button" className="tasks-action-edit" onClick={() => openEdit(task)}>
                            Edit
                          </button>
                          <button
                            type="button"
                            className="tasks-action-delete"
                            onClick={() => setDeleteTarget(task)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 ? (
              <div className="tasks-pagination-bar">
                <div className="tasks-pagination-meta">
                  Showing {rangeStart} to {rangeEnd} of {pagination.total} tasks
                </div>
                <div className="tasks-pagination-nav">
                  <button
                    type="button"
                    className="tasks-page-btn"
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  >
                    ← Previous
                  </button>
                  <span className="tasks-page-indicator">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    className="tasks-page-btn"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  >
                    Next →
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        <TaskFormModal isOpen={formOpen} task={editingTask} onClose={closeForm} onSaved={fetchTasks} />

        <Modal
          isOpen={Boolean(deleteTarget)}
          title="Delete this task?"
          onClose={() => !deleteLoading && setDeleteTarget(null)}
        >
          <p className="modal-text">
            This task will be removed from your list. It stays in the recycle bin for 60 days on the
            server.
          </p>
          {deleteTarget ? <p className="tasks-delete-quote">“{deleteTarget.title}”</p> : null}
          <div className="modal-actions">
            <Button
              type="button"
              variant="secondary"
              disabled={deleteLoading}
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={deleteLoading}
              onClick={() => void confirmDelete()}
            >
              {deleteLoading ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </Modal>
      </div>
    </PageContainer>
  );
}

export default TasksPage;
