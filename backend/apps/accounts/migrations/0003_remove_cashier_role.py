from django.db import migrations, models


def migrate_cashier_users_to_waiter(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    User.objects.filter(role="cashier").update(role="waiter")


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0002_alter_user_is_active"),
    ]

    operations = [
        migrations.RunPython(migrate_cashier_users_to_waiter, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="user",
            name="role",
            field=models.CharField(
                choices=[
                    ("admin", "Admin"),
                    ("manager", "Manager"),
                    ("waiter", "Waiter"),
                    ("kitchen", "Kitchen"),
                ],
                default="waiter",
                max_length=20,
            ),
        ),
    ]
