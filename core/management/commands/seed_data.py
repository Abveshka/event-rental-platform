"""
Management command для заполнения БД реалистичными тестовыми данными.

Куда положить файл:
    core/management/commands/seed_data.py

(нужны пустые __init__.py в management/ и management/commands/)

Запуск:
    python manage.py seed_data
    python manage.py seed_data --flush           # чистит и заполняет заново
    python manage.py seed_data --flush --clean-only   # только чистит, без заполнения
    python manage.py seed_data --skip-images     # без картинок (быстрее)
"""

import random
import io
from datetime import timedelta

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.utils import timezone
from faker import Faker
from PIL import Image, ImageDraw, ImageFont

from core.models import (
    User,
    Category,
    Equipment,
    EquipmentImage,
    RentalRequest,
    RequestItem,
    Booking,
    BookingItem,
    Review,
    Message,
)

fake = Faker("ru_RU")

CITIES = ["Москва", "Санкт-Петербург", "Казань", "Новосибирск", "Екатеринбург"]
EVENT_TYPES = ["Свадьба", "Корпоратив", "Концерт", "Конференция", "День рождения"]

# --------------------------------------------------------------------------- #
# РЕАЛЬНЫЙ КАТАЛОГ ОБОРУДОВАНИЯ
# --------------------------------------------------------------------------- #

