import { request } from "./client";

export function getSupplierReviews(supplierId) {
  return request(`/reviews/?supplier=${supplierId}`);
}

export function createReview(bookingId, supplierId, rating, comment) {
  return request("/reviews/", {
    method: "POST",
    body: JSON.stringify({ booking: bookingId, supplier: supplierId, rating, comment }),
  });
}