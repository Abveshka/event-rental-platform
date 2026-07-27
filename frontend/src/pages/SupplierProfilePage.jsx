import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getSupplierProfile } from "../api/suppliers";
import { getEquipment } from "../api/equipment";
import { getSupplierReviews } from "../api/reviews";
import "../components/equipment/Equipment.css";

export function SupplierProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [listings, setListings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsLoading(true);
    setError("");

    Promise.all([
      getSupplierProfile(id),
      getEquipment({ supplier: id }),
      getSupplierReviews(id),
    ])
      .then(([supplierData, equipmentData, reviewsData]) => {
        setSupplier(supplierData);
        setListings(equipmentData);
        setReviews(reviewsData);
      })
      .catch(() => setError("Не удалось загрузить профиль поставщика"))
      .finally(() => setIsLoading(false));
  }, [id]);

  const renderStars = (rating) => {
    const full = Math.round(rating);
    return "★".repeat(full) + "☆".repeat(5 - full);
  };

  if (isLoading) {
    return (
      <main className="page">
        <p className="status-message">Загрузка...</p>
      </main>
    );
  }

  if (error || !supplier) {
    return (
      <main className="page">
        <p className="status-message status-message--error">
          {error || "Поставщик не найден"}
        </p>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="page-header">
        <div className="page-header-top">
          <div>
            <p className="eyebrow">Профиль поставщика</p>
            <h1>{supplier.display_name}</h1>
          </div>
          <Link to="/" className="btn-auth">← К каталогу</Link>
        </div>
      </header>

      <div className="equipment-detail-specs-column" style={{ marginBottom: 24 }}>
        <ul className="equipment-detail-specs">
          <li><span>Город</span><span>{supplier.city || "Не указан"}</span></li>
          <li>
            <span>Рейтинг</span>
            <span>{supplier.rating > 0 ? `${supplier.rating} ${renderStars(supplier.rating)}` : "Пока нет оценок"}</span>
          </li>
          <li><span>Активных объявлений</span><span>{listings.length}</span></li>
        </ul>
      </div>

      {supplier.description && (
        <div className="equipment-detail-specs-column" style={{ marginBottom: 24 }}>
          <h3>О компании</h3>
          <p>{supplier.description}</p>
        </div>
      )}

      {supplier.specialties_list && supplier.specialties_list.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          {supplier.specialties_list.map((tag) => (
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

      <div className="list-section" style={{ marginBottom: 24 }}>
        <h3 style={{ fontFamily: "var(--font-display)", marginBottom: 16 }}>
          Объявления поставщика
        </h3>

        {listings.length === 0 && (
          <p className="status-message">У этого поставщика пока нет активных объявлений</p>
        )}

        {listings.length > 0 && (
          <div className="equipment-grid">
            {listings.map((item) => (
              <div
                className="equipment-card-tag"
                key={item.id}
                onClick={() => navigate(`/equipment/${item.id}-${item.slug}`)}
                style={{ cursor: "pointer" }}
              >
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
                      {item.available_quantity} шт свободно
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="equipment-detail-reviews">
        <h3>Отзывы</h3>

        {reviews.length === 0 && (
          <p className="reviews-placeholder">У этого поставщика пока нет отзывов</p>
        )}

        {reviews.length > 0 && (
          <div className="reviews-list">
            {reviews.map((review) => (
              <div className="review-card" key={review.id}>
                <div className="review-card__header">
                  <span className="review-card__author">{review.reviewer}</span>
                  <span className="review-card__stars">{renderStars(review.rating)}</span>
                </div>
                {review.comment && <p className="review-card__comment">{review.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}