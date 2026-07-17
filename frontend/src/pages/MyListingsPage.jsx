import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyEquipment } from "../api/equipment";
import "../components/equipment/Equipment.css";

export function MyListingsPage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyEquipment()
      .then(setItems)
      .catch(() => setError("Не удалось загрузить объявления"))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <main className="page">
      <header className="page-header">
        <div className="page-header-top">
          <div>
            <p className="eyebrow">Event Rental Platform</p>
            <h1>Мои объявления</h1>
          </div>
          <div className="page-header-auth">
            <Link to="/my-listings/new" className="btn-auth">+ Добавить объявление</Link>
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
              <div className="equipment-card-tag" key={item.id}>
                <div className="equipment-card-tag__body">
                  <p className="equipment-card-tag__eyebrow">
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