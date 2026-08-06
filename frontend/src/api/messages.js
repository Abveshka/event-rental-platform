import { request } from "./client";

export function getMessages(bookingId) {
  return request(`/messages/?booking=${bookingId}`);
}

export function sendMessage(bookingId, text) {
  return request("/messages/", {
    method: "POST",
    body: JSON.stringify({ booking: bookingId, text }),
  });
}