from django.core.management.base import BaseCommand
from django.db import transaction


class Command(BaseCommand):
    help = "Crée le compte admin par défaut et les catégories initiales"

    @transaction.atomic
    def handle(self, *args, **options):
        from accounts.models import User
        from ideas.models import Category

        # Admin user
        if not User.objects.filter(email="admin@ensmg.sn").exists():
            User.objects.create_superuser(
                email="admin@ensmg.sn",
                password="passer01",
                first_name="Administrateur",
                last_name="ENSMG",
                role=User.ADMIN,
                password_set=True,
            )
            self.stdout.write(self.style.SUCCESS("Admin créé : admin@ensmg.sn / passer01"))
        else:
            self.stdout.write("Admin déjà existant.")

        # Categories
        categories = [
            ("Pédagogie et Formation", "pedagogie-formation", 1),
            ("Infrastructure et Équipements", "infrastructure-equipements", 2),
            ("Vie étudiante", "vie-etudiante", 3),
            ("Numérique et Systèmes d'information", "numerique-si", 4),
            ("Recherche et Innovation", "recherche-innovation", 5),
            ("Administration et Services", "administration-services", 6),
            ("Autre", "autre", 7),
        ]

        for name, slug, order in categories:
            cat, created = Category.objects.get_or_create(
                slug=slug,
                defaults={"name": name, "order": order}
            )
            if created:
                self.stdout.write(f"Catégorie créée : {name}")

        self.stdout.write(self.style.SUCCESS("Initialisation terminée."))
