function InputField({ id, label, error, className = "", inputClassName = "", ...props }) {
  return (
    <div className={`form-field ${className}`.trim()}>
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <input id={id} className={`form-input ${inputClassName}`.trim()} {...props} />
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}

export default InputField;
