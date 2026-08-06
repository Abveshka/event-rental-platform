import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getMyBookings, getIncomingBookings } from "../api/bookings";
import { getMessages, sendMessage } from "../api/messages";
import { BOOKING_STATUS_LABELS } from "../constants/bookingStatuses.js";

export function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Ищем бронь либо среди своих, либо среди входящих — раз мы не знаем заранее, кто смотрит
  useEffect(() => {
    Promise.all([getMyBookings(), getIncomingBookings()])
      .then(([mine, incoming]) => {
        const found = [...mine, ...incoming].find((b) => String(b.id) === id);
        if (!found) {
          setError("Бронирование не найдено или у вас нет к нему доступа");
        } else {
          setBooking(found);
        }
      })
      .catch(() => setError("Не удалось загрузить бронирование"))
      .finally(() => setIsLoading(false));
  }, [id]);

  // Опрос сообщений каждые 4 секунды, пока страница открыта
  useEffect(() => {
    if (!booking) return;

    const fetchMessages = () => {
      getMessages(id)
        .then(setMessages)
        .catch(() => {});
    };

    fetchMessages();
    const intervalId = setInterval(fetchMessages, 4000);

    return () => clearInterval(intervalId);
  }, [id, booking]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      const sent = await sendMessage(id, newMessage.trim());
      setMessages((current) => [...current, sent]);
      setNewMessage("");
    } catch (err) {
      alert("Не удалось отправить сообщение");
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <main className="page">
        <p className="status-message">Загрузка...</p>
      </main>
    );
  }

  if (error || !booking) {
    return (
      <main className="page">
        <p className="status-message status-message--error">
          {error || "Бронирование не найдено"}
        </p>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="page-header">
        <div className="page-header-top">
          <div>
            <p className="eyebrow">Event Rental Platform</p>
            <h1>Бронирование №{booking.id}</h1>
          </div>
          <button className="btn-auth" onClick={() => navigate(-1)}>← Назад</button>
        </div>
      </header>

      <div className="narrow-content" style={{ maxWidth: 640 }}>
        <div className="equipment-detail-specs-column" style={{ marginBottom: 20 }}>
          <ul className="equipment-detail-specs">
            <li><span>Статус</span><span>{BOOKING_STATUS_LABELS[booking.status] || booking.status}</span></li>
            <li><span>Сумма</span><span>{booking.total_amount} ₽</span></li>
            {booking.status === "confirmed" && (
              <li><span>Оплата</span><span>{booking.is_paid ? "Оплачено" : "Не оплачено"}</span></li>
            )}
          </ul>
          <ul className="equipment-detail-specs" style={{ marginTop: 8 }}>
            {booking.items.map((item) => (
              <li key={item.id}>
                <span>{item.equipment_title}</span>
                <span>{item.quantity} шт. · {item.start_date} → {item.end_date}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="equipment-detail-specs-column">
          <h3>Переписка</h3>

          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            maxHeight: 360,
            overflowY: "auto",
            marginBottom: 16,
            paddingRight: 4,
          }}>
            {messages.length === 0 && (
              <p className="reviews-placeholder">
                Сообщений пока нет — напишите первым
              </p>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.is_mine ? "flex-end" : "flex-start",
                  maxWidth: "75%",
                  background: msg.is_mine ? "var(--color-teal)" : "var(--color-paper)",
                  color: msg.is_mine ? "white" : "var(--color-ink)",
                  border: msg.is_mine ? "none" : "1px solid var(--color-border)",
                  borderRadius: msg.is_mine ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                  padding: "8px 12px",
                }}
              >
                <p style={{
                  margin: 0,
                  fontSize: "0.9rem",
                  color: msg.is_mine ? "white" : "var(--color-ink)",
                }}>
                  {msg.text}
                </p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} style={{ display: "flex", gap: 8 }}>
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Напишите сообщение..."
              style={{
                flex: 1,
                padding: "9px 12px",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontFamily: "var(--font-body)",
              }}
            />
            <button type="submit" className="btn-auth" disabled={isSending}>
              {isSending ? "..." : "Отправить"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}