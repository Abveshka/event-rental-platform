import React, { useEffect } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { useState } from "react";
import { getCategories } from "../api/categories";
import { getEquipment } from "../api/equipment";
import { EquipmentFilters } from "../components/equipment/EquipmentFilters";
import { EquipmentList } from "../components/equipment/EquipmentList";
import { EquipmentDetail } from "../components/equipment/EquipmentDetail.jsx";
import { AuthPanel } from "../components/auth/AuthPanel";

export function EquipmentPage() {
  const { idSlug } = useParams();
  const id = idSlug?.split("-")[0];
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [equipment, setEquipment] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => !!localStorage.getItem("access_token")
  );

  // Фильтры читаем прямо из URL — отдельного useState для них больше нет
  const filters = {
    city: (searchParams.get("city") || "").trim(),
    category: searchParams.get("category") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    delivery: searchParams.get("delivery") === "true",
  };

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(data))
      .catch(() => setError("Не удалось загрузить категории"));
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setError("");

    const currentFilters = {
      city: (searchParams.get("city") || "").trim(),
      category: searchParams.get("category") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      delivery: searchParams.get("delivery") === "true",
    };

    getEquipment(currentFilters)
      .then((data) => setEquipment(data))
      .catch(() => setError("Не удалось загрузить оборудование"))
      .finally(() => setIsLoading(false));
  }, [searchParams.toString()]);

  useEffect(() => {
    const handleAuthExpired = () => setIsLoggedIn(false);
    window.addEventListener("auth-expired", handleAuthExpired);
    return () => window.removeEventListener("auth-expired", handleAuthExpired);
  }, []);

  function handleFilterChange(event) {
    const { name, value, type, checked } = event.target;
    const newValue = type === "checkbox" ? checked : value;

    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (newValue === "" || newValue === false) {
        params.delete(name);
      } else {
        params.set(name, newValue);
      }
      return params;
    });
  }

  function handleResetFilters() {
    setSearchParams({});
  }


  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setIsLoggedIn(false);
  }

  const selectedItem = id
      ? equipment.find((item) => String(item.id) === id) || null
      : null;

  const SCROLL_KEY = "equipment-catalog-scroll";

// Сохраняем при клике на карточку
  const handleCardClick = (item) => {
    sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
    navigate(`/equipment/${item.id}-${item.slug}?${searchParams.toString()}`);
  };

// useEffect для скролла
  useEffect(() => {
    if (selectedItem) {
      requestAnimationFrame(() => {
        document.querySelector(".detail-section")?.scrollIntoView({
          behavior: "instant",
          block: "start",
        });
      });
    } else {
      const saved = sessionStorage.getItem(SCROLL_KEY);
      if (saved !== null) {
        requestAnimationFrame(() => {
          window.scrollTo({
            top: Number(saved),
            behavior: "instant",
          });
        });
        // по желанию можно сразу очистить
        // sessionStorage.removeItem(SCROLL_KEY);
      }
    }
  }, [selectedItem]);

  return (
    <main className="page">
      <header className="page-header">
        <div className="page-header-top">
          <div>
            <p className="eyebrow">Event Rental Platform</p>
            <h1>Оборудование для мероприятий</h1>
          </div>

          <div className="page-header-auth">
            {isLoggedIn ? (
              <>
                <Link to="/profile" className="btn-auth">Профиль</Link>
                <Link to="/my-listings" className="btn-auth">Мои объявления</Link>
                <Link to="/my-bookings" className="btn-auth">Мои бронирования</Link>
                <Link to="/incoming-bookings" className="btn-auth">Входящие брони</Link>
                <Link to="/suppliers" className="btn-auth">Поставщики</Link>
                <button className="btn-auth" onClick={handleLogout}>Выйти</button>
              </>
            ) : (
              <button className="btn-auth" onClick={() => setIsAuthOpen(true)}>
                Войти / Регистрация
              </button>
            )}
          </div>
        </div>
      </header>

      <EquipmentFilters
        categories={categories}
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      <div className="equipment-container">
        {selectedItem && (
          <div className="detail-section">
            <EquipmentDetail
              item={selectedItem}
              onClose={() => navigate(`/?${searchParams.toString()}`)}
              isLoggedIn={isLoggedIn}
              onRequireAuth={() => setIsAuthOpen(true)}
            />
          </div>
        )}

        <div className="list-section">
          {isLoading && <p className="status-message">Загрузка...</p>}
          {error && <p className="status-message status-message--error">{error}</p>}

          {!isLoading && !error && (
            <EquipmentList
              equipment={equipment}
              onCardClick={handleCardClick}
              selectedId={selectedItem?.id}
            />
          )}
        </div>
      </div>

      <AuthPanel
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={() => setIsLoggedIn(true)}
      />
    </main>
  );
}