export function EquipmentFilters({ categories, filters, onChange, onReset }) {
  return (
    <form className="equipment-filters">
      <label>
        <span>Город</span>
        <input
          type="search"
          name="city"
          value={filters.city}
          onChange={onChange}
          placeholder="Например, Москва"
        />
      </label>

      <label>
        <span>Категория</span>
        <select name="category" value={filters.category} onChange={onChange}>
          <option value="">Все категории</option>
          {categories.map((category) => (
              <option key={category.id} value={category.id}>
                  {category.name}
              </option>
          ))}
        </select>
      </label>

      <label>
        <span>Цена до</span>
        <input
          type="number"
          min="0"
          name="maxPrice"
          value={filters.maxPrice}
          onChange={onChange}
          placeholder="5000"
        />
      </label>

      <label className="equipment-filters__checkbox">
        <input
          type="checkbox"
          name="delivery"
          checked={filters.delivery}
          onChange={onChange}
        />
        <span>С доставкой</span>
      </label>

      <button type="button" onClick={onReset}>
        Сбросить
      </button>
    </form>
  );
}
