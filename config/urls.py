from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiResponse
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from django.conf import settings
from django.conf.urls.static import static
from core.views import MeView, RegisterView, EmailTokenObtainPairView, SupplierPublicView, SupplierListView


@extend_schema_view(
    post=extend_schema(
        summary="Обновить access JWT-токен",
        description="Принимает refresh JWT-токен и возвращает новый access-токен.",
        responses={
            200: OpenApiResponse(description="Новый access-токен"),
            401: OpenApiResponse(description="Refresh-токен невалиден или истёк"),
        },
    ),
)
class DocumentedTokenRefreshView(TokenRefreshView):
    pass

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/", include("core.urls")),
    path("api-auth/", include("rest_framework.urls", namespace="rest_framework")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/schema/swagger-ui/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/schema/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    path("api/token/", EmailTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", DocumentedTokenRefreshView.as_view(), name="token_refresh"),
    path("api/users/me/", MeView.as_view(), name="me"),
    path("api/register/", RegisterView.as_view(), name="register"),
    path("api/suppliers/", SupplierListView.as_view(), name="supplier-list"),
    path("api/suppliers/<int:pk>/", SupplierPublicView.as_view(), name="supplier-public"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
