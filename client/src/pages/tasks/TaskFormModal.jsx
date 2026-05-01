import { useEffect, useState } from "react";

import Button from "../../components/ui/Button";
import InputField from "../../components/ui/InputField";
import Modal from "../../components/ui/Modal";
import { taskService } from "../../services/task.service";

const STATUS_OPTIONS = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const emptyForm = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  dueDate: "",
};

const formatDateForInput = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const getReadableApiError = (requestError) => {
  const message = requestError?.response?.data?.message;
  const errors = requestError?.response?.data?.errors;
  if (Array.isArray(errors) && errors.length > 0) {
    const detail = errors.map((item) => item.message).filter(Boolean).join(" ");
    return detail || message || "Request failed";
  }
  return message || "Request failed";
};

function TaskFormModal({ isOpen, task, onClose, onSaved }) {
  const isEdit = Boolean(task?._id);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    if (task) {
      setForm({
        title: task.title || "",
        description: task.description || "",
        status: task.status || "todo",
        priority: task.priority || "medium",
        dueDate: formatDateForInput(task.dueDate),
      });
    } else {
      setForm(emptyForm);
    }
  }, [isOpen, task]);

  const onChangeField = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    const body = {
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate ? form.dueDate : null,
    };
    try {
      if (isEdit) {
        await taskService.update(task._id, body);
      } else {
        await taskService.create(body);
      }
      onSaved?.();
      onClose?.();
    } catch (requestError) {
      setError(getReadableApiError(requestError));
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    if (!loading) onClose?.();
  };

  return (
    <Modal isOpen={isOpen} title={isEdit ? "Edit task" : "New task"} onClose={close} wide>
      <form onSubmit={handleSubmit} className="task-form-stack">
        {error ? <p className="task-modal-alert">{error}</p> : null}

        <InputField
          id="task-title"
          label="Title"
          name="title"
          value={form.title}
          onChange={onChangeField}
          required
          minLength={3}
          maxLength={120}
          inputClassName="form-input--soft"
        />

        <div className="form-field">
          <label htmlFor="task-description" className="task-form-label-soft">
            Description
          </label>
          <textarea
            id="task-description"
            name="description"
            className="form-input form-input--soft task-textarea"
            value={form.description}
            onChange={onChangeField}
            rows={4}
            maxLength={1000}
          />
          <p className="task-form-hint">Optional, up to 1000 characters</p>
        </div>

        <div className="task-form-grid">
          <div className="form-field">
            <label htmlFor="task-status" className="task-form-label-soft">
              Status
            </label>
            <select
              id="task-status"
              name="status"
              className="task-form-select-soft"
              value={form.status}
              onChange={onChangeField}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="task-priority" className="task-form-label-soft">
              Priority
            </label>
            <select
              id="task-priority"
              name="priority"
              className="task-form-select-soft"
              value={form.priority}
              onChange={onChangeField}
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <InputField
          id="task-due"
          label="Due date (optional)"
          type="date"
          name="dueDate"
          value={form.dueDate}
          onChange={onChangeField}
          inputClassName="form-input--soft"
        />

        <div className="task-form-footer">
          <Button
            type="button"
            variant="secondary"
            disabled={loading}
            onClick={close}
            className="task-form-btn-cancel"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="task-form-btn-submit">
            {loading ? "Saving…" : isEdit ? "Save changes" : "Create task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default TaskFormModal;
