const formatValidationErrors = (errors = []) => {
  return errors.map((error) => {
    if (typeof error === "string") {
      return { message: error };
    }

    return {
      field: error.field || null,
      message: error.message || "Invalid input.",
    };
  });
};

export const validateRequest = (validatorFn, source = "body") => {
  return (req, res, next) => {
    const payload = req[source] ?? {};
    const result = validatorFn(payload, req);

    if (result?.isValid) {
      if (result.value) {
        if (source === "body") {
          req.body = result.value;
        } else {
          req.validated = req.validated || {};
          req.validated[source] = result.value;
        }
      }
      return next();
    }

    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors: formatValidationErrors(result?.errors),
    });
  };
};
