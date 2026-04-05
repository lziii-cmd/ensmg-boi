import os
from django.core.management.base import BaseCommand
from django.db import transaction


class Command(BaseCommand):
    help = "Crée le compte admin, superuser par défaut et les catégories initiales"

    @transaction.atomic
    def handle(self, *args, **options):
        from accounts.models import User
        from ideas.models import Category

        admin_password = os.environ.get("SEED_ADMIN_PASSWORD", "passer01")
        superuser_password = os.environ.get("SEED_SUPERUSER_PASSWORD", "passer01")

        # ── Compte Admin (gestion utilisateurs + audit uniquement) ──
        if not User.objects.filter(email="admin@ensmg.sn").exists():
            u = User.objects.create(
                email="admin@ensmg.sn",
                first_name="Administrateur",
                last_name="ENSMG",
                role=User.ADMIN,
                department="Service Informatique",
                is_active=True,
                is_staff=True,
                password_set=True,
            )
            u.set_password(admin_password)
            u.save()
            self.stdout.write(self.style.SUCCESS("Admin créé : admin@ensmg.sn"))
        else:
            self.stdout.write("Admin déjà existant.")

        # ── Superuser (accès total) ──
        if not User.objects.filter(email="superuser@ensmg.sn").exists():
            u = User.objects.create(
                email="superuser@ensmg.sn",
                first_name="Super",
                last_name="Administrateur",
                role=User.SUPERUSER,
                is_active=True,
                is_staff=True,
                is_superuser=True,
                password_set=True,
            )
            u.set_password(superuser_password)
            u.save()
            self.stdout.write(self.style.SUCCESS("Superuser créé : superuser@ensmg.sn"))
        else:
            self.stdout.write("Superuser déjà existant.")

        # ── Catégories ──
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
            _, created = Category.objects.get_or_create(
                slug=slug,
                defaults={"name": name, "order": order}
            )
            if created:
                self.stdout.write(f"Catégorie créée : {name}")

        self.stdout.write(self.style.SUCCESS("Initialisation terminée."))
