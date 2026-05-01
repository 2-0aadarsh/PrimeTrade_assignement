function AlertMessage({ type = "error", message }) {
  if (!message) return null;

  return (
    <p role="alert" className={`alert alert-${type}`}>
      {message}
    </p>
  );
}

export default AlertMessage;