EQUIPMENT_CATALOG = {
    "Звуковое оборудование": [
        {
            "title": "Активная АС Yamaha DXR15",
            "description": "15-дюймовая активная акустическая система мощностью 1100 Вт. "
                            "Подходит для озвучивания залов до 300 человек, свадеб и корпоративов. "
                            "Встроенный DSP-процессор, вход XLR/Jack combo.",
            "price": (2500, 4000), "deposit": (8000, 15000),
        },
        {
            "title": "Радиосистема Shure SM58 (комплект 2 микрофона)",
            "description": "Два ручных беспроводных микрофона на одной базовой станции. "
                            "Дальность приёма до 80 метров, время работы от батареек до 8 часов. "
                            "Идеально для ведущих и тамады.",
            "price": (1500, 2500), "deposit": (5000, 8000),
        },
        {
            "title": "Микшерный пульт Behringer X32",
            "description": "32-канальный цифровой микшер с полным набором эффектов и рекордером. "
                            "Управление через iPad-приложение. Для сложных многоканальных мероприятий.",
            "price": (3500, 5500), "deposit": (15000, 25000),
        },
        {
            "title": "Сабвуфер JBL SRX828SP",
            "description": "Активный сабвуфер 2×18\" мощностью 2000 Вт. Даёт мощный низ на open-air "
                            "площадках и в больших залах.",
            "price": (3000, 4500), "deposit": (10000, 18000),
        },
        {
            "title": "Портативная колонка JBL PartyBox 310",
            "description": "Компактная активная колонка на аккумуляторе, до 18 часов работы. "
                            "Удобна для небольших мероприятий на улице без розеток рядом.",
            "price": (1200, 2000), "deposit": (4000, 6000),
        },
        {
            "title": "DJ-контроллер Pioneer DDJ-1000",
            "description": "Профессиональный 4-канальный DJ-контроллер с джог-колёсами. "
                            "Совместим с Rekordbox. Аренда для диджей-сетов на вечеринках.",
            "price": (2800, 4200), "deposit": (12000, 20000),
        },
    ],
    "Световое оборудование": [
        {
            "title": "Голова вращения Chauvet Intimidator Spot 360",
            "description": "Прожектор с вращающейся головой, гобо-эффекты, плавное панорамирование. "
                            "Часто берут парами или комплектом по 4 штуки для сцены.",
            "price": (1800, 2800), "deposit": (6000, 10000),
        },
        {
            "title": "PAR-прожектор LED RGBW (комплект 8 шт.)",
            "description": "Светодиодные PAR-прожекторы для заливки сцены и подсветки зала в любой цвет. "
                            "Управление по DMX или автономно со звуковой активацией.",
            "price": (2000, 3200), "deposit": (7000, 12000),
        },
        {
            "title": "Световой пульт Chamsys MagicQ MQ60",
            "description": "Профессиональный DMX-контроллер для управления всем световым парком "
                            "мероприятия. Требует light-оператора.",
            "price": (2500, 4000), "deposit": (10000, 18000),
        },
        {
            "title": "Дым-машина Antari Z-1500",
            "description": "Мощная дым-машина 1500 Вт для создания атмосферы на танцполе и "
                            "выделения световых лучей. Расход жидкости — по согласованию.",
            "price": (900, 1500), "deposit": (3000, 5000),
        },
        {
            "title": "Стробоскоп Martin Atomic 3000 LED",
            "description": "Яркий LED-стробоскоп для акцентных вспышек на концертах и вечеринках. "
                            "Синхронизация с музыкой через DMX.",
            "price": (1200, 1900), "deposit": (4000, 7000),
        },
        {
            "title": "Гирлянда Festoon (комплект 50 м)",
            "description": "Тёплые ретро-лампы на прочном кабеле для декора шатров, беседок и "
                            "летних веранд. Популярный выбор для свадеб на природе.",
            "price": (2000, 3500), "deposit": (5000, 8000),
        },
    ],
    "Сцены и подиумы": [
        {
            "title": "Модульная сцена 6×4 м, высота 0.6 м",
            "description": "Разборная сцена из подиумов 1×1 м с регулируемой высотой. "
                            "Антискользящее покрытие, ограждение в комплекте. Монтаж включён.",
            "price": (15000, 25000), "deposit": (20000, 30000),
        },
        {
            "title": "Подиум для диджея 2×2 м",
            "description": "Компактный подиум для DJ-сетапа, выдерживает до 500 кг. "
                            "Удобен для быстрой установки на выездных мероприятиях.",
            "price": (4000, 6500), "deposit": (8000, 12000),
        },
        {
            "title": "Танцпол ламинат 6×6 м",
            "description": "Виниловый танцпол под дерево, разборные плиты 1×1 м. "
                            "Подходит для установки на траве и брусчатке.",
            "price": (12000, 18000), "deposit": (15000, 25000),
        },
        {
            "title": "Подиум подиумный для показа мод 10×1.2 м",
            "description": "Длинный узкий подиум для дефиле, разборная конструкция с бортиками. "
                            "Часто используется на модных показах и презентациях.",
            "price": (10000, 16000), "deposit": (15000, 22000),
        },
    ],
    "Мебель для мероприятий": [
        {
            "title": "Стул Кьявари (комплект 50 шт.)",
            "description": "Классический банкетный стул золотого цвета с мягкой съёмной подушкой. "
                            "Самый популярный выбор для свадебных банкетов.",
            "price": (3500, 5500), "deposit": (10000, 15000),
        },
        {
            "title": "Круглый стол банкетный d1.5м (комплект 10 шт.)",
            "description": "Столы на 8–10 персон, складные ножки, скатерти в комплект не входят. "
                            "Для банкетов и фуршетов.",
            "price": (5000, 8000), "deposit": (12000, 18000),
        },
        {
            "title": "Барная стойка мобильная",
            "description": "Складная барная стойка с подсветкой для фуршетов и коктейльных зон. "
                            "Легко перевозится и собирается за 15 минут.",
            "price": (3000, 4500), "deposit": (8000, 12000),
        },
        {
            "title": "Лаунж-зона (диван + 2 кресла + столик)",
            "description": "Комплект мягкой мебели для зоны отдыха на мероприятии. "
                            "Несколько расцветок обивки на выбор.",
            "price": (6000, 9500), "deposit": (15000, 22000),
        },
        {
            "title": "Текстильные чехлы на стулья со шнуровкой (100 шт.)",
            "description": "Белые чехлы из плотной ткани с завязками сзади. Придают банкету "
                            "торжественный вид, стираются между заказами.",
            "price": (4000, 6000), "deposit": (8000, 10000),
        },
    ],
    "Генераторы": [
        {
            "title": "Дизельный генератор Hyundai DHY 8000SE (6.5 кВт)",
            "description": "Автономный генератор для площадок без электричества — банкеты "
                            "на природе, open-air. Бак на 8 часов непрерывной работы.",
            "price": (4000, 6500), "deposit": (15000, 20000),
        },
        {
            "title": "Бензогенератор Hyundai HHY 3000F (2.8 кВт)",
            "description": "Компактный генератор для локального питания света или звука "
                            "небольшой площадки. Малошумный кожух.",
            "price": (2000, 3200), "deposit": (8000, 12000),
        },
        {
            "title": "Дизельный генератор 20 кВт (тихий кожух)",
            "description": "Мощный генератор для крупных мероприятий с большим количеством "
                            "техники: сцена, полный свет и звук одновременно.",
            "price": (9000, 14000), "deposit": (30000, 45000),
        },
    ],
    "Шатры и тенты": [
        {
            "title": "Шатёр пагода 5×5 м",
            "description": "Каркасный шатёр со стеклопрозрачными стенами, подходит для "
                            "свадебной церемонии и банкета на 30–40 человек.",
            "price": (8000, 13000), "deposit": (20000, 30000),
        },
        {
            "title": "Шатёр банкетный 10×20 м",
            "description": "Большой шатёр для мероприятий на 150–200 человек, с боковыми "
                            "стенками и возможностью установки пола.",
            "price": (35000, 55000), "deposit": (60000, 90000),
        },
        {
            "title": "Тент маркиза 3×3 м",
            "description": "Лёгкий разборный тент для фуд-зоны, регистрации гостей или "
                            "укрытия оборудования от солнца/дождя.",
            "price": (2500, 4000), "deposit": (6000, 9000),
        },
        {
            "title": "Прозрачный шатёр-сфера (диаметр 5 м)",
            "description": "Эффектный прозрачный купольный шатёр для романтичных фотозон "
                            "и уединённых банкетов. Instagram-хит для свадеб.",
            "price": (15000, 22000), "deposit": (30000, 40000),
        },
    ],
    "Проекторы и экраны": [
        {
            "title": "Проектор Epson EB-2250U (5000 люмен)",
            "description": "Яркий проектор Full HD для презентаций на конференциях и "
                            "показа видео на свадьбах. Работает в полуосвещённом зале.",
            "price": (3500, 5500), "deposit": (15000, 25000),
        },
        {
            "title": "Экран проекционный на треноге 3×2 м",
            "description": "Быстроразборный экран с матовым полотном, подходит для "
                            "фронтальной и обратной проекции.",
            "price": (1500, 2500), "deposit": (5000, 8000),
        },
        {
            "title": "LED-видеостена P3.9 (2×3 м, модульная)",
            "description": "Яркий светодиодный экран для сцены — трансляция контента, "
                            "логотипов, живого видео с камер. Требует монтажа.",
            "price": (25000, 40000), "deposit": (50000, 70000),
        },
    ],
}

