import { useEffect, useState } from "react";
import { BookingPanel } from "./BookingPanel";
import { API_ORIGIN } from "../../api/config";
import { getSupplierReviews } from "../../api/reviews";
import { Link } from "react-router-dom";
import { StarRating } from "../reviews/StarRating";

export function EquipmentDetail({ item, onClose, isLoggedIn, onRequireAuth }) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (!item) return;
    getSupplierReviews(item.supplier).then(setReviews).catch(() => setReviews([]));
  }, [item?.supplier]);

  const images = item.images && item.images.length > 0 ? item.images : [];
  const activeImage = images[activeImageIndex];
  const activeImageUrl = activeImage ? `${API_ORIGIN}${activeImage.image}` : null;

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="equipment-detail-page">
      <button className="detail-back" onClick={onClose}>← Назад к каталогу</button>

      <div className="equipment-detail-main">
        <div className="equipment-detail-gallery">
          <div className="equipment-detail-gallery__main">
            {activeImageUrl ? (
              <img src={activeImageUrl} alt={item.title} />
            ) : (
              <div className="equipment-detail-gallery__placeholder">Фото товара</div>
            )}
          </div>

          {images.length > 1 && (
            <div className="detail-thumbnails">
              {images.map((img, index) => (
                <button
                  key={img.id}
                  className={index === activeImageIndex ? "thumbnail-btn active" : "thumbnail-btn"}
                  onClick={() => setActiveImageIndex(index)}
                >
                  <img src={`${API_ORIGIN}${img.image}`} alt={`${item.title} ${index + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="equipment-detail-specs-column">
          <section>
            <h3>Описание</h3>
            <p>{item.description || "Подробное описание товара отсутствует."}</p>
          </section>

          <section>
            <h3>Характеристики</h3>
            <ul className="equipment-detail-specs">
              <li>
                <span>Поставщик</span>
                <Link to={`/suppliers/${item.supplier}`}>{item.supplier_name}</Link>
              </li>
              <li><span>Город</span><span>{item.city}</span></li>
              <li><span>Адрес</span><span>{item.address || "Не указан"}</span></li>
              <li><span>Категория</span><span>{item.category_name || "Не указана"}</span></li>
              <li><span>Доступное количество</span><span>{item.available_quantity} шт.</span></li>
              <li><span>Доставка</span><span>{item.delivery_available ? "Доступна" : "Не доступна"}</span></li>
              <li><span>Залог</span><span>{item.deposit > 0 ? `${item.deposit} ₽` : "Не требуется"}</span></li>
            </ul>
          </section>
        </div>

        <aside className="equipment-detail-info">
          <p className="equipment-detail-info__eyebrow">
            {item.category_name || "Без категории"} · {item.city}
          </p>
          <h1 className="equipment-detail-info__title">{item.title}</h1>

          <div className="equipment-detail-info__price-block">
            <span className="equipment-detail-info__price">
              {item.price_per_day} ₽<span> / день</span>
            </span>
            <span className="equipment-detail-info__stock">
              {item.available_quantity} шт свободно
            </span>
          </div>

          <BookingPanel item={item} isLoggedIn={isLoggedIn} onRequireAuth={onRequireAuth} />
        </aside>
      </div>

      <div className="equipment-detail-reviews">
        <h3>Отзывы о поставщике {item.supplier_name}</h3>

        <div className="reviews-summary-card">
          <div className="reviews-summary-card__score">{averageRating || "—"}</div>
          <div className="reviews-summary-card__stars">
            <StarRating value={averageRating || 0} />
          </div>
          <p className="reviews-summary-card__count">
            {reviews.length > 0 ? `${reviews.length} отзыв(ов)` : "Пока нет отзывов"}
          </p>
        </div>

        {reviews.length === 0 && (
          <p className="reviews-placeholder">
            Станьте первым, кто оставит отзыв после аренды у этого поставщика!
          </p>
        )}

        {reviews.length > 0 && (
          <div className="reviews-list">
            {reviews.map((review) => (
              <div className="review-card" key={review.id}>
                <div className="review-card__header">
                  <span className="review-card__author">{review.reviewer}</span>
                  <span className="review-card__stars">
                    <StarRating value={review.rating} />
                  </span>
                </div>
                {review.comment && <p className="review-card__comment">{review.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
