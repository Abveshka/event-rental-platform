import { request } from "./client";

export function getSupplierProfile(supplierId) {
  return request(`/suppliers/${supplierId}/`);
}