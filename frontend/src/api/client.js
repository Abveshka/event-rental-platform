import { API_BASE_URL } from "./config";

async function refreshAccessToken() {
  const refresh = localStorage.getItem("refresh_token");
  if (!refresh) return null;

  const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    // refresh_token тоже протух или невалиден — разлогиниваем
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.dispatchEvent(new Event("auth-expired"));
    return null;
  }

  const data = await response.json();
  localStorage.setItem("access_token", data.access);
  return data.access;
}

export async function request(path, options = {}, isRetry = false) {
  const accessToken = localStorage.getItem("access_token");
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...options.headers,
  };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    ...options,
  });

  if (response.status === 401 && !isRetry) {
    const newAccessToken = await refreshAccessToken();
    if (newAccessToken) {
      return request(path, options, true);
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const error = new Error(`API request failed with status ${response.status}`);
    error.status = response.status;
    error.data = errorBody;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}