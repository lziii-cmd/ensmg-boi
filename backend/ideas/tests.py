from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User
from .models import Category, Idea


def make_user(email, role=User.ELEVE, password="testpass123"):
    user = User(
        email=email,
        first_name="Test",
        last_name="User",
        role=role,
        is_active=True,
        password_set=True,
    )
    user.set_password(password)
    user.save()
    return user


def make_category(name="Pédagogie"):
    return Category.objects.create(name=name, slug=name.lower().replace(" ", "-"))


def make_idea(author, category, title="Une idée", status=Idea.EN_ATTENTE, visibility=Idea.PUBLIC):
    return Idea.objects.create(
        title=title,
        description="Description de l'idée.",
        category=category,
        author=author,
        status=status,
        visibility=visibility,
    )


def auth_client(user, password="testpass123"):
    client = APIClient()
    r = client.post(
        reverse("login"),
        {"email": user.email, "password": password},
        format="json",
    )
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['access']}")
    return client


class CategoryListTest(TestCase):
    def setUp(self):
        self.user = make_user("eleve@test.sn")
        self.cat = make_category()
        self.url = reverse("category_list")

    def test_liste_categories_authentifie(self):
        r = auth_client(self.user).get(self.url)
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_liste_categories_non_authentifie(self):
        r = APIClient().get(self.url)
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)


class IdeaCreateTest(TestCase):
    def setUp(self):
        self.eleve = make_user("eleve@test.sn", role=User.ELEVE)
        self.responsable = make_user("responsable@test.sn", role=User.RESPONSABLE)
        self.admin = make_user("admin@test.sn", role=User.ADMIN)
        self.cat = make_category()
        self.url = reverse("idea_create")
        self.payload = {
            "title": "Ma super idée",
            "description": "Une description valide.",
            "category_id": self.cat.pk,
            "visibility": "public",
        }

    def test_eleve_peut_creer_une_idee(self):
        r = auth_client(self.eleve).post(self.url, self.payload, format="json")
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)

    def test_professeur_peut_creer_une_idee(self):
        prof = make_user("prof@test.sn", role=User.PROFESSEUR)
        r = auth_client(prof).post(self.url, self.payload, format="json")
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)

    def test_responsable_ne_peut_pas_creer_une_idee(self):
        r = auth_client(self.responsable).post(self.url, self.payload, format="json")
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_ne_peut_pas_creer_une_idee(self):
        r = auth_client(self.admin).post(self.url, self.payload, format="json")
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_non_authentifie_ne_peut_pas_creer(self):
        r = APIClient().post(self.url, self.payload, format="json")
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)


class IdeaListVisibilityTest(TestCase):
    def setUp(self):
        self.auteur = make_user("auteur@test.sn")
        self.autre = make_user("autre@test.sn")
        self.responsable = make_user("resp@test.sn", role=User.RESPONSABLE)
        self.cat = make_category()
        self.url = reverse("idea_list")

    def test_responsable_voit_toutes_les_idees(self):
        make_idea(self.auteur, self.cat, status=Idea.BROUILLON)
        make_idea(self.auteur, self.cat, status=Idea.PUBLIEE)
        r = auth_client(self.responsable).get(self.url)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data["count"], 2)

    def test_membre_voit_seulement_idees_publiees_et_siennes(self):
        make_idea(self.auteur, self.cat, title="Brouillon auteur", status=Idea.BROUILLON)
        make_idea(self.auteur, self.cat, title="Publiée auteur", status=Idea.PUBLIEE)
        make_idea(self.autre, self.cat, title="Brouillon autre", status=Idea.BROUILLON)

        r = auth_client(self.auteur).get(self.url)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        titres = [i["title"] for i in r.data["results"]]
        self.assertIn("Publiée auteur", titres)
        self.assertIn("Brouillon auteur", titres)
        self.assertNotIn("Brouillon autre", titres)


class IdeaStatusUpdateTest(TestCase):
    def setUp(self):
        self.auteur = make_user("auteur@test.sn")
        self.responsable = make_user("resp@test.sn", role=User.RESPONSABLE)
        self.cat = make_category()
        self.idea = make_idea(self.auteur, self.cat, status=Idea.EN_ATTENTE)

    def _url(self):
        return reverse("idea_status", kwargs={"pk": self.idea.pk})

    def test_responsable_peut_changer_le_statut(self):
        r = auth_client(self.responsable).patch(
            self._url(), {"status": Idea.PUBLIEE}, format="json"
        )
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.idea.refresh_from_db()
        self.assertEqual(self.idea.status, Idea.PUBLIEE)

    def test_responsable_peut_rejeter_avec_motif(self):
        r = auth_client(self.responsable).patch(
            self._url(),
            {"status": Idea.REJETEE, "rejection_category": Idea.BUDGET, "comment": "Budget trop élevé."},
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.idea.refresh_from_db()
        self.assertEqual(self.idea.status, Idea.REJETEE)
        self.assertEqual(self.idea.rejection_category, Idea.BUDGET)

    def test_eleve_ne_peut_pas_changer_le_statut(self):
        r = auth_client(self.auteur).patch(
            self._url(), {"status": Idea.PUBLIEE}, format="json"
        )
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)


class VoteTest(TestCase):
    def setUp(self):
        self.eleve = make_user("eleve@test.sn")
        self.responsable = make_user("resp@test.sn", role=User.RESPONSABLE)
        self.cat = make_category()
        self.idea = make_idea(
            make_user("auteur@test.sn"), self.cat, status=Idea.PUBLIEE
        )

    def _url(self):
        return reverse("idea_vote", kwargs={"pk": self.idea.pk})

    def test_eleve_peut_voter(self):
        r = auth_client(self.eleve).post(self._url())
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertTrue(r.data["voted"])
        self.assertEqual(r.data["vote_count"], 1)

    def test_voter_deux_fois_annule_le_vote(self):
        client = auth_client(self.eleve)
        client.post(self._url())
        r = client.post(self._url())
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertFalse(r.data["voted"])
        self.assertEqual(r.data["vote_count"], 0)

    def test_responsable_ne_peut_pas_voter(self):
        r = auth_client(self.responsable).post(self._url())
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_impossible_de_voter_sur_idee_non_publiee(self):
        idea_brouillon = make_idea(
            make_user("auteur2@test.sn"), self.cat, status=Idea.BROUILLON
        )
        url = reverse("idea_vote", kwargs={"pk": idea_brouillon.pk})
        r = auth_client(self.eleve).post(url)
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)


class CommentCreateTest(TestCase):
    def setUp(self):
        self.eleve = make_user("eleve@test.sn")
        self.admin = make_user("admin@test.sn", role=User.ADMIN)
        self.cat = make_category()
        self.idea = make_idea(
            make_user("auteur@test.sn"), self.cat, status=Idea.PUBLIEE
        )
        self.url = reverse("idea_comment", kwargs={"pk": self.idea.pk})

    def test_eleve_peut_commenter(self):
        r = auth_client(self.eleve).post(
            self.url, {"content": "Très bonne idée !"}, format="json"
        )
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)

    def test_admin_ne_peut_pas_commenter(self):
        r = auth_client(self.admin).post(
            self.url, {"content": "Commentaire admin."}, format="json"
        )
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_non_authentifie_ne_peut_pas_commenter(self):
        r = APIClient().post(self.url, {"content": "Commentaire."}, format="json")
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)
