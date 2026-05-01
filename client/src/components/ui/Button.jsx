function Button({ type = "button", variant = "primary", children, className = "", ...rest }) {
  const variantClass =
    variant === "secondary"
      ? "btn-secondary"
      : variant === "danger"
        ? "btn-danger"
        : "btn-primary";

  return (
    <button type={type} className={`btn ${variantClass} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}

export default Button;
