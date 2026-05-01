import { useEffect, useId } from "react";

/**
 * Accessible modal overlay. Uses role="dialog" and aria-modal.
 */
function Modal({ isOpen, title, onClose, children, wide = false }) {
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !onClose) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-root" aria-hidden={false}>
      <button
        type="button"
        className="modal-backdrop"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div className="modal-align">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={`modal-panel${wide ? " modal-panel--wide" : ""}`}
        >
          <header className="modal-header">
            <h2 id={titleId} className="modal-title">
              {title}
            </h2>
            {onClose ? (
              <button
                type="button"
                className="modal-close"
                onClick={onClose}
                aria-label="Close"
              >
                ×
              </button>
            ) : null}
          </header>
          <div className="modal-body">{children}</div>
        </section>
      </div>
    </div>
  );
}

export default Modal;
