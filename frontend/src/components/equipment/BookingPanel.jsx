import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { createBooking } from "../../api/bookings";
import { getAvailability } from "../../api/equipment";

export function BookingPanel({ item, isLoggedIn, onRequireAuth }) {
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [quantity, setQuantity] = useState(1);
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!item) return;
    getAvailability(item.id)
      .then((data) => {
        const map = {};
        data.days.forEach((day) => { map[day.date] = day.remaining; });
        setAvailabilityMap(map);
      })
      .catch(() => setAvailabilityMap({}));
  }, [item?.id]);

  function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const getRemainingForDate = (dateObj) => {
    const key = formatLocalDate(dateObj);
    return availabilityMap[key] ?? item?.available_quantity ?? 0;
  };

  const isDateDisabled = (dateObj) => getRemainingForDate(dateObj) < quantity;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!isLoggedIn) {
      onRequireAuth();
      return;
    }

    if (!startDate || !endDate) {
      setError("Выберите даты аренды.");
      return;
    }

    setIsSubmitting(true);

    try {
      await createBooking({
        items: [{
          equipment: item.id,
          quantity: Number(quantity),
          start_date: formatLocalDate(startDate),
          end_date: formatLocalDate(endDate),
        }],
      });
      setSuccess(true);
      setDateRange([null, null]);
    } catch (err) {
      setError("Не удалось отправить бронирование. Возможно, даты уже заняты.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="booking-panel" onSubmit={handleSubmit}>
      <div className="booking-panel__row">
        <label>Количество</label>
        <input
          type="number"
          min="1"
          max={item.available_quantity}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          required
        />
      </div>

      <DatePicker
        selectsRange
        startDate={startDate}
        endDate={endDate}
        onChange={(update) => setDateRange(update)}
        filterDate={(date) => !isDateDisabled(date)}
        minDate={new Date()}
        dateFormat="dd.MM.yyyy"
        placeholderText="Выберите даты"
        renderDayContents={(day, date) => {
          const remaining = getRemainingForDate(date);
          return <span title={`Свободно: ${remaining} шт.`}>{day}</span>;
        }}
        inline
      />

      {error && <p className="form-error">{error}</p>}
      {success && (
        <p className="booking-panel__success">
          Заявка отправлена! Статус — в «Моих бронированиях».
        </p>
      )}

      <button type="submit" className="btn-book-primary" disabled={isSubmitting}>
        {isSubmitting ? "Отправляем..." : isLoggedIn ? "Забронировать" : "Войдите, чтобы забронировать"}
      </button>
    </form>
  );
}