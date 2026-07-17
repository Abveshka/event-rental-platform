export function extractErrorMessage(error, fallback = "Произошла ошибка. Попробуйте снова.") {
  const data = error?.data;

  if (!data) return fallback;

  if (typeof data.detail === "string") {
    return data.detail;
  }

  const firstFieldErrors = Object.values(data).find(
    (value) => Array.isArray(value) && value.length > 0
  );

  if (firstFieldErrors) {
    return firstFieldErrors[0];
  }

  return fallback;
}