import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getIncomingBookings,
  confirmBooking,
  declineBooking,
  deleteBooking,
} from "../api/bookings";
import { extractErrorMessage } from "../api/errors";
import { IncomingBookingCard } from "../components/bookings/IncomingBookingCard";

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

  async function handleConfirm(bookingId) {
    setActionError(null);
    try {
      const updated = await confirmBooking(bookingId);
      setBookings((current) =>
        current.map((booking) => (booking.id === bookingId ? updated : booking))
      );
    } catch (err) {
      setActionError(extractErrorMessage(err));
    }
  }

  async function handleDecline(bookingId) {
    setActionError(null);
    try {
      const updated = await declineBooking(bookingId);
      setBookings((current) =>
        current.map((booking) => (booking.id === bookingId ? updated : booking))
      );
    } catch (err) {
      setActionError(extractErrorMessage(err));
    }
  }

  async function handleDelete(bookingId) {
    const confirmed = window.confirm(
      "Вы уверены, что хотите удалить это бронирование? Это действие необратимо."
    );
    if (!confirmed) return;

    setActionError(null);
    try {
      await deleteBooking(bookingId);
      setBookings((current) => current.filter((booking) => booking.id !== bookingId));
    } catch (err) {
      setActionError(extractErrorMessage(err));
    }
  }

  return (
    <main className="page">
      <header className="page-header">
        <div className="page-header-top">
          <div>
            <p className="eyebrow">Event Rental Platform</p>
            <h1>Входящие бронирования</h1>
          </div>
          <Link to="/" className="btn-auth">
            ← К каталогу
          </Link>
        </div>
      </header>

      <div className="list-section">
        {isLoading && <p className="status-message">Загрузка...</p>}
        {error && <p className="status-message status-message--error">{error}</p>}
        {actionError && <p className="form-error">{actionError}</p>}

        {!isLoading && !error && bookings.length === 0 && (
          <p className="status-message">
            Пока нет бронирований на ваше оборудование
          </p>
        )}

        {!isLoading && !error && bookings.length > 0 && (
          <div className="equipment-grid">
            {bookings.map((booking) => (
              <IncomingBookingCard
                key={booking.id}
                booking={booking}
                onConfirm={handleConfirm}
                onDecline={handleDecline}
                canDelete={booking.status === "cancelled"}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}