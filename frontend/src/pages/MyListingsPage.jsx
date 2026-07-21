import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMyEquipment, deleteEquipment, toggleEquipmentActive } from "../api/equipment";
import { extractErrorMessage } from "../api/errors";
import "../components/equipment/Equipment.css";

export function MyListingsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyEquipment()
      .then(setItems)
      .catch(() => setError("Не удалось загрузить объявления"))
      .finally(() => setIsLoading(false));
  }, []);

  const handleCardClick = (item) => {
    navigate(`/equipment/${item.id}-${item.slug}`);
  };

  const handleDelete = async (itemId) => {
    const confirmed = window.confirm(
      "Вы уверены, что хотите удалить это объявление? Это действие необратимо."
    );
    if (!confirmed) return;

    try {
      const result = await deleteEquipment(itemId);

      if (result && result.hidden) {
        // Не удалено, а скрыто — обновляем товар в списке, не убирая его
        setItems((current) =>
          current.map((item) => (item.id === itemId ? result.equipment : item))
        );
        alert(result.detail);
      } else {
        // Настоящее удаление — убираем из списка
        setItems((current) => current.filter((item) => item.id !== itemId));
      }
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  };

  const handleToggleActive = async (itemId) => {
    try {
      const updated = await toggleEquipmentActive(itemId);
      setItems((current) =>
        current.map((item) => (item.id === itemId ? updated : item))
      );
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  };

  return (
    <main className="page">
      <header className="page-header">
        <div className="page-header-top">
          <div>
            <p className="eyebrow">Event Rental Platform</p>
            <h1>Мои объявления</h1>
          </div>
          <div className="page-header-auth">
            <Link to="/my-listings/new" className="btn-auth">Создать объявление</Link>
            <Link to="/" className="btn-auth">← К каталогу</Link>
          </div>
        </div>
      </header>

      <div className="list-section">
        {isLoading && <p className="status-message">Загрузка...</p>}
        {error && <p className="status-message status-message--error">{error}</p>}

        {!isLoading && !error && items.length === 0 && (
          <p className="status-message">У вас пока нет объявлений</p>
        )}

        {!isLoading && !error && items.length > 0 && (
          <div className="equipment-grid">
            {items.map((item) => (
              <div
                className="equipment-card-tag"
                key={item.id}
                onClick={() => handleCardClick(item)}
                style={{ cursor: "pointer" }}
              >
                <div className="equipment-card-tag__icons">
                  <button
                    className="btn-delete-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleActive(item.id);
                    }}
                    title={item.is_active ? "Скрыть объявление" : "Вернуть в каталог"}
                  >
                    {item.is_active ? "👁️" : "🔁"}
                  </button>
                  <button
                    className="btn-delete-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    title="Удалить объявление"
                  >
                    🗑️
                  </button>
                </div>

                <div className="equipment-card-tag__body">
                  <p className="equipment-card-tag__eyebrow">
                    {!item.is_active && (
                      <strong style={{ color: "var(--color-coral)" }}>Скрыто · </strong>
                    )}
                    {item.category_name || "Без категории"} · {item.city}
                  </p>
                  <h2 className="equipment-card-tag__title">{item.title}</h2>
                  <div className="equipment-card-tag__footer">
                    <span className="equipment-card-tag__price">
                      {item.price_per_day} ₽<span> / день</span>
                    </span>
                    <span className="equipment-card-tag__stock">
                      {item.images.length} фото
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}