# --------------------------------------------------------------------------- #
# ПРОФИЛИ ПОСТАВЩИКОВ
# --------------------------------------------------------------------------- #

SUPPLIER_PROFILES = [
    {
        "company_name": "СаундПро",
        "description": "Занимаемся арендой звукового оборудования с 2016 года. "
                        "Свой парк техники Yamaha, Shure и JBL, всегда чистим и тестируем "
                        "перед выдачей. Возможен выезд звукооператора.",
        "specialties": ["Звуковое оборудование"],
    },
    {
        "company_name": "LightWorks Event",
        "description": "Световое оформление мероприятий любого масштаба — от камерного "
                        "дня рождения до большого корпоратива. Проектируем световую схему "
                        "под вашу площадку бесплатно.",
        "specialties": ["Световое оборудование"],
    },
    {
        "company_name": "СценаМастер",
        "description": "Проектируем и монтируем сцены и подиумы под любые параметры "
                        "площадки. Собственная бригада монтажников, работаем по всему "
                        "региону.",
        "specialties": ["Сцены и подиумы", "Танцполы"],
    },
    {
        "company_name": "Банкет Декор",
        "description": "Мебель для банкетов: стулья Кьявари, столы, лаунж-зоны. "
                        "Большой парк в наличии — не нужно ждать поставки под заказ.",
        "specialties": ["Мебель для мероприятий"],
    },
    {
        "company_name": "ЭнергоРент",
        "description": "Аренда генераторов для мероприятий на природе и площадках без "
                        "стационарного электричества. Своя служба доставки и техподдержка "
                        "на объекте.",
        "specialties": ["Генераторы"],
    },
    {
        "company_name": "Шатёр Сервис",
        "description": "Шатры и тенты любых форм — от классических банкетных до "
                        "прозрачных куполов для свадебных фотозон. Полный цикл: доставка, "
                        "монтаж, демонтаж.",
        "specialties": ["Шатры и тенты"],
    },
    {
        "company_name": "МедиаТех Рент",
        "description": "Проекторы, экраны и светодиодные видеостены для конференций и "
                        "презентаций. Поможем с настройкой контента на объекте.",
        "specialties": ["Проекторы и экраны"],
    },
    {
        "company_name": "ИвентХаб",
        "description": "Универсальный поставщик оборудования для мероприятий: звук, "
                        "свет, мебель. Удобно, когда не хочется собирать технику "
                        "по разным компаниям.",
        "specialties": ["Звуковое оборудование", "Световое оборудование", "Мебель для мероприятий"],
    },
]

