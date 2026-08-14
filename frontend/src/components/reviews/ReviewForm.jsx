import { useState } from "react";
import { createReview } from "../../api/reviews";
import { extractErrorMessage } from "../../api/errors";
import { StarRating } from "./StarRating";

export function ReviewForm({ booking, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const supplierId = booking.items[0]?.equipment_supplier;

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await createReview(booking.id, supplierId, rating, comment);
      onSubmitted();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <StarRating value={rating} interactive onChange={setRating} />

      <textarea
        placeholder="Расскажите, как прошла аренда (необязательно)"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        rows="3"
      />

      {error && <p className="form-error">{error}</p>}

      <button type="submit" className="btn-auth" disabled={isSubmitting}>
        {isSubmitting ? "Отправляем..." : "Отправить отзыв"}
      </button>
    </form>
  );
}
