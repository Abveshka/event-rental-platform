from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _
from slugify import slugify


class User(AbstractUser):
    GENDER_CHOICES = [
        ("male", "Мужской"),
        ("female", "Женский"),
    ]

    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(max_length=254, unique=True, blank=True, null=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True)
    is_supplier = models.BooleanField(default=False)
    is_organizer = models.BooleanField(default=True)
    phone = models.CharField(max_length=20, blank=True)
    company_name = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True, verbose_name='О компании')
    specialties = models.CharField(max_length=300, blank=True, verbose_name='Специализация')
    city = models.CharField(max_length=100, blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)
    date_joined = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user'
        verbose_name = _('Пользователь')
        verbose_name_plural = _('Пользователи')

    def __str__(self):
        return self.username


class Category(models.Model):
    """Категории оборудования"""
    name = models.CharField(max_length=100, verbose_name='Название')
    slug = models.SlugField(max_length=100, unique=True, verbose_name='Слаг')
    description = models.TextField(blank=True, verbose_name='Описание')

    class Meta:
        db_table = 'category'
        verbose_name = _('Категория')
        verbose_name_plural = _('Категории')
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Equipment(models.Model):
    """Оборудование"""
    supplier = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='equipments',
        verbose_name='Поставщик'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name='equipments',
        verbose_name='Категория'
    )

    title = models.CharField(max_length=200, verbose_name='Название')
    slug = models.SlugField(max_length=220, blank=True, verbose_name='URL-слаг')
    description = models.TextField(verbose_name='Описание')
    price_per_day = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Цена за день')
    deposit = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='Залог')

    quantity = models.PositiveIntegerField(default=1, verbose_name='Количество')
    available_quantity = models.PositiveIntegerField(default=1, verbose_name='Доступно')

    city = models.CharField(max_length=100, verbose_name='Город')
    address = models.CharField(max_length=255, blank=True, verbose_name='Адрес')

    delivery_available = models.BooleanField(default=False, verbose_name='Доставка возможна')
    delivery_price = models.DecimalField(max_digits=8, decimal_places=2, default=0, verbose_name='Цена доставки')

    is_active = models.BooleanField(default=True, verbose_name='Активно')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'equipment'
        verbose_name = _('Оборудование')
        verbose_name_plural = _('Оборудование')
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.slug or self._title_changed():
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def _title_changed(self):
        if not self.pk:
            return False
        old = Equipment.objects.filter(pk=self.pk).values_list("title", flat=True).first()
        return old != self.title

    def __str__(self):
        return self.title


class EquipmentImage(models.Model):
    """Фото оборудования"""
    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image = models.ImageField(upload_to='equipment/', verbose_name='Изображение')
    is_main = models.BooleanField(default=False, verbose_name='Главное фото')

    class Meta:
        db_table = 'equipment_image'
        verbose_name = _('Фото оборудования')
        verbose_name_plural = _('Фото оборудования')

    def __str__(self):
        return f"Фото {self.equipment.title}"


class RentalRequest(models.Model):
    """Запрос на аренду"""
    STATUS_CHOICES = [
        ('open', 'Открыт'),
        ('in_progress', 'В работе'),
        ('closed', 'Закрыт'),
    ]

    organizer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='rental_requests'
    )
    event_type = models.CharField(max_length=30, verbose_name='Тип мероприятия')
    event_date = models.DateField(verbose_name='Дата мероприятия')
    city = models.CharField(max_length=100, verbose_name='Город')
    budget = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='open')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'rental_request'
        verbose_name = _('Запрос на аренду')
        verbose_name_plural = _('Запросы на аренду')

    def __str__(self):
        return f"Запрос от {self.organizer} на {self.event_date}"


class RequestItem(models.Model):
    """Позиция в запросе"""
    request = models.ForeignKey(
        RentalRequest,
        on_delete=models.CASCADE,
        related_name='items'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.RESTRICT,
        verbose_name='Категория'
    )
    quantity = models.PositiveIntegerField(verbose_name='Количество')
    notes = models.CharField(max_length=255, blank=True, verbose_name='Примечания')

    class Meta:
        db_table = 'request_item'
        verbose_name = _('Позиция запроса')
        verbose_name_plural = _('Позиции запроса')


class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Ожидает'),
        ('confirmed', 'Подтверждено'),
        ('cancelled', 'Отменено'),
        ('completed', 'Завершено'),
    ]

    CANCELLED_BY_CHOICES = [
        ('organizer', 'Организатором'),
        ('supplier', 'Поставщиком'),
    ]

    organizer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    request = models.ForeignKey(RentalRequest, on_delete=models.SET_NULL, null=True, blank=True, related_name='bookings')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending')
    cancelled_by = models.CharField(max_length=20, choices=CANCELLED_BY_CHOICES, null=True, blank=True, verbose_name='Кем отменено')
    is_paid = models.BooleanField(default=False, verbose_name='Оплачено')
    paid_at = models.DateTimeField(null=True, blank=True, verbose_name='Дата оплаты')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'booking'
        verbose_name = _('Бронирование')
        verbose_name_plural = _('Бронирования')


class BookingItem(models.Model):
    """Позиция бронирования"""
    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name='items'
    )
    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.RESTRICT
    )
    quantity = models.PositiveIntegerField()
    price_per_day = models.DecimalField(max_digits=10, decimal_places=2)
    start_date = models.DateField()
    end_date = models.DateField()

    class Meta:
        db_table = 'booking_item'
        verbose_name = _('Позиция бронирования')
        verbose_name_plural = _('Позиции бронирования')


class Review(models.Model):
    """Отзыв"""
    booking = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        related_name='review'
    )
    reviewer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='reviews_given'
    )
    supplier = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='reviews_received'
    )
    rating = models.SmallIntegerField(choices=[(i, i) for i in range(1, 6)])
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'review'
        verbose_name = _('Отзыв')
        verbose_name_plural = _('Отзывы')

class Message(models.Model):
    """Сообщение в чате по бронированию"""
    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    text = models.TextField(verbose_name='Текст сообщения')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'message'
        verbose_name = _('Сообщение')
        verbose_name_plural = _('Сообщения')
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender} → бронь #{self.booking_id}"