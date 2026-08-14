import { request } from "./client";

export function getEquipment(filters = {}) {
  const searchParams = new URLSearchParams();

  if (filters.city) searchParams.set("city", filters.city);
  if (filters.category) searchParams.set("category", filters.category);
  if (filters.maxPrice) searchParams.set("max_price", filters.maxPrice);
  if (filters.delivery) searchParams.set("delivery", "true");
  if (filters.supplier) searchParams.set("supplier", filters.supplier);

  const queryString = searchParams.toString();
  const path = queryString ? `/equipment/?${queryString}` : "/equipment/";
  return request(path);
}

export function getAvailability(equipmentId, start, end) {
  const params = new URLSearchParams();
  if (start) params.set("start", start);
  if (end) params.set("end", end);
  const query = params.toString();
  return request(`/equipment/${equipmentId}/availability/${query ? `?${query}` : ""}`);
}

export function getMyEquipment() {
  return request("/equipment/mine/");
}

export function updateEquipment(equipmentId, data) {
  return request(`/equipment/${equipmentId}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function createEquipment(data) {
  return request("/equipment/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteEquipment(equipmentId) {
  return request(`/equipment/${equipmentId}/`, { method: "DELETE" });
}

export function toggleEquipmentActive(equipmentId) {
  return request(`/equipment/${equipmentId}/toggle_active/`, { method: "POST" });
}

export function uploadEquipmentImage(equipmentId, file, isMain = false) {
  const formData = new FormData();
  formData.append("equipment", equipmentId);
  formData.append("image", file);
  formData.append("is_main", isMain);

  return request("/equipment-images/", {
    method: "POST",
    body: formData,
  });
}

export function deleteEquipmentImage(imageId) {
  return request(`/equipment-images/${imageId}/`, { method: "DELETE" });
}