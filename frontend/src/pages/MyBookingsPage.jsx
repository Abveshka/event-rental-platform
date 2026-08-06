import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyBookings, cancelBooking, deleteBooking } from "../api/bookings";
import { MyBookingCard } from "../components/bookings/MyBookingCard";


export function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [openReviewFor, setOpenReviewFor] = useState(null);

  useEffect(() => {
    getMyBookings()
      .then(setBookings)
      .catch(() => setError("Не удалось загрузить бронирования"))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleCancel(bookingId) {
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
  }

  async function handleDelete(bookingId) {
    const confirmed = window.confirm(
      "Вы уверены, что хотите удалить это бронирование? Это действие необратимо."
    );
    if (!confirmed) return;

    try {
      await deleteBooking(bookingId);
      setBookings((current) =>
        current.filter((booking) => booking.id !== bookingId)
      );
    } catch (err) {
      alert("Не удалось удалить бронирование");
    }
  }

  function handleReviewSubmitted(bookingId) {
    setBookings((current) =>
      current.map((booking) =>
        booking.id === bookingId ? { ...booking, has_review: true } : booking
      )
    );
    setOpenReviewFor(null);
  }

  return (
    <main className="page">
      <header className="page-header">
        <div className="page-header-top">
          <div>
            <p className="eyebrow">Event Rental Platform</p>
            <h1>Мои бронирования</h1>
          </div>
          <Link to="/" className="btn-auth">
            ← К каталогу
          </Link>
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
              <MyBookingCard
                key={booking.id}
                booking={booking}
                isReviewOpen={openReviewFor === booking.id}
                onCancel={handleCancel}
                onDelete={handleDelete}
                onOpenReview={setOpenReviewFor}
                onReviewSubmitted={handleReviewSubmitted}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