# --------------------------------------------------------------------------- #
# ОТЗЫВЫ
# --------------------------------------------------------------------------- #

REVIEW_COMMENTS = {
    5: [
        "Всё прошло отлично! {equipment} привезли вовремя, состояние отличное. "
        "Обязательно обратимся ещё раз.",
        "Очень довольны сотрудничеством с {company}. Оборудование исправно, "
        "менеджер на связи весь день мероприятия.",
        "Брали {equipment} на свадьбу — гости в восторге, всё сработало без сбоев. "
        "Спасибо за оперативную доставку!",
        "Профессиональный подход: помогли с настройкой на месте, ничего не сломалось. "
        "Рекомендую {company}.",
    ],
    4: [
        "В целом всё хорошо, {equipment} исправно, но привезли на полчаса позже "
        "оговоренного времени.",
        "Оборудование в хорошем состоянии, но пришлось самим разбираться с подключением — "
        "инструкции не хватило.",
        "Качество техники устроило, цена адекватная. Единственный минус — долго "
        "отвечали на сообщения перед бронированием.",
    ],
    3: [
        "{equipment} работало, но было видно, что не новое — были потёртости и "
        "царапины. Функционально нареканий нет.",
        "Средне: сроки доставки соблюли, но состояние оборудования могло быть и лучше "
        "за такую цену.",
    ],
}

# --------------------------------------------------------------------------- #
# ПЕРЕПИСКА
# --------------------------------------------------------------------------- #

