import { request } from "./client";

export function createBooking(bookingData) {
  return request("/bookings/", {
    method: "POST",
    body: JSON.stringify(bookingData),
  });
}

export function getMyBookings() {
  return request("/bookings/");
}

export function cancelBooking(bookingId) {
  return request(`/bookings/${bookingId}/cancel/`, {
    method: "POST",
  });}

export function deleteBooking(bookingId) {
  return request(`/bookings/${bookingId}/`, { method: "DELETE" });
}

export function getIncomingBookings() {
  return request("/bookings/incoming/");
}

export function confirmBooking(bookingId) {
  return request(`/bookings/${bookingId}/confirm/`, { method: "POST" });
}

export function declineBooking(bookingId) {
  return request(`/bookings/${bookingId}/decline/`, { method: "POST" });
}

export function payBooking(bookingId) {
  return request(`/bookings/${bookingId}/pay/`, { method: "POST" });
}