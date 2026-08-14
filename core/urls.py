from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    BookingViewSet,
    CategoryViewSet,
    EquipmentViewSet,
    RentalRequestViewSet,
    ReviewViewSet, EquipmentImageViewSet, MessageViewSet,
)

router = DefaultRouter()
router.register(r"categories", CategoryViewSet)
router.register(r"equipment", EquipmentViewSet, basename="equipment")
router.register(r"equipment-images", EquipmentImageViewSet, basename="equipment-image")
router.register(r"rental-requests", RentalRequestViewSet, basename="rental-request")
router.register(r"bookings", BookingViewSet, basename="booking")
router.register(r"reviews", ReviewViewSet, basename="review")
router.register(r"messages", MessageViewSet, basename="message")
urlpatterns = [
    path("", include(router.urls)),
]