MESSAGE_THREADS = [
    [
        ("organizer", "Здравствуйте! Подскажите, {equipment} точно будет доступно на {date}?"),
        ("supplier", "Добрый день! Да, свободно на эту дату, можем зарезервировать."),
        ("organizer", "Отлично, а доставка до площадки возможна?"),
        ("supplier", "Да, доставим и заберём после мероприятия, это уже включено в бронь."),
    ],
    [
        ("organizer", "Добрый день! Уточните, пожалуйста, нужен ли залог наличными или можно картой?"),
        ("supplier", "Можно картой при получении, либо перевод заранее — как вам удобнее."),
        ("organizer", "Понял, спасибо, переведу сегодня вечером."),
    ],
    [
        ("organizer", "Здравствуйте, а можно приехать забрать оборудование самим, без доставки?"),
        ("supplier", "Да, самовывоз возможен, адрес склада отправлю ближе к дате."),
        ("organizer", "Хорошо, договорились!"),
    ],
    [
        ("organizer", "Подскажите, есть ли инструкция по настройке {equipment}? Хотим подготовиться заранее."),
        ("supplier", "Пришлю PDF-инструкцию сегодня, плюс наш техник может проконсультировать по телефону в день мероприятия."),
        ("organizer", "Было бы здорово, спасибо!"),
    ],
    [
        ("organizer", "Добрый вечер! Мероприятие перенесли на неделю позже, можно ли изменить бронь?"),
        ("supplier", "Да, без проблем, посмотрел — дата свободна, переношу бронирование."),
        ("organizer", "Спасибо большое за оперативность!"),
    ],
]

PLACEHOLDER_COLORS = [
    "#4C6EF5", "#12B886", "#F59F00", "#E8590C",
    "#E64980", "#7048E8", "#1098AD", "#2F9E44",
]


def generate_placeholder_image(text, size=(600, 400)):
    """Генерирует картинку-заглушку с названием оборудования."""
    bg_color = random.choice(PLACEHOLDER_COLORS)
    img = Image.new("RGB", size, color=bg_color)
    draw = ImageDraw.Draw(img)

    try:
        font = ImageFont.truetype("DejaVuSans-Bold.ttf", 24)
    except IOError:
        font = ImageFont.load_default()

    words = text.split()
    lines, current = [], ""
    for word in words:
        test_line = f"{current} {word}".strip()
        bbox = draw.textbbox((0, 0), test_line, font=font)
        if bbox[2] - bbox[0] > size[0] - 40 and current:
            lines.append(current)
            current = word
        else:
            current = test_line
    if current:
        lines.append(current)

    total_height = len(lines) * 30
    y = (size[1] - total_height) // 2
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        line_width = bbox[2] - bbox[0]
        x = (size[0] - line_width) // 2
        draw.text((x, y), line, fill="white", font=font)
        y += 30

    buffer = io.BytesIO()
    img.save(buffer, format="JPEG", quality=85)
    buffer.seek(0)
    return ContentFile(buffer.read())


