from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from .models import User


def make_user(email, role=User.ELEVE, password="testpass123", **kwargs):
    user = User(
        email=email,
        first_name="Test",
        last_name="User",
        role=role,
        is_active=True,
        password_set=True,
        **kwargs,
    )
    user.set_password(password)
    user.save()
    return user


def auth_client(user, password="testpass123"):
    client = APIClient()
    r = client.post(
        reverse("login"),
        {"email": user.email, "password": password},
        format="json",
    )
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['access']}")
    return client


class LoginTest(TestCase):
    def setUp(self):
        self.url = reverse("login")
        self.user = make_user("eleve@test.sn")

    def test_login_valide_retourne_tokens(self):
        r = APIClient().post(self.url, {"email": "eleve@test.sn", "password": "testpass123"})
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertIn("access", r.data)
        self.assertIn("refresh", r.data)
        self.assertIn("user", r.data)

    def test_login_mauvais_mot_de_passe(self):
        r = APIClient().post(self.url, {"email": "eleve@test.sn", "password": "mauvais"})
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_email_inexistant(self):
        r = APIClient().post(self.url, {"email": "nope@test.sn", "password": "testpass123"})
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_compte_inactif(self):
        self.user.is_active = False
        self.user.save()
        r = APIClient().post(self.url, {"email": "eleve@test.sn", "password": "testpass123"})
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_mot_de_passe_non_defini(self):
        user = make_user("invite@test.sn")
        user.password_set = False
        user.save()
        r = APIClient().post(self.url, {"email": "invite@test.sn", "password": "testpass123"})
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cinq_echecs_bloquent_le_compte(self):
        for _ in range(5):
            APIClient().post(self.url, {"email": "eleve@test.sn", "password": "mauvais"})
        self.user.refresh_from_db()
        self.assertIsNotNone(self.user.locked_until)


class MeViewTest(TestCase):
    def setUp(self):
        self.user = make_user("me@test.sn")
        self.client = auth_client(self.user)
        self.url = reverse("me")

    def test_get_profil_authentifie(self):
        r = self.client.get(self.url)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data["email"], "me@test.sn")

    def test_get_profil_non_authentifie(self):
        r = APIClient().get(self.url)
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_patch_profil(self):
        r = self.client.patch(self.url, {"first_name": "Nouveau"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data["first_name"], "Nouveau")


class SetupViewTest(TestCase):
    def setUp(self):
        self.url = reverse("setup")

    def test_setup_needed_quand_aucun_superuser(self):
        r = APIClient().get(self.url)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertTrue(r.data["setup_needed"])

    def test_creation_superuser_initiale(self):
        payload = {
            "first_name": "Super",
            "last_name": "Admin",
            "email": "super@ensmg.sn",
            "password": "superpass123",
            "password_confirm": "superpass123",
        }
        r = APIClient().post(self.url, payload, format="json")
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", r.data)
        self.assertTrue(User.objects.filter(role=User.SUPERUSER).exists())

    def test_setup_bloque_si_superuser_existe_deja(self):
        make_user("existing@ensmg.sn", role=User.SUPERUSER)
        payload = {
            "first_name": "Autre",
            "last_name": "Super",
            "email": "autre@ensmg.sn",
            "password": "superpass123",
            "password_confirm": "superpass123",
        }
        r = APIClient().post(self.url, payload, format="json")
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)


class ImportUsersCommandTest(TestCase):
    def _make_xlsx(self, rows):
        """Crée un fichier Excel en mémoire avec les lignes données."""
        import io
        import openpyxl
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.append(["N°", "Nom", "Prénom", "Email", "Téléphone", "Sexe"])
        for i, row in enumerate(rows, 1):
            ws.append([i] + list(row))
        buf = io.BytesIO()
        wb.save(buf)
        buf.seek(0)
        return buf

    def _save_xlsx(self, rows, path):
        import openpyxl
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.append(["N°", "Nom", "Prénom", "Email", "Téléphone", "Sexe"])
        for i, row in enumerate(rows, 1):
            ws.append([i] + list(row))
        wb.save(path)

    def setUp(self):
        import tempfile, os
        self.tmp = tempfile.mkdtemp()
        self.xlsx = os.path.join(self.tmp, "test.xlsx")
        self._save_xlsx([
            ("BA", "Fatou", "fatou.ba@ucad.edu.sn", "771234567", "Féminin"),
            ("DIOP", "Moussa", "moussa.diop@ucad.edu.sn", "772345678", "Masculin"),
        ], self.xlsx)

    def test_import_cree_les_comptes(self):
        from django.core.management import call_command
        call_command("import_users", self.xlsx, "--role", "eleve", verbosity=0)
        self.assertEqual(User.objects.filter(role=User.ELEVE).count(), 2)
        self.assertTrue(User.objects.filter(email="fatou.ba@ucad.edu.sn").exists())
        self.assertTrue(User.objects.filter(email="moussa.diop@ucad.edu.sn").exists())

    def test_import_mot_de_passe_fonctionne(self):
        from django.core.management import call_command
        call_command("import_users", self.xlsx, "--role", "eleve", verbosity=0)
        user = User.objects.get(email="fatou.ba@ucad.edu.sn")
        self.assertTrue(user.check_password("ENSMG2026"))

    def test_import_idempotent_pas_de_doublon(self):
        from django.core.management import call_command
        call_command("import_users", self.xlsx, "--role", "eleve", verbosity=0)
        call_command("import_users", self.xlsx, "--role", "eleve", verbosity=0)
        self.assertEqual(User.objects.filter(email="fatou.ba@ucad.edu.sn").count(), 1)

    def test_import_dry_run_ne_cree_rien(self):
        from django.core.management import call_command
        call_command("import_users", self.xlsx, "--role", "eleve", "--dry-run", verbosity=0)
        self.assertEqual(User.objects.count(), 0)

    def test_import_role_invalide_leve_erreur(self):
        from django.core.management import call_command, CommandError
        with self.assertRaises(CommandError):
            call_command("import_users", self.xlsx, "--role", "role_inexistant", verbosity=0)

    def test_import_log_member_import(self):
        from django.core.management import call_command
        from .models import MemberImport
        call_command("import_users", self.xlsx, "--role", "eleve", verbosity=0)
        self.assertEqual(MemberImport.objects.count(), 1)
        log = MemberImport.objects.first()
        self.assertEqual(log.rows_created, 2)
        self.assertEqual(log.rows_errors, 0)


class UserListTest(TestCase):
    def setUp(self):
        self.admin = make_user("admin@test.sn", role=User.ADMIN)
        self.eleve = make_user("eleve@test.sn", role=User.ELEVE)
        self.url = reverse("user_list")

    def test_admin_peut_lister_les_utilisateurs(self):
        client = auth_client(self.admin)
        r = client.get(self.url)
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_eleve_ne_peut_pas_lister_les_utilisateurs(self):
        client = auth_client(self.eleve)
        r = client.get(self.url)
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_non_authentifie_ne_peut_pas_lister(self):
        r = APIClient().get(self.url)
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)
