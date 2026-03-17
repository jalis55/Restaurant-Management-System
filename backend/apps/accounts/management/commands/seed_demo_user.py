from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create or update a demo admin user for local development."

    def handle(self, *args, **options):
        user_model = get_user_model()
        username = "demo_admin"
        password = "DemoAdmin123!"

        user, created = user_model.objects.get_or_create(
            username=username,
            defaults={
                "email": "demo_admin@example.com",
                "first_name": "Demo",
                "last_name": "Admin",
                "role": "admin",
                "is_active": True,
            },
        )

        updated = False
        if user.email != "demo_admin@example.com":
            user.email = "demo_admin@example.com"
            updated = True
        if user.first_name != "Demo":
            user.first_name = "Demo"
            updated = True
        if user.last_name != "Admin":
            user.last_name = "Admin"
            updated = True
        if user.role != "admin":
            user.role = "admin"
            updated = True
        if not user.is_active:
            user.is_active = True
            updated = True

        user.set_password(password)
        user.save()

        action = "Created" if created else "Updated"
        if updated or created:
            self.stdout.write(self.style.SUCCESS(f"{action} demo user '{username}' with password '{password}'"))
        else:
            self.stdout.write(self.style.SUCCESS(f"Reset password for demo user '{username}' to '{password}'"))
