# Event Rental Platform

Платформа для аренды оборудования для мероприятий: пользователи могут просматривать каталог, бронировать оборудование на нужные даты, управлять заявками и оставлять отзывы поставщикам.

## Возможности

- каталог оборудования с фильтрацией;
- регистрация и авторизация по JWT;
- роли организатора и поставщика;
- создание, подтверждение и отмена бронирований;
- проверка доступного количества на выбранные даты;
- автоматический расчёт стоимости бронирования;
- отзывы о поставщиках и сообщения;
- документация API в Swagger UI.

## Стек

- Backend: Python, Django, Django REST Framework, PostgreSQL;
- Frontend: React, Vite, React Router;
- API-документация: drf-spectacular / OpenAPI;
- Аутентификация: JWT.

## Требования

- Python 3.12 или новее;
- Node.js с npm;
- PostgreSQL.

## Быстрый запуск

### 1. Клонируйте репозиторий

```bash
git clone https://github.com/Abveshka/event-rental-platform.git
cd event-rental-platform
```

### 2. Создайте базу данных PostgreSQL

Создайте пустую базу данных, например `event_rental`:

```sql
CREATE DATABASE event_rental;
```

### 3. Настройте и запустите backend

Скопируйте пример переменных окружения:

```powershell
Copy-Item .env.example .env
```

Откройте `.env` и укажите свои `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` и `SECRET_KEY`. Не добавляйте `.env` в Git.

Создайте виртуальное окружение, установите зависимости и примените миграции:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
```

Чтобы наполнить приложение демонстрационными пользователями, оборудованием и бронированиями, выполните:

```powershell
python manage.py seed_data
```

Запустите API:

```powershell
python manage.py runserver
```

Backend будет доступен по адресу `http://127.0.0.1:8000`.

### 4. Настройте и запустите frontend

В новом терминале:

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Откройте адрес, который выведет Vite (обычно `http://localhost:5173`). По умолчанию frontend обращается к API по адресу `http://127.0.0.1:8000/api`.

## Полезные команды

```powershell
# Запустить тесты backend
python manage.py test

# Создать администратора Django
python manage.py createsuperuser

# Перезаполнить тестовые данные (удаляет текущие тестовые данные)
python manage.py seed_data --flush

# Запустить frontend в режиме разработки
cd frontend
npm run dev

# Проверить frontend линтером
npm run lint
```

## API

После запуска backend доступны:

- Swagger UI: `http://127.0.0.1:8000/api/schema/swagger-ui/`
- ReDoc: `http://127.0.0.1:8000/api/schema/redoc/`
- OpenAPI-схема: `http://127.0.0.1:8000/api/schema/`

## Переменные окружения

### Backend (`.env`)

| Переменная | Назначение |
| --- | --- |
| `SECRET_KEY` | Секретный ключ Django. |
| `DEBUG` | Режим разработки (`True` или `False`). |
| `ALLOWED_HOSTS` | Список разрешённых хостов через запятую. |
| `DB_NAME` | Имя базы PostgreSQL. |
| `DB_USER` | Пользователь PostgreSQL. |
| `DB_PASSWORD` | Пароль пользователя PostgreSQL. |
| `DB_HOST` | Хост PostgreSQL. |
| `DB_PORT` | Порт PostgreSQL. |

### Frontend (`frontend/.env`)

| Переменная | Назначение |
| --- | --- |
| `VITE_API_BASE_URL` | Базовый URL API, например `http://127.0.0.1:8000/api`. |

## Статус проекта

Проект находится в стадии разработки и предназначен для демонстрации навыков full-stack разработки.
