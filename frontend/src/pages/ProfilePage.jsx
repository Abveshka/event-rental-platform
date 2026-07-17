import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCurrentUser } from "../api/auth";
import "../components/equipment/Equipment.css";

export function ProfilePage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setError("Не удалось загрузить профиль"))
      .finally(() => setIsLoading(false));
  }, []);

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/";
  }

  return (
    <main className="page">
      <header className="page-header">
        <div className="page-header-top">
          <div>
            <p className="eyebrow">Event Rental Platform</p>
            <h1>Профиль</h1>
          </div>
          <Link to="/" className="btn-auth">← К каталогу</Link>
        </div>
      </header>

      <div className="list-section">
        {isLoading && <p className="status-message">Загрузка...</p>}
        {error && <p className="status-message status-message--error">{error}</p>}

        {!isLoading && !error && user && (
          <div className="equipment-card" style={{ maxWidth: 400 }}>
            <h2>{user.username}</h2>
            <p><strong>Email:</strong> {user.email || "Не указан"}</p>
            <p><strong>Дата регистрации:</strong> {new Date(user.date_joined).toLocaleDateString("ru-RU")}</p>

            <Link to="/my-bookings" className="btn-auth" style={{ marginTop: 16, display: "inline-block" }}>
              Мои бронирования
            </Link>

            <button className="btn-auth" onClick={handleLogout} style={{ marginTop: 16, marginLeft: 8 }}>
              Выйти
            </button>
          </div>
        )}
      </div>
    </main>
  );
}