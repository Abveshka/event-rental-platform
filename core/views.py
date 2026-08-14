from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from datetime import date, timedelta
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import ProtectedError, RestrictedError, Q
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import EmailTokenObtainPairSerializer, ProfileUpdateSerializer, SupplierPublicSerializer
from rest_framework.exceptions import PermissionDenied
from .permissions import IsSupplierOwnerOrReadOnly, IsEquipmentOwner
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import generics
from .models import Booking, Category, Equipment, EquipmentImage, RentalRequest, Review, BookingItem, User, Message
from .serializers import (
    UserSerializer,
    BookingSerializer,
    CategorySerializer,
    EquipmentSerializer,
    EquipmentImageSerializer,
    RentalRequestSerializer,
    ReviewSerializer,
    RegisterSerializer,
    MessageSerializer,
)
from drf_spectacular.utils import (
    extend_schema,
    extend_schema_view,
    OpenApiParameter,
    OpenApiResponse,
    OpenApiTypes,
    inline_serializer,
)

@extend_schema_view(
    post=extend_schema(
        summary="Регистрация пользователя",
        description="Создаёт учётную запись. Логином пользователя становится переданный email.",
        request=RegisterSerializer,
        responses={
            201: inline_serializer(
                name="RegisterResponse",
                fields={"username": serializers.CharField(), "email": serializers.EmailField()},
            ),
            400: OpenApiResponse(description="Ошибка валидации или email уже занят"),
        },
    ),
)
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response(
            {"username": user.username, "email": user.email},
            status=status.HTTP_201_CREATED,
        )

@extend_schema_view(
    post=extend_schema(
        summary="Войти и получить JWT-токены",
        description="Принимает email и пароль, возвращает access и refresh JWT-токены.",
        request=EmailTokenObtainPairSerializer,
        responses={
            200: inline_serializer(
                name="TokenPairResponse",
                fields={"access": serializers.CharField(), "refresh": serializers.CharField()},
            ),
            400: OpenApiResponse(description="Неверные учётные данные"),
        },
    ),
)
class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer

