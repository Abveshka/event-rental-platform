import { Link } from "react-router-dom";
import {
  getBookingStatusLabel,
  getCancelledByLabel,
} from "../../constants/bookingStatuses";
import { BookingItemsList } from "./BookingItemsList";
import { ReviewForm } from "../reviews/ReviewForm";

export function MyBookingCard({
  booking,
  isReviewOpen,
  onCancel,
  onDelete,
  onOpenReview,
  onReviewSubmitted,
}) {
  const canCancel = booking.status === "pending" || booking.status === "confirmed";
  const canDelete = booking.status === "cancelled";
  const canReview = booking.status === "completed" && !booking.has_review;
  const canPay = booking.status === "confirmed" && !booking.is_paid;

  return (
    <article className="booking-card">
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

      <p className="booking-card__meta">
        <strong>Статус:</strong> {getBookingStatusLabel(booking.status)}
        {booking.status === "cancelled" && booking.cancelled_by && (
          <span className="booking-card__muted">
            {" "}({getCancelledByLabel(booking.cancelled_by)})
          </span>
        )}
      </p>

      <div className="booking-card__sum-row">
        <p className="booking-card__meta" style={{ margin: 0 }}>
          <strong>Сумма:</strong> {booking.total_amount} ₽
        </p>
        <Link to={`/bookings/${booking.id}`} className="booking-card__chat-link">
          💬 Чат
        </Link>
      </div>

      <BookingItemsList items={booking.items} />

      {canCancel && (
        <button className="btn-auth" onClick={() => onCancel(booking.id)}>
          Отменить бронирование
        </button>
      )}

      {canReview && (
        <>
          {isReviewOpen ? (
            <ReviewForm
              booking={booking}
              onSubmitted={() => onReviewSubmitted(booking.id)}
            />
          ) : (
            <button className="btn-auth" onClick={() => onOpenReview(booking.id)}>
              Оставить отзыв
            </button>
          )}
        </>
      )}

      {canPay && (
        <Link to={`/bookings/${booking.id}/pay`} className="btn-book-primary booking-card__pay-link">
          Оплатить {booking.total_amount} ₽
        </Link>
      )}

      {booking.is_paid && (
        <p className="booking-panel__success">Оплачено</p>
      )}

      {booking.status === "completed" && booking.has_review && (
        <p className="booking-panel__success">
          Спасибо, вы уже оставили отзыв
        </p>
      )}
    </article>
  );
}