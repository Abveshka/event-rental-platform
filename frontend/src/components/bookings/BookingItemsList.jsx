export function BookingItemsList({ items }) {
  return (
    <ul className="booking-items-list">
      {items.map((item) => (
        <li key={item.id}>
          <span>{item.equipment_title}</span>
          <span>
            {item.quantity} шт. · {item.start_date} → {item.end_date}
          </span>
        </li>
      ))}
    </ul>
  );
}
