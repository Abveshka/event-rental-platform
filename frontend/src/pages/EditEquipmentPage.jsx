import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getCategories } from "../api/categories";
import {
  getMyEquipment,
  updateEquipment,
  uploadEquipmentImage,
  deleteEquipmentImage,
} from "../api/equipment";
import { extractErrorMessage } from "../api/errors";
import { API_ORIGIN } from "../api/config";
import "../components/equipment/Equipment.css";

export function EditEquipmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState(null);
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newFiles, setNewFiles] = useState([]);
  const [newPreviewUrls, setNewPreviewUrls] = useState([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [photoError, setPhotoError] = useState(null);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    getMyEquipment()
      .then((items) => {
        const found = items.find((item) => String(item.id) === id);
        if (!found) {
          setLoadError("Объявление не найдено или не принадлежит вам");
          return;
        }
        setFormData({
          title: found.title,
          description: found.description,
          category: found.category || "",
          price_per_day: found.price_per_day,
          deposit: found.deposit,
          quantity: found.quantity,
          city: found.city,
          address: found.address || "",
          delivery_available: found.delivery_available,
          delivery_price: found.delivery_price,
        });
        setImages(found.images || []);
      })
      .catch(() => setLoadError("Не удалось загрузить объявление"))
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    return () => {
      newPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newPreviewUrls]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await updateEquipment(id, {
        ...formData,
        category: formData.category || null,
      });
      navigate("/my-listings");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewFilesChange = (e) => {
    const files = Array.from(e.target.files);
    setNewFiles(files);
    setNewPreviewUrls(files.map((file) => URL.createObjectURL(file)));
  };

  const handleUploadPhotos = async () => {
    if (newFiles.length === 0) return;
    setPhotoError(null);
    setIsUploadingPhotos(true);

    try {
      const hasMainAlready = images.some((img) => img.is_main);
      const results = await Promise.allSettled(
        newFiles.map((file, index) =>
          uploadEquipmentImage(id, file, !hasMainAlready && index === 0)
        )
      );

      const uploaded = results
        .filter((r) => r.status === "fulfilled")
        .map((r) => r.value);
      const failedCount = results.filter((r) => r.status === "rejected").length;

      setImages((current) => [...current, ...uploaded]);
      setNewFiles([]);
      setNewPreviewUrls([]);

      if (failedCount > 0) {
        setPhotoError(`${failedCount} из ${results.length} фото не загрузились.`);
      }
    } catch (err) {
      setPhotoError(extractErrorMessage(err));
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  const handleDeletePhoto = async (imageId) => {
    const confirmed = window.confirm("Удалить это фото?");
    if (!confirmed) return;

    try {
      await deleteEquipmentImage(imageId);
      setImages((current) => current.filter((img) => img.id !== imageId));
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
            <h1>Редактирование объявления</h1>
          </div>
          <Link to="/my-listings" className="btn-auth">← К моим объявлениям</Link>
        </div>
      </header>

      <div className="list-section">
        {isLoading && <p className="status-message">Загрузка...</p>}
        {loadError && <p className="status-message status-message--error">{loadError}</p>}

        {!isLoading && !loadError && formData && (
          <div className="narrow-content">
            <div className="form-row">
              <label>Текущие фото</label>
              {images.length === 0 && (
                <p style={{ fontSize: "0.85rem", color: "var(--color-ink-light)" }}>
                  Фото пока не добавлены
                </p>
              )}
              {images.length > 0 && (
                <div className="new-equipment-previews">
                  {images.map((img) => (
                    <div key={img.id} className="new-equipment-previews__item">
                      <img src={`${API_ORIGIN}${img.image}`} alt="" />
                      {img.is_main && (
                        <span className="new-equipment-previews__badge">Главное</span>
                      )}
                      <button
                        type="button"
                        className="btn-delete-icon"
                        style={{
                          position: "absolute",
                          top: 2,
                          right: 2,
                          background: "white",
                          borderRadius: "50%",
                          fontSize: "0.8rem",
                          padding: "2px 6px",
                        }}
                        onClick={() => handleDeletePhoto(img.id)}
                        title="Удалить фото"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-row">
              <label>Добавить фото</label>
              <input type="file" accept="image/*" multiple onChange={handleNewFilesChange} />
            </div>

            {newPreviewUrls.length > 0 && (
              <>
                <div className="new-equipment-previews">
                  {newPreviewUrls.map((url) => (
                    <div key={url} className="new-equipment-previews__item">
                      <img src={url} alt="" />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn-auth"
                  onClick={handleUploadPhotos}
                  disabled={isUploadingPhotos}
                  style={{ marginBottom: 16 }}
                >
                  {isUploadingPhotos ? "Загружаем..." : "Загрузить выбранные фото"}
                </button>
              </>
            )}

            {photoError && <p className="form-error">{photoError}</p>}

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <label>Название</label>
                <input name="title" value={formData.title} onChange={handleChange} required />
              </div>

              <div className="form-row">
                <label>Описание</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  required
                />
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
                <input
                  type="number"
                  name="price_per_day"
                  value={formData.price_per_day}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row">
                <label>Залог (₽)</label>
                <input type="number" name="deposit" value={formData.deposit} onChange={handleChange} />
              </div>

              <div className="form-row">
                <label>Количество</label>
                <input
                  type="number"
                  min="1"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                />
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
                  <input
                    type="number"
                    name="delivery_price"
                    value={formData.delivery_price}
                    onChange={handleChange}
                  />
                </div>
              )}

              {error && <p className="form-error">{error}</p>}

              <button type="submit" className="btn-book-primary" disabled={isSubmitting}>
                {isSubmitting ? "Сохраняем..." : "Сохранить изменения"}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}