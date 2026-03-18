from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.menu.models import Category, MenuItem
from apps.orders.models import Order, OrderStatus, OrderType
from apps.reservations.models import Reservation, ReservationStatus, Table

User = get_user_model()


class BaseAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="AdminPass123!",
            first_name="Admin",
            last_name="User",
            role="admin",
            is_superuser=True,
        )
        self.manager = User.objects.create_user(
            username="manager",
            email="manager@example.com",
            password="ManagerPass123!",
            first_name="Manager",
            last_name="User",
            role="manager",
        )
        self.waiter = User.objects.create_user(
            username="waiter",
            email="waiter@example.com",
            password="WaiterPass123!",
            first_name="Waiter",
            last_name="User",
            role="waiter",
        )
        self.kitchen = User.objects.create_user(
            username="kitchen",
            email="kitchen@example.com",
            password="KitchenPass123!",
            first_name="Kitchen",
            last_name="User",
            role="kitchen",
        )
        self.category = Category.objects.create(name="Main", description="Main dishes", display_order=1)
        self.featured_category = Category.objects.create(name="Dessert", description="Sweet", display_order=2)
        self.menu_item = MenuItem.objects.create(
            category=self.category,
            name="Burger",
            description="Beef burger",
            price=Decimal("9.99"),
            is_featured=False,
            preparation_time=10,
        )
        self.featured_item = MenuItem.objects.create(
            category=self.featured_category,
            name="Cheesecake",
            description="Creamy dessert",
            price=Decimal("5.50"),
            is_featured=True,
            preparation_time=5,
        )
        self.table = Table.objects.create(number=1, capacity=4, location="Main Hall")

    def auth_client(self, user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client


class AuthAPITests(BaseAPITestCase):
    def test_token_me_and_change_password_flow(self):
        token_response = self.client.post(
            "/api/auth/token/",
            {"username": "waiter", "password": "WaiterPass123!"},
            format="json",
        )
        self.assertEqual(token_response.status_code, status.HTTP_200_OK)
        self.assertNotIn("access", token_response.data)
        self.assertNotIn("refresh", token_response.data)
        self.assertIn("access_token", token_response.cookies)
        self.assertIn("refresh_token", token_response.cookies)
        self.assertTrue(token_response.cookies["access_token"]["httponly"])
        self.assertTrue(token_response.cookies["refresh_token"]["httponly"])

        authed = APIClient()
        authed.cookies = token_response.cookies

        me_response = authed.get("/api/auth/users/me/")
        self.assertEqual(me_response.status_code, status.HTTP_200_OK)
        self.assertEqual(me_response.data["username"], "waiter")

        password_response = authed.post(
            "/api/auth/users/change_password/",
            {"old_password": "WaiterPass123!", "new_password": "NewWaiterPass123!"},
            format="json",
        )
        self.assertEqual(password_response.status_code, status.HTTP_200_OK)

        relogin_response = self.client.post(
            "/api/auth/token/",
            {"username": "waiter", "password": "NewWaiterPass123!"},
            format="json",
        )
        self.assertEqual(relogin_response.status_code, status.HTTP_200_OK)

    def test_refresh_and_logout_flow_with_http_only_cookies(self):
        login_response = self.client.post(
            "/api/auth/token/",
            {"username": "waiter", "password": "WaiterPass123!"},
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)

        client = APIClient()
        client.cookies = login_response.cookies

        refresh_response = client.post("/api/auth/token/refresh/", {}, format="json")
        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        self.assertNotIn("access", refresh_response.data)
        self.assertIn("access_token", refresh_response.cookies)
        self.assertTrue(refresh_response.cookies["access_token"]["httponly"])

        logout_response = client.post("/api/auth/logout/", {}, format="json")
        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)
        self.assertEqual(logout_response.cookies["access_token"].value, "")
        self.assertEqual(logout_response.cookies["refresh_token"].value, "")

    def test_manager_can_create_user_and_waiter_cannot(self):
        manager_client = self.auth_client(self.manager)
        create_payload = {
            "username": "kitchen1",
            "email": "kitchen1@example.com",
            "first_name": "Kitchen",
            "last_name": "Crew",
            "role": "kitchen",
            "phone": "0123456",
            "is_active": True,
            "password": "KitchenPass123!",
        }
        ok_response = manager_client.post("/api/auth/users/", create_payload, format="json")
        self.assertEqual(ok_response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username="kitchen1").exists())

        waiter_client = self.auth_client(self.waiter)
        denied_response = waiter_client.post(
            "/api/auth/users/",
            {
                **create_payload,
                "username": "kitchen2",
                "email": "kitchen2@example.com",
            },
            format="json",
        )
        self.assertEqual(denied_response.status_code, status.HTTP_403_FORBIDDEN)

    def test_manager_cannot_create_admin_or_manager_accounts(self):
        manager_client = self.auth_client(self.manager)

        admin_response = manager_client.post(
            "/api/auth/users/",
            {
                "username": "admin2",
                "email": "admin2@example.com",
                "first_name": "Admin",
                "last_name": "Two",
                "role": "admin",
                "phone": "0123456",
                "is_active": True,
                "password": "AdminPass456!",
            },
            format="json",
        )
        self.assertEqual(admin_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("role", admin_response.data)

        manager_response = manager_client.post(
            "/api/auth/users/",
            {
                "username": "manager2",
                "email": "manager2@example.com",
                "first_name": "Manager",
                "last_name": "Two",
                "role": "manager",
                "phone": "0123456",
                "is_active": True,
                "password": "ManagerPass456!",
            },
            format="json",
        )
        self.assertEqual(manager_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("role", manager_response.data)

    def test_manager_only_sees_self_waiters_and_kitchen_users(self):
        extra_manager = User.objects.create_user(
            username="manager2",
            email="manager2@example.com",
            password="ManagerPass123!",
            first_name="Second",
            last_name="Manager",
            role="manager",
        )
        admin_two = User.objects.create_user(
            username="admin2",
            email="admin2@example.com",
            password="AdminPass123!",
            first_name="Second",
            last_name="Admin",
            role="admin",
            is_superuser=True,
        )
        extra_waiter = User.objects.create_user(
            username="waiter2",
            email="waiter2@example.com",
            password="WaiterPass123!",
            first_name="Second",
            last_name="Waiter",
            role="waiter",
        )

        manager_client = self.auth_client(self.manager)
        response = manager_client.get("/api/auth/users/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        usernames = {row["username"] for row in response.data}
        self.assertIn("manager", usernames)
        self.assertIn("waiter", usernames)
        self.assertIn(extra_waiter.username, usernames)
        self.assertIn("kitchen", usernames)
        self.assertNotIn(extra_manager.username, usernames)
        self.assertNotIn(admin_two.username, usernames)

    def test_manager_cannot_retrieve_or_update_other_managers_and_admins(self):
        extra_manager = User.objects.create_user(
            username="manager2",
            email="manager2@example.com",
            password="ManagerPass123!",
            first_name="Second",
            last_name="Manager",
            role="manager",
        )
        admin_two = User.objects.create_user(
            username="admin2",
            email="admin2@example.com",
            password="AdminPass123!",
            first_name="Second",
            last_name="Admin",
            role="admin",
            is_superuser=True,
        )

        manager_client = self.auth_client(self.manager)

        retrieve_manager = manager_client.get(f"/api/auth/users/{extra_manager.id}/")
        self.assertEqual(retrieve_manager.status_code, status.HTTP_404_NOT_FOUND)

        retrieve_admin = manager_client.get(f"/api/auth/users/{admin_two.id}/")
        self.assertEqual(retrieve_admin.status_code, status.HTTP_404_NOT_FOUND)

        update_manager = manager_client.patch(
            f"/api/auth/users/{extra_manager.id}/",
            {"first_name": "Blocked"},
            format="json",
        )
        self.assertEqual(update_manager.status_code, status.HTTP_404_NOT_FOUND)

    def test_manager_can_update_waiter_but_cannot_promote_them(self):
        manager_client = self.auth_client(self.manager)

        update_response = manager_client.patch(
            f"/api/auth/users/{self.waiter.id}/",
            {"first_name": "Updated", "role": "kitchen"},
            format="json",
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.waiter.refresh_from_db()
        self.assertEqual(self.waiter.first_name, "Updated")
        self.assertEqual(self.waiter.role, "kitchen")

        promote_response = manager_client.patch(
            f"/api/auth/users/{self.waiter.id}/",
            {"role": "manager"},
            format="json",
        )
        self.assertEqual(promote_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("role", promote_response.data)


class MenuAPITests(BaseAPITestCase):
    def test_staff_can_list_category_items_and_featured_menu_items(self):
        client = self.auth_client(self.waiter)

        category_response = client.get(f"/api/menu/categories/{self.category.id}/items/")
        self.assertEqual(category_response.status_code, status.HTTP_200_OK)
        self.assertEqual(category_response.data[0]["name"], "Burger")

        featured_response = client.get("/api/menu/items/featured/")
        self.assertEqual(featured_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(featured_response.data), 1)
        self.assertEqual(featured_response.data[0]["name"], "Cheesecake")

    def test_menu_filters_and_toggle_availability(self):
        manager_client = self.auth_client(self.manager)
        filter_response = manager_client.get("/api/menu/items/", {"category": self.category.id, "min_price": "9.00"})
        self.assertEqual(filter_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(filter_response.data), 1)
        self.assertEqual(filter_response.data[0]["name"], "Burger")

        toggle_response = manager_client.patch(f"/api/menu/items/{self.menu_item.id}/toggle_availability/")
        self.assertEqual(toggle_response.status_code, status.HTTP_200_OK)
        self.menu_item.refresh_from_db()
        self.assertFalse(self.menu_item.is_available)


class OrdersAPITests(BaseAPITestCase):
    @patch("apps.orders.serializers.broadcast_order_event")
    def test_waiter_can_create_order_and_kitchen_can_update_status(self, broadcast_event):
        waiter_client = self.auth_client(self.waiter)
        create_response = waiter_client.post(
            "/api/orders/",
            {
                "table_number": 7,
                "order_type": OrderType.DINE_IN,
                "notes": "No onions",
                "items": [
                    {
                        "menu_item": self.menu_item.id,
                        "quantity": 2,
                        "notes": "Extra sauce",
                    }
                ],
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        order = Order.objects.get(pk=create_response.data["id"])
        self.assertEqual(order.total_amount, Decimal("19.98"))
        self.assertEqual(order.status, OrderStatus.PENDING)
        broadcast_event.assert_called_with("order.created", create_response.data)

        kitchen_client = self.auth_client(self.kitchen)
        update_response = kitchen_client.patch(
            f"/api/orders/{order.id}/update_status/",
            {"status": OrderStatus.CONFIRMED},
            format="json",
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.status, OrderStatus.CONFIRMED)

    def test_invalid_order_transition_is_rejected(self):
        order = Order.objects.create(
            table_number=3,
            order_type=OrderType.DINE_IN,
            created_by=self.waiter,
            status=OrderStatus.PENDING,
        )
        order.items.create(menu_item=self.menu_item, quantity=1, unit_price=self.menu_item.price)
        order.recalculate_total()

        waiter_client = self.auth_client(self.waiter)
        response = waiter_client.patch(
            f"/api/orders/{order.id}/update_status/",
            {"status": OrderStatus.READY},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_kitchen_cannot_serve_or_cancel_ready_order(self):
        order = Order.objects.create(
            table_number=4,
            order_type=OrderType.DINE_IN,
            created_by=self.waiter,
            status=OrderStatus.READY,
        )
        order.items.create(menu_item=self.menu_item, quantity=1, unit_price=self.menu_item.price)
        order.recalculate_total()

        kitchen_client = self.auth_client(self.kitchen)

        serve_response = kitchen_client.patch(
            f"/api/orders/{order.id}/update_status/",
            {"status": OrderStatus.SERVED},
            format="json",
        )
        self.assertEqual(serve_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("status", serve_response.data)

        cancel_response = kitchen_client.patch(
            f"/api/orders/{order.id}/update_status/",
            {"status": OrderStatus.CANCELLED},
            format="json",
        )
        self.assertEqual(cancel_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("status", cancel_response.data)

    def test_waiter_cannot_confirm_order(self):
        order = Order.objects.create(
            table_number=5,
            order_type=OrderType.DINE_IN,
            created_by=self.waiter,
            status=OrderStatus.PENDING,
        )
        order.items.create(menu_item=self.menu_item, quantity=1, unit_price=self.menu_item.price)
        order.recalculate_total()

        waiter_client = self.auth_client(self.waiter)
        response = waiter_client.patch(
            f"/api/orders/{order.id}/update_status/",
            {"status": OrderStatus.CONFIRMED},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("status", response.data)

    @patch("apps.orders.serializers.broadcast_order_event")
    def test_manager_can_bill_served_order_with_percentage_discount(self, broadcast_event):
        order = Order.objects.create(
            table_number=8,
            order_type=OrderType.DINE_IN,
            created_by=self.waiter,
            status=OrderStatus.SERVED,
        )
        order.items.create(menu_item=self.menu_item, quantity=2, unit_price=self.menu_item.price)
        order.recalculate_total()

        manager_client = self.auth_client(self.manager)
        response = manager_client.patch(
            f"/api/orders/{order.id}/bill/",
            {"discount_type": "percentage", "discount_value": "10.00"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.discount_type, "percentage")
        self.assertEqual(order.discount_amount, Decimal("2.00"))
        self.assertEqual(order.final_amount, Decimal("17.98"))
        self.assertEqual(order.billed_by, self.manager)
        self.assertIsNotNone(order.billed_at)
        broadcast_event.assert_called_with("order.billed", response.data)

    def test_manager_cannot_bill_order_before_it_is_served(self):
        order = Order.objects.create(
            table_number=9,
            order_type=OrderType.DINE_IN,
            created_by=self.waiter,
            status=OrderStatus.READY,
        )
        order.items.create(menu_item=self.menu_item, quantity=1, unit_price=self.menu_item.price)
        order.recalculate_total()

        manager_client = self.auth_client(self.manager)
        response = manager_client.patch(
            f"/api/orders/{order.id}/bill/",
            {"discount_type": "amount", "discount_value": "1.00"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("detail", response.data)


class ReservationAPITests(BaseAPITestCase):
    def test_create_today_and_availability_flows(self):
        client = self.auth_client(self.waiter)
        start = timezone.now() + timedelta(hours=2)
        end = start + timedelta(hours=1)

        create_response = client.post(
            "/api/reservations/",
            {
                "table": self.table.id,
                "guest_name": "Jane Doe",
                "guest_phone": "123456789",
                "guest_email": "jane@example.com",
                "party_size": 2,
                "reserved_at": start.isoformat(),
                "reserved_until": end.isoformat(),
                "special_requests": "Window seat",
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)

        overlapping_response = client.post(
            "/api/reservations/tables/availability/",
            {
                "party_size": 2,
                "reserved_at": start.isoformat(),
                "reserved_until": end.isoformat(),
            },
            format="json",
        )
        self.assertEqual(overlapping_response.status_code, status.HTTP_200_OK)
        self.assertEqual(overlapping_response.data, [])

        today_reservation = Reservation.objects.create(
            table=self.table,
            guest_name="Today Guest",
            guest_phone="999",
            guest_email="today@example.com",
            party_size=2,
            reserved_at=timezone.now() + timedelta(minutes=30),
            reserved_until=timezone.now() + timedelta(hours=1, minutes=30),
            status=ReservationStatus.CONFIRMED,
            created_by=self.waiter,
        )
        today_response = client.get("/api/reservations/today/")
        self.assertEqual(today_response.status_code, status.HTTP_200_OK)
        self.assertTrue(any(row["id"] == today_reservation.id for row in today_response.data))

    def test_reservation_overlap_is_rejected(self):
        start = timezone.now() + timedelta(hours=4)
        end = start + timedelta(hours=1)
        Reservation.objects.create(
            table=self.table,
            guest_name="Booked",
            guest_phone="111",
            party_size=2,
            reserved_at=start,
            reserved_until=end,
            status=ReservationStatus.CONFIRMED,
            created_by=self.waiter,
        )

        client = self.auth_client(self.waiter)
        response = client.post(
            "/api/reservations/",
            {
                "table": self.table.id,
                "guest_name": "Overlap",
                "guest_phone": "222",
                "party_size": 2,
                "reserved_at": (start + timedelta(minutes=15)).isoformat(),
                "reserved_until": (end + timedelta(minutes=15)).isoformat(),
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ReportsAPITests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        served_order = Order.objects.create(
            table_number=5,
            order_type=OrderType.DINE_IN,
            created_by=self.manager,
            status=OrderStatus.SERVED,
        )
        served_order.items.create(menu_item=self.menu_item, quantity=3, unit_price=self.menu_item.price)
        served_order.recalculate_total()
        Reservation.objects.create(
            table=self.table,
            guest_name="Report Guest",
            guest_phone="777",
            guest_email="report@example.com",
            party_size=2,
            reserved_at=timezone.now() + timedelta(hours=6),
            reserved_until=timezone.now() + timedelta(hours=7),
            status=ReservationStatus.CONFIRMED,
            created_by=self.manager,
        )

    def test_manager_can_access_report_endpoints(self):
        client = self.auth_client(self.manager)

        dashboard_response = client.get("/api/reports/dashboard/")
        self.assertEqual(dashboard_response.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(str(dashboard_response.data["revenue"])), Decimal("29.97"))

        revenue_response = client.get("/api/reports/revenue/?days=30")
        self.assertEqual(revenue_response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(revenue_response.data) >= 1)

        top_items_response = client.get("/api/reports/top-items/?days=30&limit=5")
        self.assertEqual(top_items_response.status_code, status.HTTP_200_OK)
        self.assertEqual(top_items_response.data[0]["menu_item__name"], "Burger")

        orders_response = client.get("/api/reports/orders/")
        self.assertEqual(orders_response.status_code, status.HTTP_200_OK)
        self.assertIn("by_status", orders_response.data)

        reservations_response = client.get("/api/reports/reservations/")
        self.assertEqual(reservations_response.status_code, status.HTTP_200_OK)
        self.assertIn("by_day", reservations_response.data)

        staff_response = client.get("/api/reports/staff/")
        self.assertEqual(staff_response.status_code, status.HTTP_200_OK)
        self.assertEqual(staff_response.data[0]["created_by__username"], "manager")

    def test_waiter_cannot_access_reports(self):
        client = self.auth_client(self.waiter)
        response = client.get("/api/reports/dashboard/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class MenuSeedCommandTests(TestCase):
    def test_seed_menu_command_is_idempotent(self):
        call_command("seed_menu")
        self.assertEqual(Category.objects.count(), 5)
        self.assertEqual(MenuItem.objects.count(), 15)

        featured_items = MenuItem.objects.filter(is_featured=True).count()
        self.assertGreater(featured_items, 0)

        call_command("seed_menu")
        self.assertEqual(Category.objects.count(), 5)
        self.assertEqual(MenuItem.objects.count(), 15)
