from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import Booking

class Command(BaseCommand):
    help = "Переводит подтверждённые бронирования с прошедшей датой в статус 'завершено'"

    def handle(self, *args, **options):
        today = timezone.now().date()
        bookings = Booking.objects.filter(status="confirmed").prefetch_related("items")
        updated = 0

        for booking in bookings:
            end_dates = [item.end_date for item in booking.items.all()]
            if end_dates and max(end_dates) < today:
                booking.status = "completed"
                booking.save(update_fields=["status"])
                updated += 1

        self.stdout.write(f"Обновлено бронирований: {updated}")