# Restaurant Management Backend

Django + DRF backend for full restaurant management.

---

## Project Structure

```
restaurant_backend/
├── manage.py
├── requirements.txt
├── .env.example
├── config/
│   ├── settings.py       # All settings
│   ├── urls.py           # Root URL routing
│   ├── asgi.py           # Channels/WebSocket entry
│   ├── wsgi.py
│   └── admin.py          # All model admin registrations
└── apps/
    ├── accounts/         # Auth, JWT, roles
    ├── menu/             # Categories & items
    ├── orders/           # Orders + WebSocket
    ├── reservations/     # Tables & bookings
    └── reports/          # Analytics & dashboard
```

---

## Local Setup

### 1. Create and activate virtualenv

```bash
python -m venv venv
source venv/bin/activate       # macOS/Linux
venv\Scripts\activate          # Windows
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env if needed
```

### 4. Run migrations & create superuser

```bash
python manage.py migrate
python manage.py createsuperuser
```

### 5. Start the development server

```bash
# HTTP only (no WebSockets)
python manage.py runserver

# With WebSockets (Daphne)
daphne -p 8000 config.asgi:application
```

### 6. Configure Channels with Redis (optional, recommended for multi-process)

```bash
export CHANNEL_LAYER_URL=redis://127.0.0.1:6379/1
```

---

## Docker Setup

### 1. Create environment file

```bash
cp .env.example .env
```

This Docker setup uses SQLite for now and persists the database file in a Docker volume. Redis is included for Django Channels so WebSocket events work across processes.

### 2. Build and start everything

```bash
docker compose up --build
```

This starts:
- `backend`  Django + Daphne on `http://localhost:8000`
- `redis`  Redis for Channels

### 3. Run management commands

```bash
docker compose exec backend python3 manage.py createsuperuser
```

---

## API Reference

### Auth  `api/auth/`

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| POST | `/api/auth/token/` | Login → JWT tokens | Public |
| POST | `/api/auth/token/refresh/` | Refresh access token | Public |
| GET | `/api/auth/users/me/` | Current user profile | Any staff |
| POST | `/api/auth/users/change_password/` | Change password | Any staff |
| GET/POST | `/api/auth/users/` | List / create users | Admin/Manager |

### Menu  `api/menu/`

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/menu/categories/` | List categories | Any staff |
| GET | `/api/menu/categories/{id}/items/` | Items in category | Any staff |
| POST/PATCH/DELETE | `/api/menu/categories/` | Manage categories | Admin/Manager |
| GET | `/api/menu/items/` | List items (filterable) | Any staff |
| GET | `/api/menu/items/featured/` | Featured items | Any staff |
| PATCH | `/api/menu/items/{id}/toggle_availability/` | Toggle available | Admin/Manager |
| POST/PATCH/DELETE | `/api/menu/items/` | Manage items | Admin/Manager |

**Menu item filters:** `?category=1&is_available=true&min_price=5&max_price=50`

### Orders  `api/orders/`

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/orders/` | List all orders | Waiter+ |
| POST | `/api/orders/` | Create order | Waiter+ |
| GET | `/api/orders/active/` | Active (non-completed) orders | Waiter+ |
| GET | `/api/orders/kitchen/` | Kitchen display orders | Waiter+ |
| PATCH | `/api/orders/{id}/update_status/` | Transition order status | Waiter+ |

**Order status flow:**
```
pending → confirmed → preparing → ready → served
   └──────────────────────────────────────→ cancelled
```

**WebSocket:** `ws://localhost:8000/ws/orders/?token=<access_token>`

Events pushed to all connected clients:
- `order.created` — new order placed
- `order.status_updated` — status changed

### Reservations  `api/reservations/`

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/reservations/` | List reservations | Waiter+ |
| POST | `/api/reservations/` | Create reservation | Waiter+ |
| GET | `/api/reservations/today/` | Today's reservations | Waiter+ |
| PATCH | `/api/reservations/{id}/update_status/` | Update status | Waiter+ |
| GET | `/api/reservations/tables/` | List tables | Waiter+ |
| POST | `/api/reservations/tables/availability/` | Check availability | Waiter+ |

### Reports  `api/reports/`  *(Admin/Manager only)*

| Endpoint | Description | Query params |
|----------|-------------|--------------|
| `/api/reports/dashboard/` | Overview cards | — |
| `/api/reports/revenue/` | Daily revenue breakdown | `?days=30` |
| `/api/reports/top-items/` | Best-selling items | `?days=30&limit=10` |
| `/api/reports/orders/` | Order volume stats | `?days=30` |
| `/api/reports/reservations/` | Reservation analytics | `?days=30` |
| `/api/reports/staff/` | Staff performance | `?days=30` |

---

## User Roles

| Role | Permissions |
|------|------------|
| `admin` | Full access including user management and deletion |
| `manager` | Full access except user deletion |
| `waiter` | Orders, reservations, menu read |
| `kitchen` | Orders read/status update |

---

## Django Admin

Available at `/admin/` — all models registered with filters and inline editing.
