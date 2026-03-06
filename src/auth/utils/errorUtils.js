const GLOBAL_ERROR_KEYS = ["detail", "message", "error", "non_field_errors"];
const FIELD_KEY_MAP = {
  phone: "phone_number",
};

const toMessage = (value) => {
  if (Array.isArray(value)) {
    return value.map(toMessage).filter(Boolean).join(" ");
  }

  if (value && typeof value === "object") {
    return Object.values(value).map(toMessage).filter(Boolean).join(" ");
  }

  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
};

export const parseBackendErrors = (error) => {
  const data = error?.response?.data;
  const fieldErrors = {};
  const globalMessages = [];

  if (!data) {
    return {
      fieldErrors,
      formError: "Something went wrong. Please try again.",
    };
  }

  if (typeof data === "string") {
    return { fieldErrors, formError: data };
  }

  if (Array.isArray(data)) {
    return { fieldErrors, formError: toMessage(data) };
  }

  if (typeof data === "object") {
    Object.entries(data).forEach(([rawKey, value]) => {
      const message = toMessage(value);
      if (!message) {
        return;
      }

      if (GLOBAL_ERROR_KEYS.includes(rawKey)) {
        globalMessages.push(message);
        return;
      }

      const key = FIELD_KEY_MAP[rawKey] || rawKey;
      fieldErrors[key] = message;
    });

    return {
      fieldErrors,
      formError: globalMessages.join(" ") || "",
    };
  }

  return {
    fieldErrors,
    formError: "Request failed. Please try again.",
  };
};
