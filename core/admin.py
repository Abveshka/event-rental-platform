from django.contrib import admin
from .models import (
    User, Category, Equipment, EquipmentImage,
    RentalRequest, RequestItem, Booking, BookingItem, Review
)

admin.site.register(User)
admin.site.register(Category)
admin.site.register(Equipment)
admin.site.register(EquipmentImage)
admin.site.register(RentalRequest)
admin.site.register(RequestItem)
admin.site.register(Booking)
admin.site.register(BookingItem)
admin.site.register(Review)
