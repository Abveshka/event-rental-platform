import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCurrentUser, updateProfile } from "../api/auth";
import { extractErrorMessage } from "../api/errors";

export function ProfilePage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    company_name: "",
    description: "",
    specialties: "",
    city: "",
    phone: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then((data) => {
        setUser(data);
        setFormData({
          company_name: data.company_name || "",
          description: data.description || "",
          specialties: data.specialties || "",
          city: data.city || "",
          phone: data.phone || "",
        });
      })
      .catch(() => setError("Не удалось загрузить профиль"))
      .finally(() => setIsLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);
    setIsSaving(true);

    try {
      const updated = await updateProfile(formData);
      setUser(updated);
      setSaveSuccess(true);
    } catch (err) {
      setSaveError(extractErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

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

      {isLoading && <p className="status-message">Загрузка...</p>}
      {error && <p className="status-message status-message--error">{error}</p>}

      {!isLoading && !error && user && (
        <div className="narrow-content" style={{ maxWidth: 560 }}>
          <div className="profile-hero">
            <p className="profile-hero__eyebrow">Аккаунт</p>
            <h2 className="profile-hero__title">{user.company_name || user.username}</h2>

            <div className="profile-hero__meta">
              <div className="profile-hero__meta-item">
                <span className="profile-hero__meta-label">Email</span>
                <span className="profile-hero__meta-value">{user.email || "Не указан"}</span>
              </div>
              <div className="profile-hero__meta-item">
                <span className="profile-hero__meta-label">На платформе с</span>
                <span className="profile-hero__meta-value">
                  {new Date(user.date_joined).toLocaleDateString("ru-RU")}
                </span>
              </div>
            </div>

            <div className="profile-hero__actions">
              <Link to="/my-bookings" className="btn-auth">Мои бронирования</Link>
              <Link to="/my-listings" className="btn-auth">Мои объявления</Link>
              <button className="btn-auth" onClick={handleLogout}>Выйти</button>
            </div>
          </div>

          <form className="profile-form-card" onSubmit={handleSave}>
            <h2>О компании</h2>
            <p className="profile-form-card__hint">
              Эта информация видна другим пользователям на вашей публичной странице
            </p>

            <div className="form-row">
              <label>Название компании</label>
              <input
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                placeholder="Если вы поставщик оборудования"
              />
            </div>

            <div className="form-row">
              <label>О компании</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="Расскажите о вашем опыте, подходе к работе"
              />
            </div>

            <div className="form-row">
              <label>Специализация (через запятую)</label>
              <input
                name="specialties"
                value={formData.specialties}
                onChange={handleChange}
                placeholder="Свадьбы, Корпоративы, Свет и звук"
              />
            </div>

            <div className="profile-form__grid">
              <div className="form-row">
                <label>Город</label>
                <input name="city" value={formData.city} onChange={handleChange} />
              </div>

              <div className="form-row">
                <label>Телефон</label>
                <input name="phone" value={formData.phone} onChange={handleChange} />
              </div>
            </div>

            {saveError && <p className="form-error">{saveError}</p>}
            {saveSuccess && <p className="booking-panel__success">Профиль обновлён</p>}

            <button type="submit" className="btn-book-primary" disabled={isSaving}>
              {isSaving ? "Сохраняем..." : "Сохранить"}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}