import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyBookings, cancelBooking, deleteBooking } from "../api/bookings";
import "../components/equipment/Equipment.css";

const STATUS_LABELS = {
  pending: "Ожидает подтверждения",
  confirmed: "Подтверждено",
  cancelled: "Отменено",
  completed: "Завершено",
};

export function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyBookings()
      .then(setBookings)
      .catch(() => setError("Не удалось загрузить бронирования"))
      .finally(() => setIsLoading(false));
  }, []);

  const handleCancel = async (bookingId) => {
    try {
      const updatedBooking = await cancelBooking(bookingId);
      setBookings((current) =>
        current.map((booking) =>
          booking.id === bookingId ? updatedBooking : booking
        )
      );
    } catch (err) {
      alert("Не удалось отменить бронирование");
    }
  };

  const handleDelete = async (bookingId) => {
    const confirmed = window.confirm(
      "Вы уверены, что хотите удалить это бронирование? Это действие необратимо."
    );
    if (!confirmed) return;

    try {
      await deleteBooking(bookingId);
      setBookings((current) => current.filter((booking) => booking.id !== bookingId));
    } catch (err) {
      alert("Не удалось удалить бронирование");
    }
  };

  return (
    <main className="page">
      <header className="page-header">
        <div className="page-header-top">
          <div>
            <p className="eyebrow">Event Rental Platform</p>
            <h1>Мои бронирования</h1>
          </div>
          <Link to="/" className="btn-auth">← К каталогу</Link>
        </div>
      </header>

      <div className="list-section">
        {isLoading && <p className="status-message">Загрузка...</p>}
        {error && <p className="status-message status-message--error">{error}</p>}

        {!isLoading && !error && bookings.length === 0 && (
          <p className="status-message">У вас пока нет бронирований</p>
        )}

        {!isLoading && !error && bookings.length > 0 && (
          <div className="equipment-grid">
            {bookings.map((booking) => (
              <div className="equipment-card" key={booking.id}>
                <div className="booking-card-header">
                  <h2>Бронирование №{booking.id}</h2>
                  {booking.status === "cancelled" && (
                    <button
                      className="btn-delete-icon"
                      onClick={() => handleDelete(booking.id)}
                      title="Удалить бронирование"
                    >
                      🗑️
                    </button>
                  )}
                </div>

                <p><strong>Статус:</strong> {STATUS_LABELS[booking.status] || booking.status}</p>
                <p><strong>Сумма:</strong> {booking.total_amount} ₽</p>
                <ul>
                  {booking.items.map((item) => (
                    <li key={item.id}>
                      {item.equipment_title} — {item.quantity} шт.
                      ({item.start_date} → {item.end_date})
                    </li>
                  ))}
                </ul>

                {(booking.status === "pending" || booking.status === "confirmed") && (
                  <button
                    className="btn-auth"
                    onClick={() => handleCancel(booking.id)}
                  >
                    Отменить бронирование
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}