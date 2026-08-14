export const BOOKING_STATUS_LABELS = {
  pending: "Ожидает подтверждения",
  confirmed: "Подтверждено",
  cancelled: "Отменено",
  completed: "Завершено",
};

export const INCOMING_BOOKING_STATUS_LABELS = {
  ...BOOKING_STATUS_LABELS,
  cancelled: "Отклонено / отменено",
};

export function getBookingStatusLabel(status, labels = BOOKING_STATUS_LABELS) {
  return labels[status] || status;
}

export function getCancelledByLabel(cancelledBy, viewer = "organizer") {
  if (!cancelledBy) return "";

  if (viewer === "supplier") {
    return cancelledBy === "supplier"
      ? "отклонено вами"
      : "отменено организатором";
  }

  return cancelledBy === "supplier"
    ? "отклонено поставщиком"
    : "отменено вами";
}
