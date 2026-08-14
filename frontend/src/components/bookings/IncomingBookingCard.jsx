import { Link } from "react-router-dom";
import {
  getBookingStatusLabel,
  getCancelledByLabel,
  INCOMING_BOOKING_STATUS_LABELS,
} from "../../constants/bookingStatuses";
import { BookingItemsList } from "./BookingItemsList";

export function IncomingBookingCard({ booking, onConfirm, onDecline, canDelete, onDelete }) {
  return (
    <article className="equipment-card-tag">
      <div className="equipment-card-tag__body">
        <p className="equipment-card-tag__eyebrow">
          {getBookingStatusLabel(booking.status, INCOMING_BOOKING_STATUS_LABELS)}

          {booking.status === "cancelled" && booking.cancelled_by && (
            <span className="booking-card__muted">
              {" "}({getCancelledByLabel(booking.cancelled_by, "supplier")})
            </span>
          )}

          {booking.status === "confirmed" && (
            <span className={booking.is_paid ? "booking-card__paid" : "booking-card__unpaid"}>
              {" · "}{booking.is_paid ? "Оплачено" : "Не оплачено"}
            </span>
          )}
        </p>

        <div className="booking-card__header">
          <h2>Бронирование №{booking.id}</h2>

          {canDelete && (
              <button
                  className="btn-delete-icon"
                  onClick={() => onDelete(booking.id)}
                  title="Удалить бронирование"
              >
                🗑️
              </button>
          )}
        </div>

        <BookingItemsList items={booking.items} />

        <div className="equipment-card-tag__footer">
          <span className="equipment-card-tag__price">
            {booking.total_amount} ₽
          </span>
          <Link to={`/bookings/${booking.id}`} className="booking-card__chat-link">
            💬 Чат
          </Link>
        </div>

        {booking.status === "pending" && (
          <div className="booking-card__actions">
            <button
              className="btn-book-primary booking-card__primary-action"
              onClick={() => onConfirm(booking.id)}
            >
              Подтвердить
            </button>
            <button className="btn-auth" onClick={() => onDecline(booking.id)}>
              Отклонить
            </button>
          </div>
        )}
      </div>
    </article>
  );
}