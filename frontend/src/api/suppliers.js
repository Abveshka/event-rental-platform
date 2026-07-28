import { request } from "./client";

export function getSupplierProfile(supplierId) {
  return request(`/suppliers/${supplierId}/`);
}

export function getSuppliers(filters = {}) {
  const searchParams = new URLSearchParams();
  if (filters.city) searchParams.set("city", filters.city);
  if (filters.specialization) searchParams.set("specialization", filters.specialization);

  const queryString = searchParams.toString();
  const path = queryString ? `/suppliers/?${queryString}` : "/suppliers/";
  return request(path);
}