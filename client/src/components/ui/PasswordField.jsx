import { useState } from "react";

function PasswordField({ id, label, error, inputClassName = "", ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="form-field">
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <div className="password-input-wrap">
        <input
          id={id}
          type={visible ? "text" : "password"}
          className={`form-input ${inputClassName}`.trim()}
          {...props}
        />
        <button
          type="button"
          className="password-toggle-btn"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}

export default PasswordField;
