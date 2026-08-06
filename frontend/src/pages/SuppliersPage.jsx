import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { getSuppliers } from "../api/suppliers";
import { StarRating } from "../components/reviews/StarRating";

export function SuppliersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const filters = {
    city: searchParams.get("city") || "",
    specialization: searchParams.get("specialization") || "",
  };

  useEffect(() => {
    setIsLoading(true);
    setError("");

    getSuppliers({
      city: searchParams.get("city") || "",
      specialization: searchParams.get("specialization") || "",
    })
      .then(setSuppliers)
      .catch(() => setError("Не удалось загрузить поставщиков"))
      .finally(() => setIsLoading(false));
  }, [searchParams.toString()]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (value === "") {
        params.delete(name);
      } else {
        params.set(name, value);
      }
      return params;
    });
  };

  const handleReset = () => setSearchParams({});

  return (
    <main className="page">
      <header className="page-header">
        <div className="page-header-top">
          <div>
            <p className="eyebrow">Event Rental Platform</p>
            <h1>Поставщики</h1>
          </div>
          <Link to="/" className="btn-auth">← К каталогу оборудования</Link>
        </div>
      </header>

      <form className="equipment-filters">
        <label>
          <span>Город</span>
          <input
            type="search"
            name="city"
            value={filters.city}
            onChange={handleFilterChange}
            placeholder="Например, Москва"
          />
        </label>

        <label>
          <span>Специализация</span>
          <input
            type="search"
            name="specialization"
            value={filters.specialization}
            onChange={handleFilterChange}
            placeholder="Свадьбы, свет, декор..."
          />
        </label>

        <button type="button" onClick={handleReset}>Сбросить</button>
      </form>

      <div className="list-section">
        {isLoading && <p className="status-message">Загрузка...</p>}
        {error && <p className="status-message status-message--error">{error}</p>}

        {!isLoading && !error && suppliers.length === 0 && (
          <p className="status-message">Поставщики по таким фильтрам не найдены</p>
        )}

        {!isLoading && !error && suppliers.length > 0 && (
          <div className="equipment-grid">
            {suppliers.map((supplier) => (
              <div
                className="equipment-card-tag"
                key={supplier.id}
                onClick={() => navigate(`/suppliers/${supplier.id}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="equipment-card-tag__body">
                  <p className="equipment-card-tag__eyebrow">
                    {supplier.city || "Город не указан"}
                  </p>
                  <h2 className="equipment-card-tag__title">{supplier.display_name}</h2>

                  {supplier.specialties_list.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                      {supplier.specialties_list.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          style={{
                            background: "#fdf2ee",
                            color: "var(--color-coral)",
                            fontSize: "0.7rem",
                            padding: "3px 10px",
                            borderRadius: 10,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="equipment-card-tag__footer">
                    <span className="equipment-card-tag__price">
                      {supplier.rating > 0 ? (
                        <>
                          {supplier.rating} <StarRating value={supplier.rating} />
                        </>
                      ) : (
                        "Нет оценок"
                      )}
                    </span>
                    <span className="equipment-card-tag__stock">
                      {supplier.listings_count} объявлени{supplier.listings_count === 1 ? "е" : "й"}
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
