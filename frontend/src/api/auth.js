import { request } from "./client";

export function login(email, password) {
  return request("/token/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(userData) {
  return request("/register/", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

export function getCurrentUser() {
  return request("/users/me/");
}

export function updateProfile(data) {
  return request("/users/me/", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}