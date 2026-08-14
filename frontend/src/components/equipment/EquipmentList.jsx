import { EquipmentCard } from "./EquipmentCard";

export function EquipmentList({ equipment, onCardClick }) {
  if (equipment.length === 0) {
    return <p className="empty-state">Оборудование по таким фильтрам не найдено.</p>;
  }

  return (
    <section className="equipment-grid">
      {equipment.map((item) => (
        <EquipmentCard key={item.id} item={item} onClick={onCardClick} />

      ))}
    </section>
  );
}
