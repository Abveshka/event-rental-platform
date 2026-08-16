import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCurrentUser, updateProfile } from "../api/auth";
import { extractErrorMessage } from "../api/errors";

export function ProfilePage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);

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

  // Признак того, что профиль уже когда-то заполняли
  const isProfileFilled = (data) => Boolean(data?.company_name && data.company_name.trim());

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
        // Если данных ещё нет — сразу открываем форму заполнения
        setIsEditing(!isProfileFilled(data));
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
      setIsEditing(false); // после сохранения возвращаемся в режим просмотра
    } catch (err) {
      setSaveError(extractErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // откатываем несохранённые изменения формы к текущим данным юзера
    setFormData({
      company_name: user.company_name || "",
      description: user.description || "",
      specialties: user.specialties || "",
      city: user.city || "",
      phone: user.phone || "",
    });
    setSaveError(null);
    setIsEditing(false);
  };

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/";
  }

  const specialtiesList = (user?.specialties || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

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
          <div className="profile-hero" style={{ position: "relative" }}>
            {!isEditing && (
              <button
                type="button"
                className="btn-auth"
                onClick={() => setIsEditing(true)}
                style={{ position: "absolute", top: 16, right: 16 }}
              >
                Редактировать
              </button>
            )}

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

          {/* Режим просмотра — показываем заполненные данные, как на публичной странице поставщика */}
          {!isEditing && (
            <div className="equipment-detail-specs-column" style={{ marginTop: 24 }}>
              <ul className="equipment-detail-specs">
                <li><span>Город</span><span>{user.city || "Не указан"}</span></li>
                <li><span>Телефон</span><span>{user.phone || "Не указан"}</span></li>
              </ul>

              {user.description && (
                <div style={{ marginTop: 16 }}>
                  <h3>О компании</h3>
                  <p>{user.description}</p>
                </div>
              )}

              {specialtiesList.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
                  {specialtiesList.map((tag) => (
                    <span
                      key={tag}
                      className="equipment-card-tag__eyebrow"
                      style={{
                        background: "#fdf2ee",
                        color: "var(--color-coral)",
                        padding: "4px 12px",
                        borderRadius: 12,
                        margin: 0,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {saveSuccess && <p className="booking-panel__success" style={{ marginTop: 16 }}>Профиль обновлён</p>}
            </div>
          )}

          {/* Режим редактирования — та же форма, что была раньше, но с кнопкой отмены */}
          {isEditing && (
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

              <div style={{ display: "flex", gap: 12 }}>
                <button type="submit" className="btn-book-primary" disabled={isSaving}>
                  {isSaving ? "Сохраняем..." : "Сохранить"}
                </button>
                {isProfileFilled(user) && (
                  <button
                    type="button"
                    className="btn-auth"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    Отмена
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      )}
    </main>
  );
}