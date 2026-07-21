from rest_framework import serializers
from django.db.models import Sum, Q
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import (
    User,
    Booking,
    BookingItem,
    Category,
    Equipment,
    EquipmentImage,
    RentalRequest,
    RequestItem,
    Review,
)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "date_joined"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ["email", "password", "first_name", "last_name", "gender", "company_name"]

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Пользователь с таким email уже зарегистрирован.")
        if len(value) > 150:
            raise serializers.ValidationError("Email слишком длинный.")
        return value

    def create(self, validated_data):
        email = validated_data["email"]
        return User.objects.create_user(
            username=email,
            email=email,
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            gender=validated_data.get("gender", ""),
            company_name=validated_data.get("company_name", ""),
        )


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = "email"

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        try:
            user_obj = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Пользователь с таким email не найден.")

        user = authenticate(username=user_obj.username, password=password)

        if user is None:
            raise serializers.ValidationError("Неверный пароль.")

        refresh = self.get_token(user)

        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description"]


class EquipmentSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    supplier_name = serializers.SerializerMethodField()
    supplier = serializers.PrimaryKeyRelatedField(read_only=True)
    images = serializers.SerializerMethodField()

    class Meta:
        model = Equipment
        fields = [
            "id",
            "slug",
            "supplier",
            "supplier_name",
            "category",
            "category_name",
            "images",
            "title",
            "description",
            "price_per_day",
            "deposit",
            "quantity",
            "available_quantity",
            "city",
            "address",
            "delivery_available",
            "delivery_price",
            "is_active",
            "created_at",
            "updated_at",
        ]

    def get_supplier_name(self, obj):
        return obj.supplier.company_name or obj.supplier.username

    def get_images(self, obj):
        return EquipmentImageSerializer(obj.images.all(), many=True).data


class EquipmentImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = EquipmentImage
        fields = ["id", "equipment", "image", "is_main"]


class RequestItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = RequestItem
        fields = ["id", "category", "category_name", "quantity", "notes"]


class RentalRequestSerializer(serializers.ModelSerializer):
    organizer = serializers.StringRelatedField(read_only=True)
    items = RequestItemSerializer(many=True)

    class Meta:
        model = RentalRequest
        fields = [
            "id",
            "organizer",
            "event_type",
            "event_date",
            "city",
            "budget",
            "description",
            "status",
            "items",
            "created_at",
        ]
        read_only_fields = ["status", "created_at"]

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        request = self.context["request"]
        rental_request = RentalRequest.objects.create(
            organizer=request.user,
            **validated_data,
        )

        for item_data in items_data:
            RequestItem.objects.create(request=rental_request, **item_data)

        return rental_request


class BookingItemSerializer(serializers.ModelSerializer):
    equipment_title = serializers.CharField(source="equipment.title", read_only=True)
    equipment_supplier = serializers.IntegerField(source="equipment.supplier_id", read_only=True)

    price_per_day = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = BookingItem
        fields = [
            "id",
            "equipment",
            "equipment_title",
            "quantity",
            "price_per_day",
            "start_date",
            "end_date",
            "equipment_supplier"
        ]

    def validate(self, attrs):
        start_date = attrs.get("start_date")
        end_date = attrs.get("end_date")
        equipment = attrs.get("equipment")
        quantity = attrs.get("quantity")

        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError(
                "Дата окончания аренды не может быть раньше даты начала."
            )

        if equipment and quantity and start_date and end_date:
            overlapping_bookings = BookingItem.objects.filter(
                equipment=equipment,
                start_date__lte=end_date,
                end_date__gte=start_date,
            ).exclude(
                booking__status="cancelled",
            )

            already_booked = overlapping_bookings.aggregate(
                total=Sum("quantity")
            )["total"] or 0

            if already_booked + quantity > equipment.available_quantity:
                raise serializers.ValidationError(
                    f"Недостаточно оборудования на выбранные даты. "
                    f"Свободно: {equipment.available_quantity - already_booked} шт."
                )

        return attrs


class BookingSerializer(serializers.ModelSerializer):
    organizer = serializers.StringRelatedField(read_only=True)
    items = BookingItemSerializer(many=True)
    has_review = serializers.SerializerMethodField()
    total_amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = Booking
        fields = [
            "id",
            "organizer",
            "request",
            "total_amount",
            "status",
            "items",
            "created_at",
            "updated_at",
            "has_review",
        ]
        read_only_fields = ["status", "created_at", "updated_at"]

    def get_has_review(self, obj):
        return Review.objects.filter(booking=obj).exists()

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        request = self.context["request"]
        booking = Booking.objects.create(
            organizer=request.user,
            total_amount=0,
            **validated_data,
        )

        total_amount = 0
        for item_data in items_data:
            equipment = item_data["equipment"]
            start_date = item_data["start_date"]
            end_date = item_data["end_date"]
            days = (end_date - start_date).days + 1
            price_per_day = equipment.price_per_day
            total_amount += price_per_day * item_data["quantity"] * days

            BookingItem.objects.create(
                booking=booking,
                price_per_day=price_per_day,
                **item_data,
            )

        booking.total_amount = total_amount
        booking.save(update_fields=["total_amount"])
        return booking


class ReviewSerializer(serializers.ModelSerializer):
    reviewer = serializers.StringRelatedField(read_only=True)
    supplier_name = serializers.CharField(source="supplier.username", read_only=True)

    class Meta:
        model = Review
        fields = ["id", "booking", "reviewer", "supplier", "supplier_name", "rating", "comment", "created_at"]
        read_only_fields = ["created_at"]

    def validate(self, attrs):
        request = self.context["request"]
        booking = attrs.get("booking")
        supplier = attrs.get("supplier")

        if booking.organizer_id != request.user.id:
            raise serializers.ValidationError("Оставить отзыв можно только к своим бронированиям.")

        if booking.status != "completed":
            raise serializers.ValidationError("Отзыв можно оставить только после завершённой аренды.")

        if Review.objects.filter(booking=booking).exists():
            raise serializers.ValidationError("Вы уже оставили отзыв по этому бронированию.")

        supplier_ids = set(booking.items.values_list("equipment__supplier_id", flat=True))
        if supplier.id not in supplier_ids:
            raise serializers.ValidationError("Этот поставщик не участвовал в данном бронировании.")

        if not (1 <= attrs.get("rating", 0) <= 5):
            raise serializers.ValidationError("Оценка должна быть от 1 до 5.")

        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        review = Review.objects.create(reviewer=request.user, **validated_data)
        self._update_supplier_rating(review.supplier)
        return review

    def _update_supplier_rating(self, supplier):
        from django.db.models import Avg
        avg = Review.objects.filter(supplier=supplier).aggregate(Avg("rating"))["rating__avg"]
        supplier.rating = round(avg or 0, 2)
        supplier.save(update_fields=["rating"])