class Command(BaseCommand):
    help = "Заполняет базу реалистичными тестовыми данными"

    def add_arguments(self, parser):
        parser.add_argument("--flush", action="store_true", help="Удалить старые данные перед заполнением")
        parser.add_argument("--clean-only", action="store_true", help="Только удалить данные, без заполнения")
        parser.add_argument("--organizers", type=int, default=8, help="Кол-во организаторов")
        parser.add_argument("--bookings", type=int, default=15, help="Кол-во бронирований")
        parser.add_argument("--skip-images", action="store_true", help="Не генерировать картинки")
        parser.add_argument("--images-per-equipment", type=int, default=2, help="Картинок на единицу оборудования")

    def handle(self, *args, **options):
        if options["flush"] or options["clean_only"]:
            self._flush()
            if options["clean_only"]:
                self.stdout.write(self.style.SUCCESS("🧹 Данные удалены, заполнение пропущено (--clean-only)."))
                return

        categories = self._create_categories()
        suppliers = self._create_suppliers()
        organizers = self._create_organizers(options["organizers"])
        equipment_list = self._create_equipment(suppliers, categories)

        if not options["skip_images"]:
            self._create_equipment_images(equipment_list, options["images_per_equipment"])

        requests = self._create_rental_requests(organizers, categories)
        bookings = self._create_bookings(organizers, requests, equipment_list, options["bookings"])
        self._create_reviews(bookings)
        self._update_supplier_ratings(suppliers)
        self._create_messages(bookings)

        self.stdout.write(self.style.SUCCESS("✅ Тестовые данные успешно созданы!"))
        self.stdout.write(f"Поставщиков: {len(suppliers)}, организаторов: {len(organizers)}")
        self.stdout.write(f"Оборудования: {len(equipment_list)}")
        self.stdout.write(f"Запросов на аренду: {len(requests)}")
        self.stdout.write(f"Бронирований: {len(bookings)}")

    # ------------------------------------------------------------------ #

    def _flush(self):
        self.stdout.write("Удаляю старые данные...")
        Message.objects.all().delete()
        Review.objects.all().delete()
        BookingItem.objects.all().delete()
        Booking.objects.all().delete()
        RequestItem.objects.all().delete()
        RentalRequest.objects.all().delete()
        EquipmentImage.objects.all().delete()
        Equipment.objects.all().delete()
        Category.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()

    def _create_categories(self):
        categories = {}
        for name in EQUIPMENT_CATALOG.keys():
            cat, _ = Category.objects.get_or_create(name=name, defaults={"description": ""})
            categories[name] = cat
        return categories

    def _create_suppliers(self):
        suppliers = []
        for profile in SUPPLIER_PROFILES:
            username = fake.unique.user_name()
            user = User.objects.create_user(
                username=username,
                email=fake.unique.email(),
                password="test1234",
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                gender=random.choice(["male", "female"]),
                is_supplier=True,
                is_organizer=False,
                phone=fake.phone_number()[:20],
                city=random.choice(CITIES),
                company_name=profile["company_name"],
                description=profile["description"],
                specialties=", ".join(profile["specialties"]),
            )
            # rating не задаём тут — он будет высчитан из реальных отзывов
            # в _update_supplier_ratings() после того, как отзывы созданы
            user._specialty_categories = profile["specialties"]  # временный атрибут для привязки оборудования
            suppliers.append(user)
        return suppliers

    def _create_organizers(self, count):
        organizers = []
        for _ in range(count):
            username = fake.unique.user_name()
            user = User.objects.create_user(
                username=username,
                email=fake.unique.email(),
                password="test1234",
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                gender=random.choice(["male", "female"]),
                is_supplier=False,
                is_organizer=True,
                phone=fake.phone_number()[:20],
                city=random.choice(CITIES),
                rating=round(random.uniform(3.5, 5.0), 2),
            )
            organizers.append(user)
        return organizers

    def _create_equipment(self, suppliers, categories):
        equipment_list = []
        for category_name, items in EQUIPMENT_CATALOG.items():
            # находим поставщиков, специализирующихся на этой категории
            matching_suppliers = [
                s for s in suppliers if category_name in getattr(s, "_specialty_categories", [])
            ] or suppliers

            for item in items:
                supplier = random.choice(matching_suppliers)
                quantity = random.randint(2, 15)
                price = round(random.uniform(*item["price"]), 2)
                deposit = round(random.uniform(*item["deposit"]), 2)

                eq = Equipment.objects.create(
                    supplier=supplier,
                    category=categories[category_name],
                    title=item["title"],
                    description=item["description"],
                    price_per_day=price,
                    deposit=deposit,
                    quantity=quantity,
                    available_quantity=quantity,
                    city=supplier.city,
                    address=fake.street_address(),
                    delivery_available=random.choice([True, True, False]),
                    delivery_price=round(random.uniform(500, 3000), 2),
                    is_active=True,
                )
                equipment_list.append(eq)
        return equipment_list

    def _create_equipment_images(self, equipment_list, per_equipment):
        for eq in equipment_list:
            for i in range(per_equipment):
                image_file = generate_placeholder_image(eq.title)
                img = EquipmentImage(equipment=eq, is_main=(i == 0))
                img.image.save(f"{eq.slug or eq.id}_{i}.jpg", image_file, save=True)

    def _create_rental_requests(self, organizers, categories):
        requests = []
        category_list = list(categories.values())
        for organizer in organizers:
            for _ in range(random.randint(1, 2)):
                req = RentalRequest.objects.create(
                    organizer=organizer,
                    event_type=random.choice(EVENT_TYPES),
                    event_date=fake.date_between(start_date="today", end_date="+90d"),
                    city=organizer.city,
                    budget=round(random.uniform(20000, 250000), 2),
                    description=fake.sentence(nb_words=12),
                    status=random.choice(["open", "in_progress", "closed"]),
                )
                for _ in range(random.randint(1, 3)):
                    RequestItem.objects.create(
                        request=req,
                        category=random.choice(category_list),
                        quantity=random.randint(1, 5),
                        notes=fake.sentence(nb_words=6),
                    )
                requests.append(req)
        return requests

    def _create_bookings(self, organizers, requests, equipment_list, count):
        bookings = []
        statuses = ["pending", "confirmed", "cancelled", "completed"]
        for _ in range(count):
            organizer = random.choice(organizers)
            linked_request = random.choice(requests) if requests and random.random() > 0.3 else None
            status = random.choice(statuses)

            start_date = fake.date_between(start_date="-30d", end_date="+30d")
            end_date = start_date + timedelta(days=random.randint(1, 5))

            chosen_equipment = random.sample(equipment_list, k=min(random.randint(1, 3), len(equipment_list)))
            total = sum(eq.price_per_day for eq in chosen_equipment)

            booking = Booking.objects.create(
                organizer=organizer,
                request=linked_request,
                total_amount=total,
                status=status,
                cancelled_by=random.choice(["organizer", "supplier"]) if status == "cancelled" else None,
                is_paid=status in ["confirmed", "completed"],
                paid_at=timezone.now() if status in ["confirmed", "completed"] else None,
            )
            for eq in chosen_equipment:
                BookingItem.objects.create(
                    booking=booking,
                    equipment=eq,
                    quantity=random.randint(1, min(3, eq.quantity)),
                    price_per_day=eq.price_per_day,
                    start_date=start_date,
                    end_date=end_date,
                )
            bookings.append(booking)
        return bookings

    def _create_reviews(self, bookings):
        completed = [b for b in bookings if b.status == "completed"]
        for booking in completed:
            first_item = booking.items.first()
            if not first_item:
                continue
            supplier = first_item.equipment.supplier
            rating = random.choices([5, 4, 3], weights=[0.55, 0.3, 0.15])[0]
            template = random.choice(REVIEW_COMMENTS[rating])
            comment = template.format(
                equipment=first_item.equipment.title,
                company=supplier.company_name or supplier.username,
            )
            Review.objects.create(
                booking=booking,
                reviewer=booking.organizer,
                supplier=supplier,
                rating=rating,
                comment=comment,
            )

    def _update_supplier_ratings(self, suppliers):
        """Пересчитывает рейтинг поставщика как среднее по его реальным отзывам."""
        for supplier in suppliers:
            reviews = Review.objects.filter(supplier=supplier)
            if reviews.exists():
                avg = sum(r.rating for r in reviews) / reviews.count()
                supplier.rating = round(avg, 2)
            else:
                supplier.rating = 0.0  # отзывов нет — рейтинг честно пустой
            supplier.save(update_fields=["rating"])

    def _create_messages(self, bookings):
        for booking in bookings:
            first_item = booking.items.first()
            if not first_item:
                continue
            supplier = first_item.equipment.supplier
            thread = random.choice(MESSAGE_THREADS)
            base_time = booking.created_at or timezone.now()

            for i, (role, template) in enumerate(thread):
                sender = booking.organizer if role == "organizer" else supplier
                text = template.format(
                    equipment=first_item.equipment.title,
                    date=booking.items.first().start_date.strftime("%d.%m.%Y"),
                )
                msg = Message.objects.create(booking=booking, sender=sender, text=text)
                # немного разносим сообщения по времени, чтобы выглядело как переписка
                Message.objects.filter(pk=msg.pk).update(
                    created_at=base_time + timedelta(minutes=15 * (i + 1))
                )