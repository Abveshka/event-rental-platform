import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getIncomingBookings, confirmBooking, declineBooking } from "../api/bookings";
import { extractErrorMessage } from "../api/errors";
import "../components/equipment/Equipment.css";

const STATUS_LABELS = {
  pending: "Ожидает подтверждения",
  confirmed: "Подтверждено",
  cancelled: "Отклонено / отменено",
  completed: "Завершено",
};

export function IncomingBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    getIncomingBookings()
      .then(setBookings)
      .catch(() => setError("Не удалось загрузить входящие бронирования"))
      .finally(() => setIsLoading(false));
  }, []);

  const handleConfirm = async (bookingId) => {
    setActionError(null);
    try {
      const updated = await confirmBooking(bookingId);
      setBookings((current) =>
        current.map((b) => (b.id === bookingId ? updated : b))
      );
    } catch (err) {
      setActionError(extractErrorMessage(err));
    }
  };

  const handleDecline = async (bookingId) => {
    setActionError(null);
    try {
      const updated = await declineBooking(bookingId);
      setBookings((current) =>
        current.map((b) => (b.id === bookingId ? updated : b))
      );
    } catch (err) {
      setActionError(extractErrorMessage(err));
    }
  };

  return (
    <main className="page">
      <header className="page-header">
        <div className="page-header-top">
          <div>
            <p className="eyebrow">Event Rental Platform</p>
            <h1>Входящие бронирования</h1>
          </div>
          <Link to="/" className="btn-auth">← К каталогу</Link>
        </div>
      </header>

      <div className="list-section">
        {isLoading && <p className="status-message">Загрузка...</p>}
        {error && <p className="status-message status-message--error">{error}</p>}
        {actionError && <p className="form-error">{actionError}</p>}

        {!isLoading && !error && bookings.length === 0 && (
          <p className="status-message">Пока нет бронирований на ваше оборудование</p>
        )}

        {!isLoading && !error && bookings.length > 0 && (
          <div className="equipment-grid">
            {bookings.map((booking) => (
              <div className="equipment-card-tag" key={booking.id}>
                <div className="equipment-card-tag__body">
                  <p className="equipment-card-tag__eyebrow">
                    {STATUS_LABELS[booking.status] || booking.status}
                    {booking.status === "cancelled" && booking.cancelled_by && (
                        <span style={{fontSize: "0.85em"}}>
      {" "}({booking.cancelled_by === "supplier" ? "отклонено вами" : "отменено организатором"})
    </span>
                    )}
                    {booking.status === "confirmed" && (
                        <span style={{color: booking.is_paid ? "var(--color-teal)" : "var(--color-coral)"}}>
      {" · "}{booking.is_paid ? "Оплачено" : "Не оплачено"}
    </span>
                    )}
                  </p>
                  <h2 className="equipment-card-tag__title">
                    Бронирование №{booking.id}
                  </h2>

                  <ul className="equipment-detail-specs">
                    {booking.items.map((item) => (
                      <li key={item.id}>
                        <span>{item.equipment_title}</span>
                        <span>{item.quantity} шт. · {item.start_date} → {item.end_date}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="equipment-card-tag__footer">
                    <span className="equipment-card-tag__price">
                      {booking.total_amount} ₽
                    </span>
                  </div>

                  {booking.status === "pending" && (
                    <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                      <button
                        className="btn-book-primary"
                        style={{ marginTop: 0 }}
                        onClick={() => handleConfirm(booking.id)}
                      >
                        Подтвердить
                      </button>
                      <button
                        className="btn-auth"
                        onClick={() => handleDecline(booking.id)}
                      >
                        Отклонить
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}