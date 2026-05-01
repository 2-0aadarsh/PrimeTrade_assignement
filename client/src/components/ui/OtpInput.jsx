import { useCallback, useRef } from "react";

const LENGTH = 6;

/**
 * Six single-digit inputs with paste support and keyboard navigation.
 */
function OtpInput({ value, onChange, disabled, idPrefix = "otp" }) {
  const inputsRef = useRef([]);

  const digits = Array.from({ length: LENGTH }, (_, i) => value[i] ?? "");

  const focusAt = useCallback((index) => {
    const el = inputsRef.current[index];
    if (el) el.focus();
  }, []);

  const commitDigits = useCallback(
    (chars) => {
      const only = chars.replace(/\D/g, "").slice(0, LENGTH);
      onChange(only);
      const nextFocus = Math.min(only.length, LENGTH - 1);
      requestAnimationFrame(() => focusAt(nextFocus));
    },
    [onChange, focusAt],
  );

  const handleChange = (index, event) => {
    const raw = event.target.value.replace(/\D/g, "");
    if (raw.length === 0) {
      const next = (value.slice(0, index) + value.slice(index + 1)).slice(0, LENGTH);
      onChange(next);
      return;
    }
    if (raw.length >= LENGTH) {
      commitDigits(raw);
      return;
    }
    const digit = raw.slice(-1);
    const next =
      value.slice(0, index) + digit + value.slice(index + 1);
    onChange(next.slice(0, LENGTH));
    if (digit && index < LENGTH - 1) focusAt(index + 1);
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      focusAt(index - 1);
      onChange(value.slice(0, index - 1) + value.slice(index));
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusAt(index - 1);
    }
    if (event.key === "ArrowRight" && index < LENGTH - 1) {
      event.preventDefault();
      focusAt(index + 1);
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const text = event.clipboardData.getData("text") || "";
    commitDigits(text);
  };

  return (
    <fieldset className="otp-fieldset">
      <legend className="otp-legend">One-time code</legend>
      <div className="otp-cells" onPaste={handlePaste}>
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            id={`${idPrefix}-${index}`}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            className="otp-cell"
            value={digit}
            disabled={disabled}
            autoFocus={index === 0}
            aria-label={`Digit ${index + 1} of ${LENGTH}`}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onFocus={(e) => e.target.select()}
          />
        ))}
      </div>
    </fieldset>
  );
}

export default OtpInput;
