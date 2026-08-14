import { API_ORIGIN } from "../../api/config";

export function EquipmentCard({ item, onClick }) {
  const images = item.images && item.images.length > 0 ? item.images : [];
  const mainImage = images.find((img) => img.is_main) || images[0];
  const imageUrl = mainImage ? `${API_ORIGIN}${mainImage.image}` : null;

  return (
    <article
      className="equipment-card-tag"
      onClick={() => onClick(item)}
    >
      <div className="equipment-card-tag__notch" />

      <div className="equipment-card-tag__image">
        {imageUrl ? (
          <img src={imageUrl} alt={item.title} />
        ) : (
          <span>Фото товара</span>
        )}
      </div>

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
    </article>
  );
}