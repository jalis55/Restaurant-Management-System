from decimal import Decimal

from django.core.management.base import BaseCommand

from apps.menu.models import Category, MenuItem


SEED_MENU = [
    {
        "name": "Starters",
        "description": "Light bites and shareable appetizers.",
        "display_order": 1,
        "items": [
            {
                "name": "Crispy Calamari",
                "description": "Golden fried calamari served with lemon aioli.",
                "price": Decimal("8.99"),
                "preparation_time": 12,
                "calories": 420,
                "display_order": 1,
                "is_featured": True,
            },
            {
                "name": "Bruschetta",
                "description": "Toasted bread topped with tomato, basil, and olive oil.",
                "price": Decimal("6.50"),
                "preparation_time": 8,
                "calories": 280,
                "display_order": 2,
            },
            {
                "name": "Chicken Wings",
                "description": "Spicy glazed wings with ranch dip.",
                "price": Decimal("7.99"),
                "preparation_time": 14,
                "calories": 510,
                "display_order": 3,
            },
        ],
    },
    {
        "name": "Main Course",
        "description": "Hearty mains prepared fresh for lunch and dinner.",
        "display_order": 2,
        "items": [
            {
                "name": "Grilled Ribeye Steak",
                "description": "Juicy ribeye with mashed potato and seasonal vegetables.",
                "price": Decimal("24.99"),
                "preparation_time": 25,
                "calories": 820,
                "display_order": 1,
                "is_featured": True,
            },
            {
                "name": "Classic Beef Burger",
                "description": "Char-grilled beef patty with cheddar and house fries.",
                "price": Decimal("11.99"),
                "preparation_time": 15,
                "calories": 760,
                "display_order": 2,
            },
            {
                "name": "Creamy Chicken Pasta",
                "description": "Fettuccine with grilled chicken in parmesan cream sauce.",
                "price": Decimal("13.50"),
                "preparation_time": 18,
                "calories": 690,
                "display_order": 3,
            },
        ],
    },
    {
        "name": "Pizza",
        "description": "Stone-baked pizzas with house-made sauce.",
        "display_order": 3,
        "items": [
            {
                "name": "Margherita Pizza",
                "description": "Fresh mozzarella, basil, and tomato sauce.",
                "price": Decimal("10.99"),
                "preparation_time": 16,
                "calories": 640,
                "display_order": 1,
            },
            {
                "name": "Pepperoni Pizza",
                "description": "Loaded with pepperoni and mozzarella.",
                "price": Decimal("12.49"),
                "preparation_time": 17,
                "calories": 720,
                "display_order": 2,
                "is_featured": True,
            },
            {
                "name": "BBQ Chicken Pizza",
                "description": "Smoky barbecue chicken with red onion and cheese.",
                "price": Decimal("13.99"),
                "preparation_time": 18,
                "calories": 740,
                "display_order": 3,
            },
        ],
    },
    {
        "name": "Desserts",
        "description": "Sweet finishes for every table.",
        "display_order": 4,
        "items": [
            {
                "name": "New York Cheesecake",
                "description": "Rich cheesecake with berry compote.",
                "price": Decimal("6.99"),
                "preparation_time": 5,
                "calories": 450,
                "display_order": 1,
                "is_featured": True,
            },
            {
                "name": "Chocolate Lava Cake",
                "description": "Warm chocolate cake with a molten center.",
                "price": Decimal("7.49"),
                "preparation_time": 9,
                "calories": 520,
                "display_order": 2,
            },
            {
                "name": "Vanilla Ice Cream",
                "description": "Three scoops of vanilla bean ice cream.",
                "price": Decimal("4.50"),
                "preparation_time": 3,
                "calories": 300,
                "display_order": 3,
            },
        ],
    },
    {
        "name": "Beverages",
        "description": "Fresh juices, soft drinks, and cafe favorites.",
        "display_order": 5,
        "items": [
            {
                "name": "Fresh Orange Juice",
                "description": "Chilled juice made from pressed oranges.",
                "price": Decimal("3.99"),
                "preparation_time": 4,
                "calories": 160,
                "display_order": 1,
            },
            {
                "name": "Iced Coffee",
                "description": "Cold brewed coffee over ice with milk.",
                "price": Decimal("4.25"),
                "preparation_time": 5,
                "calories": 140,
                "display_order": 2,
            },
            {
                "name": "Mint Lemonade",
                "description": "House lemonade blended with fresh mint.",
                "price": Decimal("3.75"),
                "preparation_time": 4,
                "calories": 130,
                "display_order": 3,
                "is_featured": True,
            },
        ],
    },
]


class Command(BaseCommand):
    help = "Create or update demo menu categories and menu items for local development."

    def handle(self, *args, **options):
        created_categories = 0
        updated_categories = 0
        created_items = 0
        updated_items = 0

        for category_data in SEED_MENU:
            items = category_data["items"]
            category_defaults = {
                "description": category_data["description"],
                "display_order": category_data["display_order"],
                "is_active": True,
            }
            category, category_created = Category.objects.get_or_create(
                name=category_data["name"],
                defaults=category_defaults,
            )

            if category_created:
                created_categories += 1
            else:
                category_changed = False
                for field, value in category_defaults.items():
                    if getattr(category, field) != value:
                        setattr(category, field, value)
                        category_changed = True
                if category_changed:
                    category.save(update_fields=list(category_defaults.keys()))
                    updated_categories += 1

            for item_data in items:
                item_defaults = {
                    "description": item_data["description"],
                    "price": item_data["price"],
                    "image": item_data.get("image", ""),
                    "is_available": item_data.get("is_available", True),
                    "is_featured": item_data.get("is_featured", False),
                    "preparation_time": item_data.get("preparation_time", 15),
                    "calories": item_data.get("calories"),
                    "display_order": item_data.get("display_order", 0),
                }
                menu_item, item_created = MenuItem.objects.get_or_create(
                    category=category,
                    name=item_data["name"],
                    defaults=item_defaults,
                )

                if item_created:
                    created_items += 1
                    continue

                item_changed = False
                for field, value in item_defaults.items():
                    if getattr(menu_item, field) != value:
                        setattr(menu_item, field, value)
                        item_changed = True

                if item_changed:
                    menu_item.save(update_fields=list(item_defaults.keys()))
                    updated_items += 1

        self.stdout.write(
            self.style.SUCCESS(
                "Menu seed complete: "
                f"{created_categories} categories created, "
                f"{updated_categories} categories updated, "
                f"{created_items} items created, "
                f"{updated_items} items updated."
            )
        )

