"""
Commande : python manage.py import_users <fichier.xlsx> [options]

Colonnes attendues dans l'Excel (dans cet ordre) :
  N° | Nom | Prénom | Email | Téléphone | Sexe

Options :
  --role    Rôle assigné à tous les comptes créés (défaut : eleve)
  --dry-run Simule sans rien écrire en base
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

DEFAULT_PASSWORD = "ENSMG2026"


class Command(BaseCommand):
    help = "Importe des membres depuis un fichier Excel (.xlsx)"

    def add_arguments(self, parser):
        parser.add_argument("fichier", type=str, help="Chemin vers le fichier Excel")
        parser.add_argument(
            "--role",
            type=str,
            default="eleve",
            help="Rôle assigné aux comptes créés (défaut : eleve)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Simule l'import sans écrire en base",
        )

    def handle(self, *args, **options):
        try:
            import openpyxl
        except ImportError:
            raise CommandError("openpyxl n'est pas installé. Lancez : pip install openpyxl")

        from accounts.models import User, MemberImport, AuditLog

        fichier = options["fichier"]
        role = options["role"].lower()
        dry_run = options["dry_run"]

        # ── Validation du rôle ────────────────────────────────────────────
        roles_valides = [r[0] for r in User.ROLE_CHOICES]
        if role not in roles_valides:
            raise CommandError(
                f"Rôle invalide : '{role}'. Choisissez parmi : {', '.join(roles_valides)}"
            )

        # ── Chargement du fichier ─────────────────────────────────────────
        try:
            wb = openpyxl.load_workbook(fichier, read_only=True, data_only=True)
            ws = wb.active
        except FileNotFoundError:
            raise CommandError(f"Fichier introuvable : {fichier}")
        except Exception as e:
            raise CommandError(f"Impossible d'ouvrir le fichier : {e}")

        if dry_run:
            self.stdout.write(self.style.WARNING("=== MODE DRY-RUN — aucune écriture en base ===\n"))

        # ── Lecture des lignes ────────────────────────────────────────────
        lignes = []
        for i, row in enumerate(ws.iter_rows(values_only=True), start=1):
            if i == 1:
                continue  # skip en-tête
            # Ignorer les lignes vides ou la ligne TOTAL
            if not row or row[0] is None:
                continue
            if str(row[0]).strip().upper() == "TOTAL":
                continue

            try:
                _, nom, prenom, email, _tel, _sexe = row[:6]
            except ValueError:
                self.stdout.write(self.style.WARNING(f"  Ligne {i} ignorée — format inattendu"))
                continue

            if not email or not nom or not prenom:
                self.stdout.write(self.style.WARNING(f"  Ligne {i} ignorée — données manquantes"))
                continue

            lignes.append({
                "last_name": str(nom).strip(),
                "first_name": str(prenom).strip(),
                "email": str(email).strip().lower(),
            })

        wb.close()

        if not lignes:
            raise CommandError("Aucune ligne valide trouvée dans le fichier.")

        self.stdout.write(f"{len(lignes)} ligne(s) lue(s) dans le fichier.\n")

        # ── Création des comptes ──────────────────────────────────────────
        nb_crees = 0
        nb_existants = 0
        nb_erreurs = 0
        erreurs = []

        for ligne in lignes:
            email = ligne["email"]
            try:
                if dry_run:
                    existe = User.objects.filter(email=email).exists()
                    if existe:
                        self.stdout.write(f"  [SKIP]    {email} — déjà existant")
                        nb_existants += 1
                    else:
                        self.stdout.write(f"  [CRÉER]   {ligne['first_name']} {ligne['last_name']} <{email}>")
                        nb_crees += 1
                    continue

                with transaction.atomic():
                    user, created = User.objects.get_or_create(
                        email=email,
                        defaults={
                            "first_name": ligne["first_name"],
                            "last_name": ligne["last_name"],
                            "role": role,
                            "is_active": True,
                            "password_set": True,
                        },
                    )
                    if created:
                        user.set_password(DEFAULT_PASSWORD)
                        user.save(update_fields=["password"])
                        self.stdout.write(
                            self.style.SUCCESS(
                                f"  [OK]      {user.first_name} {user.last_name} <{email}>"
                            )
                        )
                        nb_crees += 1
                    else:
                        self.stdout.write(f"  [SKIP]    {email} — déjà existant")
                        nb_existants += 1

            except Exception as e:
                msg = f"{email} — {e}"
                self.stdout.write(self.style.ERROR(f"  [ERREUR]  {msg}"))
                erreurs.append(msg)
                nb_erreurs += 1

        # ── Log MemberImport ──────────────────────────────────────────────
        if not dry_run:
            import os
            MemberImport.objects.create(
                imported_by=None,
                file_name=os.path.basename(fichier),
                rows_processed=len(lignes),
                rows_created=nb_crees,
                rows_updated=0,
                rows_errors=nb_erreurs,
                errors=erreurs,
            )

        # ── Résumé final ──────────────────────────────────────────────────
        sep = "-" * 50
        self.stdout.write("\n" + sep)
        if dry_run:
            self.stdout.write(self.style.WARNING("SIMULATION terminee (rien n'a ete cree) :"))
        else:
            self.stdout.write(self.style.SUCCESS("Import termine :"))

        self.stdout.write(f"  Traites   : {len(lignes)}")
        self.stdout.write(self.style.SUCCESS(f"  Crees     : {nb_crees}"))
        self.stdout.write(f"  Existants : {nb_existants}")
        if nb_erreurs:
            self.stdout.write(self.style.ERROR(f"  Erreurs   : {nb_erreurs}"))
        self.stdout.write(sep)