@extend_schema_view(
    get=extend_schema(
        summary="Получить текущего пользователя",
        description="Возвращает краткие данные пользователя из JWT-токена.",
        responses={200: UserSerializer, 401: OpenApiResponse(description="Пользователь не авторизован")},
    ),
    patch=extend_schema(
        summary="Обновить профиль текущего пользователя",
        description="Обновляет только переданные поля профиля: компанию, описание, специализации, город и телефон.",
        request=ProfileUpdateSerializer,
        responses={200: UserSerializer, 401: OpenApiResponse(description="Пользователь не авторизован")},
    ),
)
class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    @extend_schema(
        summary="Получить категорию",
        description="Получает данные категории по числовому ID",
        parameters=[
            OpenApiParameter(
                name='id',
                type=int,
                location=OpenApiParameter.PATH,
                description=(
                        'Числовой ID категории (Category.pk) из базы данных'
                ),
            )
        ]
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(
        summary="Обновить категорию",
        description="Полностью заменяет данные категории по числовому ID",
        parameters=[
            OpenApiParameter(
                name='id',
                type=int,
                location=OpenApiParameter.PATH,
                description='Числовой ID категории (Category.pk) из базы данных',
            )
        ]
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @extend_schema(
        summary="Создать категорию",
        description="Создаёт новую категорию. Обязательные поля см. в Request body."
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(
        summary="Частично обновить категорию (PATCH)",
        description="Обновляет только переданные поля, остальные остаются без изменений.",
        parameters=[
            OpenApiParameter(
                name='id',
                type=int,
                location=OpenApiParameter.PATH,
                description='Числовой ID категории (Category.pk) из базы данных',
            )
        ]
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(
        summary="Удалить категорию",
        description="Полностью удаляет категорию из базы данных. Действие необратимо.",
        parameters=[
            OpenApiParameter(
                name='id',
                type=int,
                location=OpenApiParameter.PATH,
                description='Числовой ID категории (Category.pk) из базы данных',
            )
        ]
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

    @extend_schema(
        summary="Список категорий",
        description="Возвращает все категории из базы данных"
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

class EquipmentViewSet(viewsets.ModelViewSet):
    serializer_class = EquipmentSerializer
    permission_classes = [IsSupplierOwnerOrReadOnly]

    def get_queryset(self):
        queryset = (
            Equipment.objects.filter(is_active=True)
            .select_related("supplier", "category")
            .prefetch_related("images")
        )
        city = self.request.query_params.get("city")
        category = self.request.query_params.get("category")
        max_price = self.request.query_params.get("max_price")
        delivery = self.request.query_params.get("delivery")
        supplier = self.request.query_params.get("supplier")

        if city:
            queryset = queryset.filter(city__icontains=city)
        if category:
            queryset = queryset.filter(category_id=category)
        if max_price:
            queryset = queryset.filter(price_per_day__lte=max_price)
        if delivery in ["true", "1", "yes"]:
            queryset = queryset.filter(delivery_available=True)
        if supplier:
            queryset = queryset.filter(supplier_id=supplier)

        return queryset

    def get_object(self):
        if self.request.method in ("GET", "HEAD", "OPTIONS"):
            queryset = self.filter_queryset(self.get_queryset())
        else:
            queryset = Equipment.objects.all()

        obj = get_object_or_404(queryset, pk=self.kwargs["pk"])
        self.check_object_permissions(self.request, obj)
        return obj

    @extend_schema(
        summary="Переключить активность объявления",
        description="Включает или выключает видимость оборудования в каталоге. Доступно только владельцу (поставщику).",
        responses={
            200: EquipmentSerializer,
            403: OpenApiResponse(description="Пользователь не является владельцем этого оборудования"),
        },
    )
    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def toggle_active(self, request, pk=None):
        equipment = Equipment.objects.get(pk=pk)

        if equipment.supplier_id != request.user.id:
            return Response({"detail": "Недостаточно прав."}, status=status.HTTP_403_FORBIDDEN)

        equipment.is_active = not equipment.is_active
        equipment.save(update_fields=["is_active"])

        return Response(EquipmentSerializer(equipment).data)

    @extend_schema(
        summary="Удалить оборудование",
        description=(
            "Удаляет объявление. Если на оборудование есть бронирования, оно не удаляется, "
            "а становится неактивным (is_active=false) и скрывается из каталога. "
            "В таком случае возвращается 200 с полем hidden=true, а не 204."
        ),
        responses={
            204: OpenApiResponse(description="Оборудование удалено полностью"),
            200: OpenApiResponse(description="Оборудование скрыто, поскольку у него есть бронирования"),
            403: OpenApiResponse(description="Нет прав на удаление"),
            404: OpenApiResponse(description="Оборудование не найдено"),
        },
    )
    def destroy(self, request, *args, **kwargs):
        equipment = self.get_object()
        try:
            return super().destroy(request, *args, **kwargs)
        except RestrictedError:
            equipment.is_active = False
            equipment.save(update_fields=["is_active"])
            return Response(
                {
                    "detail": "На объявление есть бронирования, поэтому удалить его нельзя. Оно скрыто из каталога.",
                    "hidden": True,
                    "equipment": EquipmentSerializer(equipment).data,
                },
                status=status.HTTP_200_OK,
            )

    def perform_create(self, serializer):
        serializer.save(supplier=self.request.user)

    @extend_schema(
        summary="Моё оборудование",
        description="Возвращает оборудование текущего авторизованного пользователя.",
        responses={
            200: EquipmentSerializer(many=True),
            401: OpenApiResponse(description="Пользователь не авторизован"),
        },
    )
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def mine(self, request):
        queryset = Equipment.objects.filter(supplier=request.user).order_by("-created_at")
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Доступность оборудования по дням",
        description=(
            "Возвращает остаток доступного количества на каждый день заданного диапазона. "
            "Если start и end не переданы, используется диапазон от сегодняшней даты на 90 дней вперёд."
        ),
        parameters=[
            OpenApiParameter(name="start", type=OpenApiTypes.DATE,
                             description="Дата начала диапазона в формате YYYY-MM-DD."),
            OpenApiParameter(name="end", type=OpenApiTypes.DATE,
                             description="Дата окончания диапазона в формате YYYY-MM-DD."),
        ],
        responses={
            200: inline_serializer(
                name="EquipmentAvailabilityResponse",
                fields={
                    "available_quantity": serializers.IntegerField(),
                    "days": inline_serializer(
                        name="EquipmentAvailabilityDay",
                        many=True,
                        fields={"date": serializers.DateField(), "remaining": serializers.IntegerField()},
                    ),
                },
            ),
            404: OpenApiResponse(description="Оборудование не найдено или скрыто"),
        },
    )
    @action(detail=True, methods=["get"])
    def availability(self, request, pk=None):
        equipment = self.get_object()

        start_param = request.query_params.get("start")
        end_param = request.query_params.get("end")
        today = date.today()
        start = date.fromisoformat(start_param) if start_param else today
        end = date.fromisoformat(end_param) if end_param else today + timedelta(days=90)

        overlapping_items = BookingItem.objects.filter(
            equipment=equipment,
            start_date__lte=end,
            end_date__gte=start,
        ).exclude(booking__status="cancelled")

        booked_per_day = {}
        current = start
        while current <= end:
            booked_per_day[current.isoformat()] = 0
            current += timedelta(days=1)

        for item in overlapping_items:
            day = max(item.start_date, start)
            last = min(item.end_date, end)
            while day <= last:
                key = day.isoformat()
                booked_per_day[key] = booked_per_day.get(key, 0) + item.quantity
                day += timedelta(days=1)

        days = [
            {"date": day, "remaining": equipment.available_quantity - booked}
            for day, booked in booked_per_day.items()
        ]

        return Response({
            "available_quantity": equipment.available_quantity,
            "days": days,
        })

    @extend_schema(
        summary="Список оборудования",
        description="Возвращает список активного оборудования с возможностью фильтрации.",
        parameters=[
            OpenApiParameter(name='city', type=str,
                             description='Фильтр по городу (частичное совпадение, регистронезависимо)'),
            OpenApiParameter(name='category', type=int, description='ID категории (Category.pk)'),
            OpenApiParameter(name='max_price', type=float, description='Максимальная цена за день аренды'),
            OpenApiParameter(name='delivery', type=str, description='Фильтр по доставке. Принимает: true, 1, yes'),
            OpenApiParameter(name='supplier', type=int,
                             description='ID поставщика (User.pk), чьё оборудование показать'),
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Создать объявление об оборудовании",
        description=(
                "Создаёт новое объявление. Поле 'supplier' передавать не нужно — "
                "оно автоматически устанавливается из текущего авторизованного пользователя. "
                "Требует авторизации."
        ),
        responses={
            201: EquipmentSerializer,
            401: OpenApiResponse(description="Пользователь не авторизован"),
            400: OpenApiResponse(description="Ошибка валидации полей"),
        }
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(
        summary="Получить оборудование по ID",
        description=(
                "Возвращает объект оборудования. ВАЖНО: возвращает 404, если оборудование "
                "неактивно (is_active=False) или не проходит фильтры видимости — "
                "даже если объект физически существует в базе."
        ),
        parameters=[
            OpenApiParameter(name='id', type=int, location=OpenApiParameter.PATH,
                             description='ID оборудования (Equipment.pk)'),
        ],
        responses={
            200: EquipmentSerializer,
            404: OpenApiResponse(description="Оборудование не найдено или скрыто (is_active=False)"),
        }
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(
        summary="Обновить оборудование (PUT)",
        description=(
                "Полностью заменяет данные объявления. В отличие от GET, здесь поиск объекта "
                "идёт среди ВСЕХ объектов, включая скрытые (is_active=False) — "
                "владелец может редактировать даже неактивное оборудование. "
                "Доступно только владельцу (поставщику) объявления."
        ),
        parameters=[
            OpenApiParameter(name='id', type=int, location=OpenApiParameter.PATH,
                             description='ID оборудования (Equipment.pk)'),
        ],
        responses={
            200: EquipmentSerializer,
            403: OpenApiResponse(description="Нет прав на редактирование (не владелец)"),
            404: OpenApiResponse(description="Оборудование с таким ID не существует"),
        }
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @extend_schema(
        summary="Частично обновить оборудование (PATCH)",
        description="Обновляет только переданные поля. Права и поиск объекта — как у PUT (см. выше).",
        parameters=[
            OpenApiParameter(name='id', type=int, location=OpenApiParameter.PATH,
                             description='ID оборудования (Equipment.pk)'),
        ],
        responses={
            200: EquipmentSerializer,
            403: OpenApiResponse(description="Нет прав на редактирование (не владелец)"),
            404: OpenApiResponse(description="Оборудование с таким ID не существует"),
        }
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
@extend_schema_view(
    list=extend_schema(summary="Список фотографий оборудования", responses={200: EquipmentImageSerializer(many=True)}),
    retrieve=extend_schema(summary="Получить фотографию оборудования", responses={200: EquipmentImageSerializer, 404: OpenApiResponse(description="Фото не найдено")}),
    create=extend_schema(
        summary="Добавить фотографию оборудования",
        description="Принимает multipart/form-data с полями equipment, image и необязательным is_main. Доступно только владельцу оборудования.",
        request=EquipmentImageSerializer,
        responses={201: EquipmentImageSerializer, 400: OpenApiResponse(description="Ошибка валидации"), 403: OpenApiResponse(description="Нет прав на оборудование")},
    ),
    destroy=extend_schema(
        summary="Удалить фотографию оборудования",
        description="Удаляет фото. Если удалено главное фото, первым оставшимся фото назначается главное.",
        responses={204: OpenApiResponse(description="Фото удалено"), 403: OpenApiResponse(description="Нет прав на оборудование")},
    ),
)
class EquipmentImageViewSet(viewsets.ModelViewSet):
    serializer_class = EquipmentImageSerializer
    permission_classes = [IsEquipmentOwner]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return EquipmentImage.objects.all()

    def perform_create(self, serializer):
        equipment = serializer.validated_data["equipment"]
        if equipment.supplier_id != self.request.user.id:
            raise PermissionDenied("Нельзя добавлять фото к чужому оборудованию.")
        serializer.save()

    def perform_destroy(self, instance):
        equipment = instance.equipment
        was_main = instance.is_main
        instance.delete()

        if was_main:
            next_image = equipment.images.first()
            if next_image:
                next_image.is_main = True
                next_image.save(update_fields=["is_main"])
@extend_schema_view(
    list=extend_schema(summary="Список запросов на аренду", responses={200: RentalRequestSerializer(many=True)}),
    retrieve=extend_schema(summary="Получить запрос на аренду", responses={200: RentalRequestSerializer, 404: OpenApiResponse(description="Запрос не найден")}),
    create=extend_schema(
        summary="Создать запрос на аренду",
        description="Создаёт запрос от текущего пользователя вместе с позициями items. Поля organizer, status и created_at формируются сервером. Доступно пользователю с правом добавления запросов на аренду.",
        request=RentalRequestSerializer,
        responses={201: RentalRequestSerializer, 400: OpenApiResponse(description="Ошибка валидации"), 401: OpenApiResponse(description="Пользователь не авторизован")},
    ),
    update=extend_schema(summary="Полностью обновить запрос на аренду", description="Требует права на изменение запросов на аренду.", request=RentalRequestSerializer, responses={200: RentalRequestSerializer}),
    partial_update=extend_schema(summary="Частично обновить запрос на аренду", description="Требует права на изменение запросов на аренду.", request=RentalRequestSerializer, responses={200: RentalRequestSerializer}),
    destroy=extend_schema(summary="Удалить запрос на аренду", description="Требует права на удаление запросов на аренду.", responses={204: OpenApiResponse(description="Запрос удалён")}),
)
class RentalRequestViewSet(viewsets.ModelViewSet):
    serializer_class = RentalRequestSerializer

    def get_queryset(self):
        return (
            RentalRequest.objects.all()
            .select_related("organizer")
            .prefetch_related("items__category")
            .order_by("-created_at")
        )

    @extend_schema(
        summary="Мои запросы на аренду",
        description="Возвращает только запросы, созданные текущим авторизованным пользователем.",
        responses={200: RentalRequestSerializer(many=True), 401: OpenApiResponse(description="Пользователь не авторизован")},
    )
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def my(self, request):
        queryset = self.get_queryset().filter(organizer=request.user)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

@extend_schema_view(
    list=extend_schema(
        summary="Мои бронирования",
        description="Возвращает бронирования, где текущий пользователь является организатором.",
        responses={200: BookingSerializer(many=True), 401: OpenApiResponse(description="Пользователь не авторизован")},
    ),
    retrieve=extend_schema(summary="Получить бронирование", responses={200: BookingSerializer, 403: OpenApiResponse(description="Нет доступа к бронированию"), 404: OpenApiResponse(description="Бронирование не найдено")}),
    create=extend_schema(
        summary="Создать бронирование",
        description="Создаёт бронирование от текущего пользователя. Итоговая сумма и цена позиций рассчитываются сервером. Передайте хотя бы одну позицию в items.",
        request=BookingSerializer,
        responses={201: BookingSerializer, 400: OpenApiResponse(description="Ошибка валидации или недостаточно оборудования"), 401: OpenApiResponse(description="Пользователь не авторизован")},
    ),
    update=extend_schema(summary="Полностью обновить бронирование", request=BookingSerializer, responses={200: BookingSerializer}),
    partial_update=extend_schema(summary="Частично обновить бронирование", request=BookingSerializer, responses={200: BookingSerializer}),
    destroy=extend_schema(
        summary="Удалить отменённое бронирование",
        description="Доступно организатору, поставщику оборудования из бронирования или администратору — только когда status=cancelled.",
        responses={204: OpenApiResponse(description="Бронирование удалено"), 400: OpenApiResponse(description="Удалить можно только отменённое бронирование"), 403: OpenApiResponse(description="Нет прав")},
    ),
)
class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        base = (
            Booking.objects.all()
            .select_related("organizer", "request")
            .prefetch_related("items__equipment")
            .order_by("-created_at")
        )
        if user.is_staff or user.is_superuser:
            return base
        # доступ и организатору брони, и поставщику оборудования из неё
        return base.filter(
            Q(organizer=user) | Q(items__equipment__supplier=user)
        ).distinct()

    def list(self, request, *args, **kwargs):
        user = request.user
        if user.is_staff or user.is_superuser:
            queryset = self.get_queryset()
        else:
            queryset = self.get_queryset().filter(organizer=user)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Входящие бронирования",
        description="Возвращает бронирования на оборудование текущего пользователя как поставщика.",
        responses={200: BookingSerializer(many=True), 401: OpenApiResponse(description="Пользователь не авторизован")},
    )
    @action(detail=False, methods=["get"])
    def incoming(self, request):
        # брони на моё оборудование, как у поставщика
        queryset = self.get_queryset().filter(
            items__equipment__supplier=request.user
        ).distinct()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def _is_supplier_of(self, booking, user):
        return booking.items.filter(equipment__supplier=user).exists()

    def _is_organizer_or_staff(self, booking, user):
        return booking.organizer_id == user.id or user.is_staff or user.is_superuser

    @extend_schema(summary="Подтвердить бронирование", description="Поставщик подтверждает бронь со статусом pending.", responses={200: BookingSerializer, 400: OpenApiResponse(description="Бронирование не ожидает подтверждения"), 403: OpenApiResponse(description="Текущий пользователь не поставщик")})
    @action(detail=True, methods=["post"])
    def confirm(self, request, pk=None):
        booking = self.get_object()
        if not self._is_supplier_of(booking, request.user):
            return Response({"detail": "Вы не поставщик оборудования в этой брони."}, status=403)
        if booking.status != "pending":
            return Response({"detail": "Подтвердить можно только бронь в статусе «Ожидает»."}, status=400)
        booking.status = "confirmed"
        booking.save(update_fields=["status"])
        return Response(self.get_serializer(booking).data)

    @extend_schema(summary="Отменить бронирование", description="Организатор или администратор отменяет бронь со статусом pending либо confirmed.", responses={200: BookingSerializer, 400: OpenApiResponse(description="Бронирование нельзя отменить в текущем статусе"), 403: OpenApiResponse(description="Нет прав")})
    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        if not self._is_organizer_or_staff(booking, request.user):
            return Response({"detail": "Недостаточно прав."}, status=403)
        if booking.status not in ("pending", "confirmed"):
            return Response({"detail": "Это бронирование нельзя отменить."}, status=400)
        booking.status = "cancelled"
        booking.cancelled_by = "organizer"
        booking.save(update_fields=["status", "cancelled_by"])
        return Response(self.get_serializer(booking).data)

    @extend_schema(summary="Отклонить бронирование", description="Поставщик отклоняет бронь со статусом pending.", responses={200: BookingSerializer, 400: OpenApiResponse(description="Бронирование не ожидает решения"), 403: OpenApiResponse(description="Текущий пользователь не поставщик")})
    @action(detail=True, methods=["post"])
    def decline(self, request, pk=None):
        booking = self.get_object()
        if not self._is_supplier_of(booking, request.user):
            return Response({"detail": "Вы не поставщик оборудования в этой брони."}, status=403)
        if booking.status != "pending":
            return Response({"detail": "Отклонить можно только бронь в статусе «Ожидает»."}, status=400)
        booking.status = "cancelled"
        booking.cancelled_by = "supplier"
        booking.save(update_fields=["status", "cancelled_by"])
        return Response(self.get_serializer(booking).data)

    @extend_schema(summary="Оплатить бронирование", description="Демо-оплата: отмечает подтверждённое и ещё не оплаченное бронирование как оплаченное. Доступно только организатору.", responses={200: BookingSerializer, 400: OpenApiResponse(description="Оплата сейчас недоступна или уже выполнена"), 403: OpenApiResponse(description="Оплачивать может только организатор")})
    @action(detail=True, methods=["post"])
    def pay(self, request, pk=None):
        booking = self.get_object()

        if booking.organizer_id != request.user.id:
            return Response({"detail": "Оплатить бронирование может только организатор."}, status=403)

        if booking.status != "confirmed":
            return Response({"detail": "Оплата доступна только для подтверждённых бронирований."}, status=400)

        if booking.is_paid:
            return Response({"detail": "Бронирование уже оплачено."}, status=400)

        # ЗАГЛУШКА: здесь в будущем будет вызов настоящего платёжного шлюза
        # (создание платежа, редирект на страницу оплаты банка, вебхук об успехе и т.д.)
        booking.is_paid = True
        booking.paid_at = timezone.now()
        booking.save(update_fields=["is_paid", "paid_at"])

        return Response(self.get_serializer(booking).data)

    def destroy(self, request, *args, **kwargs):
        booking = self.get_object()
        is_supplier = self._is_supplier_of(booking, request.user)
        is_organizer = self._is_organizer_or_staff(booking, request.user)

        if not (is_supplier or is_organizer):
            return Response({"detail": "Недостаточно прав."}, status=403)
        if booking.status != "cancelled":
            return Response({"detail": "Можно удалить только отменённое бронирование."}, status=400)
        return super().destroy(request, *args, **kwargs)

@extend_schema_view(
    list=extend_schema(
        summary="Список отзывов",
        description="Возвращает отзывы, при необходимости отфильтрованные по ID поставщика.",
        parameters=[OpenApiParameter(name="supplier", type=int, description="ID поставщика для фильтрации отзывов.")],
        responses={200: ReviewSerializer(many=True)},
    ),
    retrieve=extend_schema(summary="Получить отзыв", responses={200: ReviewSerializer, 404: OpenApiResponse(description="Отзыв не найден")}),
    create=extend_schema(
        summary="Оставить отзыв",
        description="Отзыв может оставить только организатор завершённого бронирования, один отзыв на бронирование. Поставщик должен участвовать в этом бронировании.",
        request=ReviewSerializer,
        responses={201: ReviewSerializer, 400: OpenApiResponse(description="Условия для отзыва не выполнены"), 401: OpenApiResponse(description="Пользователь не авторизован")},
    ),
)
class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post"]

    def get_queryset(self):
        queryset = Review.objects.all().select_related("reviewer", "supplier").order_by("-created_at")
        supplier_id = self.request.query_params.get("supplier")
        if supplier_id:
            queryset = queryset.filter(supplier_id=supplier_id)
        return queryset

@extend_schema_view(
    get=extend_schema(summary="Профиль поставщика", description="Возвращает публичную информацию о поставщике и число его активных объявлений.", responses={200: SupplierPublicSerializer, 404: OpenApiResponse(description="Поставщик не найден")}),
)
class SupplierPublicView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"detail": "Поставщик не найден."}, status=404)

        serializer = SupplierPublicSerializer(user, context={"request": request})
        return Response(serializer.data)


@extend_schema_view(
    get=extend_schema(
        summary="Список поставщиков",
        description="Возвращает поставщиков с активными объявлениями, отсортированных по убыванию рейтинга.",
        parameters=[
            OpenApiParameter(name="city", type=str, description="Город: частичное совпадение без учёта регистра."),
            OpenApiParameter(name="specialization", type=str, description="Специализация: частичное совпадение без учёта регистра."),
        ],
        responses={200: SupplierPublicSerializer(many=True)},
    ),
)
class SupplierListView(generics.ListAPIView):
    serializer_class = SupplierPublicSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = User.objects.filter(equipments__is_active=True).distinct()

        city = self.request.query_params.get("city")
        specialization = self.request.query_params.get("specialization")

        if city:
            queryset = queryset.filter(city__icontains=city)
        if specialization:
            queryset = queryset.filter(specialties__icontains=specialization)

        return queryset.order_by("-rating")

@extend_schema_view(
    list=extend_schema(
        summary="Сообщения по бронированию",
        description="Возвращает сообщения только при передаче параметра booking. Доступ имеют организатор бронирования, его поставщик или администратор.",
        parameters=[OpenApiParameter(name="booking", type=int, required=True, description="ID бронирования.")],
        responses={200: MessageSerializer(many=True), 401: OpenApiResponse(description="Пользователь не авторизован"), 404: OpenApiResponse(description="Бронирование не найдено")},
    ),
    retrieve=extend_schema(summary="Получить сообщение", responses={200: MessageSerializer, 404: OpenApiResponse(description="Сообщение не найдено")}),
    create=extend_schema(
        summary="Отправить сообщение по бронированию",
        description="Создаёт сообщение в чате по бронированию. Автор устанавливается из JWT-токена.",
        request=MessageSerializer,
        responses={201: MessageSerializer, 403: OpenApiResponse(description="Нет доступа к переписке"), 401: OpenApiResponse(description="Пользователь не авторизован")},
    ),
)
class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post"]

    def _can_access_booking(self, booking, user):
        if user.is_staff or user.is_superuser:
            return True
        if booking.organizer_id == user.id:
            return True
        return booking.items.filter(equipment__supplier_id=user.id).exists()

    def get_queryset(self):
        booking_id = self.request.query_params.get("booking")
        if not booking_id:
            return Message.objects.none()

        booking = get_object_or_404(Booking, pk=booking_id)
        if not self._can_access_booking(booking, self.request.user):
            return Message.objects.none()

        return Message.objects.filter(booking_id=booking_id).select_related("sender")

    def perform_create(self, serializer):
        booking = serializer.validated_data["booking"]
        if not self._can_access_booking(booking, self.request.user):
            raise PermissionDenied("У вас нет доступа к переписке по этому бронированию.")
        serializer.save(sender=self.request.user)
