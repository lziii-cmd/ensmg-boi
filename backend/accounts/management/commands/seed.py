from django.core.management.base import BaseCommand
from django.db import transaction


class Command(BaseCommand):
    help = "Cree le compte admin, superuser par defaut et les categories initiales"

    @transaction.atomic
    def handle(self, *args, **options):
        from accounts.models import User
        from ideas.models import Category

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
            u.set_password("passer01")
            u.save()
            self.stdout.write(self.style.SUCCESS("Admin cree : admin@ensmg.sn / passer01"))
        else:
            self.stdout.write("Admin deja existant.")

        # ── Superuser (acces total) ──
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
            u.set_password("passer01")
            u.save()
            self.stdout.write(self.style.SUCCESS("Superuser cree : superuser@ensmg.sn / passer01"))
        else:
            self.stdout.write("Superuser deja existant.")

        # ── Categories ──
        categories = [
            ("Pedagogie et Formation", "pedagogie-formation", 1),
            ("Infrastructure et Equipements", "infrastructure-equipements", 2),
            ("Vie etudiante", "vie-etudiante", 3),
            ("Numerique et Systemes d'information", "numerique-si", 4),
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
                self.stdout.write(f"Categorie creee : {name}")

        self.stdout.write(self.style.SUCCESS("Initialisation terminee."))
