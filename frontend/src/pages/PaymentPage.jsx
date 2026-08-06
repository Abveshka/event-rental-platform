import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getMyBookings, payBooking } from "../api/bookings";
import { extractErrorMessage } from "../api/errors";


export function PaymentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [payError, setPayError] = useState(null);

  useEffect(() => {
    getMyBookings()
      .then((bookings) => {
        const found = bookings.find((b) => String(b.id) === id);
        if (!found) {
          setError("Бронирование не найдено");
        } else if (found.status !== "confirmed") {
          setError("Оплата доступна только для подтверждённых бронирований");
        } else if (found.is_paid) {
          setError("Это бронирование уже оплачено");
        } else {
          setBooking(found);
        }
      })
      .catch(() => setError("Не удалось загрузить бронирование"))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handlePay = async (e) => {
    e.preventDefault();
    setPayError(null);
    setIsProcessing(true);

    try {
      // Имитация задержки обработки платежа настоящим шлюзом
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await payBooking(id);
      navigate("/my-bookings", { state: { paymentSuccess: true } });
    } catch (err) {
      setPayError(extractErrorMessage(err));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="page">
      <header className="page-header">
        <div className="page-header-top">
          <div>
            <p className="eyebrow">Event Rental Platform</p>
            <h1>Оплата бронирования</h1>
          </div>
          <Link to="/my-bookings" className="btn-auth">← К бронированиям</Link>
        </div>
      </header>

      <div className="list-section">
        {isLoading && <p className="status-message">Загрузка...</p>}
        {error && <p className="status-message status-message--error">{error}</p>}

        {!isLoading && !error && booking && (
          <form className="narrow-content" onSubmit={handlePay}>
            <div className="review-card" style={{ marginBottom: 20 }}>
              <p style={{ margin: "0 0 4px", fontWeight: 600 }}>
                Бронирование №{booking.id}
              </p>
              <p style={{ margin: 0, color: "var(--color-ink-light)", fontSize: "0.9rem" }}>
                Сумма к оплате: <strong style={{ color: "var(--color-ink)" }}>{booking.total_amount} ₽</strong>
              </p>
            </div>

            <div className="form-row">
              <label>Номер карты</label>
              <input
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="0000 0000 0000 0000"
                maxLength={19}
                required
              />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <div className="form-row" style={{ flex: 1 }}>
                <label>Срок действия</label>
                <input
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  placeholder="MM/ГГ"
                  maxLength={5}
                  required
                />
              </div>
              <div className="form-row" style={{ flex: 1 }}>
                <label>CVC</label>
                <input
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  placeholder="000"
                  maxLength={3}
                  required
                />
              </div>
            </div>

            <p style={{ fontSize: "0.8rem", color: "var(--color-ink-light)" }}>
              Это демонстрационная форма оплаты. Реальное списание средств не происходит.
            </p>

            {payError && <p className="form-error">{payError}</p>}

            <button type="submit" className="btn-book-primary" disabled={isProcessing}>
              {isProcessing ? "Обрабатываем платёж..." : `Оплатить ${booking.total_amount} ₽`}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}