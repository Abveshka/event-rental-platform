export function StarRating({ value = 0, interactive = false, onChange }) {
  const roundedValue = Math.round(Number(value) || 0);

  return (
    <span className={interactive ? "star-rating star-rating--interactive" : "star-rating"}>
      {[1, 2, 3, 4, 5].map((star) => {
        const content = star <= roundedValue ? "★" : "☆";

        if (!interactive) {
          return <span key={star}>{content}</span>;
        }

        return (
          <button
            key={star}
            type="button"
            className="star-rating__button"
            onClick={() => onChange?.(star)}
            aria-label={`${star} из 5`}
          >
            {content}
          </button>
        );
      })}
    </span>
  );
}
