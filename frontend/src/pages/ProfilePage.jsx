import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCurrentUser, updateProfile } from "../api/auth";
import { extractErrorMessage } from "../api/errors";
import "../components/equipment/Equipment.css";

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

      <div className="list-section">
        {isLoading && <p className="status-message">Загрузка...</p>}
        {error && <p className="status-message status-message--error">{error}</p>}

        {!isLoading && !error && user && (
          <>
            <div className="equipment-card-tag" style={{ maxWidth: 400, marginBottom: 24 }}>
              <div className="equipment-card-tag__body">
                <h2 className="equipment-card-tag__title">{user.username}</h2>
                <p><strong>Email:</strong> {user.email || "Не указан"}</p>
                <p><strong>Дата регистрации:</strong> {new Date(user.date_joined).toLocaleDateString("ru-RU")}</p>

                <Link to="/my-bookings" className="btn-auth" style={{ marginTop: 16, display: "inline-block" }}>
                  Мои бронирования
                </Link>
                <button className="btn-auth" onClick={handleLogout} style={{ marginTop: 16, marginLeft: 8 }}>
                  Выйти
                </button>
              </div>
            </div>

            <form className="equipment-card-tag" onSubmit={handleSave} style={{ maxWidth: 500 }}>
              <div className="equipment-card-tag__body">
                <h2 className="equipment-card-tag__title" style={{ marginBottom: 16 }}>О компании</h2>

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

                <div className="form-row">
                  <label>Город</label>
                  <input name="city" value={formData.city} onChange={handleChange} />
                </div>

                <div className="form-row">
                  <label>Телефон</label>
                  <input name="phone" value={formData.phone} onChange={handleChange} />
                </div>

                {saveError && <p className="form-error">{saveError}</p>}
                {saveSuccess && <p className="booking-panel__success">Профиль обновлён</p>}

                <button type="submit" className="btn-book-primary" disabled={isSaving}>
                  {isSaving ? "Сохраняем..." : "Сохранить"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </main>
  );
}