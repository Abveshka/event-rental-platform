import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCategories } from "../api/categories";
import { createEquipment } from "../api/equipment";
import { uploadEquipmentImage } from "../api/equipment";
import { extractErrorMessage } from "../api/errors";
import "../components/equipment/Equipment.css";

export function NewEquipmentPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    price_per_day: "",
    deposit: "0",
    quantity: "1",
    city: "",
    address: "",
    delivery_available: false,
    delivery_price: "0",
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  // Очищаем object URL превьюшек при размонтировании, чтобы не текла память
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    setPreviewUrls(files.map((file) => URL.createObjectURL(file)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    setUploadStatus("");

    try {
      const created = await createEquipment({
        ...formData,
        category: formData.category || null,
        available_quantity: formData.quantity,
      });

      if (selectedFiles.length > 0) {
        setUploadStatus("Загружаем фото...");
        const uploadResults = await Promise.allSettled(
          selectedFiles.map((file, index) =>
            uploadEquipmentImage(created.id, file, index === 0)
          )
        );

        const failedCount = uploadResults.filter((r) => r.status === "rejected").length;
        if (failedCount > 0) {
          setUploadStatus(
            `Объявление создано, но ${failedCount} из ${selectedFiles.length} фото не загрузились.`
          );
          setTimeout(() => navigate("/my-listings"), 2000);
          return;
        }
      }

      navigate("/my-listings");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page">
      <header className="page-header">
        <div className="page-header-top">
          <div>
            <p className="eyebrow">Event Rental Platform</p>
            <h1>Новое объявление</h1>
          </div>
        </div>
      </header>

      <form className="list-section" onSubmit={handleSubmit} style={{ maxWidth: 500 }}>
        <div className="form-row">
          <label>Название</label>
          <input name="title" value={formData.title} onChange={handleChange} required />
        </div>

        <div className="form-row">
          <label>Описание</label>
          <textarea name="description" value={formData.description} onChange={handleChange} rows="4" required />
        </div>

        <div className="form-row">
          <label>Категория</label>
          <select name="category" value={formData.category} onChange={handleChange}>
            <option value="">Без категории</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label>Цена за день (₽)</label>
          <input type="number" name="price_per_day" value={formData.price_per_day} onChange={handleChange} required />
        </div>

        <div className="form-row">
          <label>Залог (₽)</label>
          <input type="number" name="deposit" value={formData.deposit} onChange={handleChange} />
        </div>

        <div className="form-row">
          <label>Количество</label>
          <input type="number" min="1" name="quantity" value={formData.quantity} onChange={handleChange} required />
        </div>

        <div className="form-row">
          <label>Город</label>
          <input name="city" value={formData.city} onChange={handleChange} required />
        </div>

        <div className="form-row">
          <label>Адрес</label>
          <input name="address" value={formData.address} onChange={handleChange} />
        </div>

        <div className="form-row">
          <label>
            <input
              type="checkbox"
              name="delivery_available"
              checked={formData.delivery_available}
              onChange={handleChange}
              style={{ width: "auto", marginRight: 8 }}
            />
            Доставка доступна
          </label>
        </div>

        {formData.delivery_available && (
          <div className="form-row">
            <label>Цена доставки (₽)</label>
            <input type="number" name="delivery_price" value={formData.delivery_price} onChange={handleChange} />
          </div>
        )}

        <div className="form-row">
          <label>Фотографии (первая станет главной)</label>
          <input type="file" accept="image/*" multiple onChange={handleFilesChange} />
        </div>

        {previewUrls.length > 0 && (
          <div className="new-equipment-previews">
            {previewUrls.map((url, index) => (
              <div key={url} className="new-equipment-previews__item">
                <img src={url} alt={`Превью ${index + 1}`} />
                {index === 0 && <span className="new-equipment-previews__badge">Главное</span>}
              </div>
            ))}
          </div>
        )}

        {error && <p className="form-error">{error}</p>}
        {uploadStatus && <p className="booking-panel__success">{uploadStatus}</p>}

        <button type="submit" className="btn-book-primary" disabled={isSubmitting}>
          {isSubmitting ? "Публикуем..." : "Опубликовать объявление"}
        </button>
      </form>
    </main>
  );
}