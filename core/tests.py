from django.test import TestCase
from datetime import date

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Booking, Category, Equipment, User


class BookingAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="organizer",
            email="organizer@example.com",
            password="password123",
            is_organizer=True,
        )

        self.other_user = User.objects.create_user(
            username="other",
            email="other@example.com",
            password="password123",
            is_organizer=True,
        )

        self.admin = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="password123",
            is_staff=True,
        )

        self.supplier = User.objects.create_user(
            username="supplier",
            email="supplier@example.com",
            password="password123",
            is_supplier=True,
        )

        self.category = Category.objects.create(
            name="Sound",
            slug="sound",
            description="Sound equipment",
        )

        self.equipment = Equipment.objects.create(
            supplier=self.supplier,
            category=self.category,
            title="Speaker",
            description="Powerful speaker",
            price_per_day=1000,
            deposit=500,
            quantity=5,
            available_quantity=5,
            city="Moscow",
        )

        self.url = reverse("booking-list")

    # 1: неавторизованный пользователь не может создать бронирование
    def test_guest_cannot_create_booking(self):
        payload = {
            "items": [
                {
                    "equipment": self.equipment.id,
                    "quantity": 1,
                    "start_date": "2026-07-10",
                    "end_date": "2026-07-12",
                }
            ]
        }

        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # 2: авторизованный пользователь может создать бронирование
    def test_authenticated_user_can_create_booking(self):
        self.client.force_authenticate(user=self.user)

        payload = {
            "items": [
                {
                    "equipment": self.equipment.id,
                    "quantity": 2,
                    "start_date": "2026-07-10",
                    "end_date": "2026-07-12",
                }
            ]
        }

        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Booking.objects.count(), 1)

        booking = Booking.objects.first()
        self.assertEqual(booking.organizer, self.user)

        item = payload["items"][0]
        start_date = date.fromisoformat(item["start_date"])
        end_date = date.fromisoformat(item["end_date"])
        days = (end_date - start_date).days + 1

        expected_total = self.equipment.price_per_day * item["quantity"] * days
        self.assertEqual(booking.total_amount, expected_total)

    # 3: нельзя забронировать больше, чем доступно.
    def test_cannot_book_more_than_available_quantity(self):
        self.client.force_authenticate(user=self.user)

        payload = {
            "items": [
                {
                    "equipment": self.equipment.id,
                    "quantity": 10,
                    "start_date": "2026-07-10",
                    "end_date": "2026-07-12",
                }
            ]
        }

        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Booking.objects.count(), 0)

    # 4: обычный пользователь видит только свои бронирования.
    def test_user_sees_only_own_bookings(self):
        Booking.objects.create(
            organizer=self.user,
            total_amount=1000,
        )
        Booking.objects.create(
            organizer=self.other_user,
            total_amount=2000,
        )

        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["organizer"], self.user.username)

    # 5: админ видит все бронирования
    def test_admin_sees_all_bookings(self):
        Booking.objects.create(
            organizer=self.user,
            total_amount=1000,
        )
        Booking.objects.create(
            organizer=self.other_user,
            total_amount=2000,
        )

        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    # 6: organizer видит свою бронь по id
    def test_organizer_can_retrieve_own_booking(self):
        booking = Booking.objects.create(
            organizer=self.user,
            total_amount=1000
        )

        self.client.force_authenticate(user=self.user)
        url = reverse("booking-detail", args=[booking.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # 7: чужой пользователь НЕ должен видеть чужую бронь
    def test_other_user_cannot_retrieve_foreign_booking(self):
        booking = Booking.objects.create(
            organizer=self.user,
            total_amount=1000
        )

        self.client.force_authenticate(user=self.other_user)
        url = reverse("booking-detail", args=[booking.id])
        response = self.client.get(url)
        self.assertIn(response.status_code, [status.HTTP_404_NOT_FOUND])

    # 8: Удаление НЕотмененной брони
    def test_organizer_cannot_delete_non_cancelled_booking(self):
        booking = Booking.objects.create(
            organizer=self.user,
            total_amount=1000,
            status="pending",  # или какой у вас статус по умолчанию
        )

        self.client.force_authenticate(user=self.user)
        url = reverse("booking-detail", args=[booking.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Booking.objects.count(), 1)  # бронь НЕ удалена

    # 9: Удаление отмененной брони
    def test_organizer_can_delete_cancelled_booking(self):
        booking = Booking.objects.create(
            organizer=self.user,
            total_amount=1000,
            status="cancelled",
        )

        self.client.force_authenticate(user=self.user)
        url = reverse("booking-detail", args=[booking.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Booking.objects.count(), 0)

    # 10: Полное совпадение дат — должно быть отклонено
    def test_cannot_book_same_dates_as_existing_booking(self):
        self.client.force_authenticate(user=self.user)
        # первая бронь — забронировали всё доступное количество (5 шт)
        payload1 = {
            "items": [{
                "equipment": self.equipment.id,
                "quantity": 5,
                "start_date": "2026-07-10",
                "end_date": "2026-07-12",
            }]
        }
        response1 = self.client.post(self.url, payload1, format="json")
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)

        # вторая бронь на те же даты — товара больше нет
        payload2 = {
            "items": [{
                "equipment": self.equipment.id,
                "quantity": 1,
                "start_date": "2026-07-10",
                "end_date": "2026-07-12",
            }]
        }
        response2 = self.client.post(self.url, payload2, format="json")
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)

    # 11: Частичное пересечение (новая бронь начинается ДО окончания старой)
    def test_cannot_book_overlapping_dates_partial(self):
        self.client.force_authenticate(user=self.user)
        payload1 = {
            "items": [{
                "equipment": self.equipment.id,
                "quantity": 5,
                "start_date": "2026-07-10",
                "end_date": "2026-07-15",
            }]
        }
        self.client.post(self.url, payload1, format="json")

        # новая бронь начинается 12-го, то есть внутри диапазона первой
        payload2 = {
            "items": [{
                "equipment": self.equipment.id,
                "quantity": 1,
                "start_date": "2026-07-12",
                "end_date": "2026-07-20",
            }]
        }
        response2 = self.client.post(self.url, payload2, format="json")
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)

    # 12: Даты НЕ пересекаются - одна бронь заканчивается точно в день начала другой
    def test_can_book_adjacent_dates_after_previous_ends(self):
        self.client.force_authenticate(user=self.user)
        payload1 = {
            "items": [{
                "equipment": self.equipment.id,
                "quantity": 5,
                "start_date": "2026-07-10",
                "end_date": "2026-07-12",
            }]
        }
        self.client.post(self.url, payload1, format="json")

        # новая бронь начинается сразу после окончания первой (13-го)
        payload2 = {
            "items": [{
                "equipment": self.equipment.id,
                "quantity": 5,
                "start_date": "2026-07-13",
                "end_date": "2026-07-15",
            }]
        }
        response2 = self.client.post(self.url, payload2, format="json")
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)

    # 13: Если бронируем МЕНЬШЕ, чем осталось доступно на пересекающиеся даты — должно пройти
    def test_can_book_overlapping_dates_if_enough_quantity_left(self):
        self.client.force_authenticate(user=self.user)
        payload1 = {
            "items": [{
                "equipment": self.equipment.id,
                "quantity": 2,  # забронировали только 2 из 5
                "start_date": "2026-07-10",
                "end_date": "2026-07-12",
            }]
        }
        self.client.post(self.url, payload1, format="json")

        payload2 = {
            "items": [{
                "equipment": self.equipment.id,
                "quantity": 3,  # осталось ровно 3 доступно
                "start_date": "2026-07-11",
                "end_date": "2026-07-13",
            }]
        }
        response2 = self.client.post(self.url, payload2, format="json")
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)