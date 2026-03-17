# Restaurant App

Full-stack restaurant operations app with a React frontend and a Django REST backend. It supports staff authentication, role-based access, menu management, orders, reservations, reports, and live order updates across the floor, kitchen, and management views.

## Tech Stack

- Frontend: React, Vite, React Router, Tailwind CSS, Lucide icons
- Backend: Django, Django REST Framework, Simple JWT, Channels, Daphne
- Realtime: Django Channels with Redis-backed channel layers
- Database: PostgreSQL in Docker, SQLite fallback in local backend settings

## Repository Structure

```text
restuarant-app/
├── frontend/   # React dashboard and staff interfaces
├── backend/    # Django API, auth, realtime orders, admin
├── README.md
├── pyproject.toml
└── uv.lock
```

## Main Features

- Role-based access for `admin`, `manager`, `waiter`, and `kitchen`
- Staff account management with manager restrictions
- Menu categories, menu items, and availability toggles
- Restaurant order workflow:
  `pending -> confirmed -> preparing -> ready -> served`
- Kitchen-specific order handling rules
- Reservation and table availability management
- Management reporting for revenue, orders, reservations, and staff
- Realtime order synchronization with WebSocket support plus UI polling fallback

## Role Rules

- `admin`: full access, including deleting users
- `manager`: full operations access except destructive user deletion
- `waiter`: creates orders, manages reservations, sees active orders, cannot confirm orders
- `kitchen`: can confirm and prepare orders, cannot serve/cancel once an order is `ready`

## How The App Is Split

### Frontend

The frontend lives in [frontend](/home/jalis/Desktop/restuarant-app/frontend) and provides:

- login/session-based dashboard
- role-aware navigation
- operations pages for managers
- waiter and kitchen workspaces
- staff account management UI

### Backend

The backend lives in [backend](/home/jalis/Desktop/restuarant-app/backend) and provides:

- cookie-based JWT authentication
- role-aware permissions
- REST APIs for menu, orders, reservations, reports, and users
- Django admin
- Channels-based realtime order broadcasting

## Local Development

### Backend

1. Create and activate a virtual environment.

```bash
cd backend
python -m venv venv
source venv/bin/activate
```

2. Install dependencies.

```bash
pip install -r requirements.txt
```

3. Create the backend environment file.

```bash
cp .env.example .env
```

If `.env.example` is not present in your copy, create `.env` manually with values like:

```env
SECRET_KEY=change-me
DEBUG=True
DB_NAME=restaurantdb
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=127.0.0.1
DB_PORT=5432
ACCESS_TOKEN_MINUTES=60
REFRESH_TOKEN_DAYS=7
ALLOWED_HOSTS=127.0.0.1,localhost
AUTH_COOKIE_SECURE=False
AUTH_COOKIE_SAMESITE=Lax
```

4. Run migrations and create a superuser.

```bash
python manage.py migrate
python manage.py createsuperuser
```

5. Start the backend.

```bash
daphne -p 8000 config.asgi:application
```

Optional for multi-process realtime:

```bash
export CHANNEL_LAYER_URL=redis://127.0.0.1:6379/1
```

### Frontend

1. Install dependencies.

```bash
cd frontend
npm install
```

2. Start the Vite dev server.

```bash
npm run dev
```

The frontend dev server proxies:

- `/api` to `http://127.0.0.1:8000`
- `/ws` to `ws://127.0.0.1:8000`

## Docker Setup

The backend includes Docker Compose in [backend/docker-compose.yml](/home/jalis/Desktop/restuarant-app/backend/docker-compose.yml).

### Start backend services

```bash
cd backend
docker compose up --build
```

This starts:

- PostgreSQL
- Redis
- Django backend via Daphne on `http://localhost:8000`

### Run backend commands in Docker

```bash
docker compose exec backend python3 manage.py migrate
docker compose exec backend python3 manage.py createsuperuser
```

## API Overview

### Auth

- `POST /api/auth/token/`
- `POST /api/auth/token/refresh/`
- `POST /api/auth/logout/`
- `GET /api/auth/users/me/`
- `GET/POST /api/auth/users/`
- `PATCH /api/auth/users/{id}/`
- `DELETE /api/auth/users/{id}/`

### Menu

- `GET /api/menu/categories/`
- `GET /api/menu/items/`
- `PATCH /api/menu/items/{id}/toggle_availability/`

### Orders

- `GET /api/orders/`
- `POST /api/orders/`
- `GET /api/orders/active/`
- `GET /api/orders/kitchen/`
- `PATCH /api/orders/{id}/update_status/`

### Reservations

- `GET /api/reservations/`
- `GET /api/reservations/today/`
- `GET /api/reservations/tables/`
- `POST /api/reservations/tables/availability/`

### Reports

- `GET /api/reports/dashboard/`
- `GET /api/reports/revenue/`
- `GET /api/reports/top-items/`
- `GET /api/reports/orders/`
- `GET /api/reports/reservations/`
- `GET /api/reports/staff/`

## Realtime Orders

Realtime order updates are delivered through Django Channels at:

```text
/ws/orders/
```

The frontend listens for:

- `order.created`
- `order.status_updated`

The UI also includes short polling as a fallback so order screens still update if the socket is unavailable in the current environment.

## Current Order Workflow Rules

- Waiter creates the order
- Manager or kitchen confirms the order
- Manager or kitchen can move the order through preparation
- Waiter or manager can serve the order
- Kitchen cannot serve or cancel after an order becomes `ready`

## Admin and Docs

- Django admin: `http://localhost:8000/admin/`
- Swagger docs: `http://localhost:8000/api/docs/swagger/`
- Redoc docs: `http://localhost:8000/api/docs/redoc/`

## Notes

- The backend README in [backend/README.md](/home/jalis/Desktop/restuarant-app/backend/README.md) contains more backend-specific detail.
- The root project currently does not persist a full order activity/audit log yet.
