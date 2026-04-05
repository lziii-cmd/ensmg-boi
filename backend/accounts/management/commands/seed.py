import random
from django.core.management.base import BaseCommand
from django.db import transaction


class Command(BaseCommand):
    help = "Initialise les catégories et insère des données de démonstration"

    @transaction.atomic
    def handle(self, *args, **options):
        from accounts.models import User
        from ideas.models import Category, Idea, Vote, Comment

        # ── Superuser ─────────────────────────────────────────────────
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
            self.stdout.write(self.style.SUCCESS("Superuser créé : superuser@ensmg.sn / passer01"))
        else:
            self.stdout.write("Superuser déjà existant.")

        # ── Catégories ────────────────────────────────────────────────
        categories_data = [
            ("Pédagogie et Formation", "pedagogie-formation", 1),
            ("Infrastructure et Équipements", "infrastructure-equipements", 2),
            ("Vie étudiante", "vie-etudiante", 3),
            ("Numérique et Systèmes d'information", "numerique-si", 4),
            ("Recherche et Innovation", "recherche-innovation", 5),
            ("Administration et Services", "administration-services", 6),
            ("Autre", "autre", 7),
        ]
        categories = {}
        for name, slug, order in categories_data:
            cat, created = Category.objects.get_or_create(
                slug=slug, defaults={"name": name, "order": order}
            )
            categories[slug] = cat
            if created:
                self.stdout.write(f"  Catégorie : {name}")

        # ── Membres de démonstration ──────────────────────────────────
        members_data = [
            # (email, first_name, last_name, role, department)
            ("amadou.diallo@ensmg.sn",      "Amadou",   "Diallo",    User.ELEVE,      "Génie Civil"),
            ("fatou.ndiaye@ensmg.sn",       "Fatou",    "Ndiaye",    User.ELEVE,      "Génie Minier"),
            ("moussa.ba@ensmg.sn",          "Moussa",   "Ba",        User.ELEVE,      "Génie Pétrolier"),
            ("aminata.sow@ensmg.sn",        "Aminata",  "Sow",       User.ELEVE,      "Génie Civil"),
            ("ibrahima.fall@ensmg.sn",      "Ibrahima", "Fall",      User.ELEVE,      "Génie Minier"),
            ("mariama.diop@ensmg.sn",       "Mariama",  "Diop",      User.ELEVE,      "Génie Pétrolier"),
            ("oumar.traore@ensmg.sn",       "Oumar",    "Traoré",    User.ELEVE,      "Génie Civil"),
            ("aissatou.barry@ensmg.sn",     "Aïssatou", "Barry",     User.ELEVE,      "Génie Minier"),
            ("prof.kane@ensmg.sn",          "Mamadou",  "Kane",      User.PROFESSEUR, "Département Géologie"),
            ("prof.sarr@ensmg.sn",          "Rokhaya",  "Sarr",      User.PROFESSEUR, "Département Mines"),
            ("pat.gueye@ensmg.sn",          "Cheikh",   "Guèye",     User.PAT,        "Scolarité"),
            ("responsable.comm@ensmg.sn",   "Ndèye",    "Mbaye",     User.RESPONSABLE,"Direction"),
        ]

        users = {}
        for email, first, last, role, dept in members_data:
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "first_name": first,
                    "last_name": last,
                    "role": role,
                    "department": dept,
                    "is_active": True,
                    "password_set": True,
                }
            )
            if created:
                user.set_password("passer01")
                user.save()
                self.stdout.write(f"  Membre : {first} {last} ({role})")
            users[email] = user

        # ── Idées de démonstration ────────────────────────────────────
        ideas_data = [
            {
                "title": "Mettre en place une bibliothèque numérique",
                "description": (
                    "Il serait très utile d'avoir accès à une bibliothèque numérique "
                    "avec des ressources pédagogiques en ligne. Cela permettrait aux étudiants "
                    "de consulter des cours, des articles scientifiques et des manuels depuis "
                    "n'importe où, notamment pendant les périodes de stage ou de vacances.\n\n"
                    "Des plateformes comme Cairn ou Scholarvox proposent des abonnements "
                    "institutionnels accessibles à toute l'école."
                ),
                "category": "numerique-si",
                "author": "amadou.diallo@ensmg.sn",
                "status": Idea.PUBLIEE,
                "visibility": Idea.PUBLIC,
            },
            {
                "title": "Créer un club entrepreneuriat étudiant",
                "description": (
                    "Je propose la création d'un club entrepreneuriat pour encourager "
                    "l'innovation et l'esprit d'entreprise parmi les étudiants. Ce club "
                    "pourrait organiser des hackathons, inviter des entrepreneurs à partager "
                    "leur expérience, et aider les étudiants à monter des projets.\n\n"
                    "Plusieurs grandes écoles d'ingénieurs en Afrique ont ce type de structure "
                    "avec d'excellents résultats."
                ),
                "category": "vie-etudiante",
                "author": "fatou.ndiaye@ensmg.sn",
                "status": Idea.EN_ETUDE,
                "visibility": Idea.PUBLIC,
                "is_pinned": True,
            },
            {
                "title": "Améliorer la connexion internet dans les salles de cours",
                "description": (
                    "La connexion Wi-Fi dans les amphithéâtres et salles de TP est souvent "
                    "instable, ce qui rend difficile l'utilisation d'outils numériques pendant "
                    "les cours. Il faudrait renforcer l'infrastructure réseau, notamment "
                    "installer des bornes Wi-Fi supplémentaires dans les zones les plus fréquentées."
                ),
                "category": "infrastructure-equipements",
                "author": "moussa.ba@ensmg.sn",
                "status": Idea.ACCEPTEE,
                "visibility": Idea.PUBLIC,
                "official_response": (
                    "La direction a approuvé un budget pour l'installation de 15 nouvelles "
                    "bornes Wi-Fi. Les travaux débuteront lors des prochaines vacances."
                ),
            },
            {
                "title": "Instaurer des séances de tutorat entre pairs",
                "description": (
                    "Certaines matières de 1ère année sont difficiles pour les nouveaux "
                    "étudiants. Je suggère de créer un système de tutorat où les étudiants "
                    "de 2ème et 3ème année aident les plus jeunes sur les matières fondamentales "
                    "comme les mathématiques, la physique et la géologie."
                ),
                "category": "pedagogie-formation",
                "author": "aminata.sow@ensmg.sn",
                "status": Idea.PUBLIEE,
                "visibility": Idea.PUBLIC,
            },
            {
                "title": "Ajouter des machines de sport dans le campus",
                "description": (
                    "Il n'y a pas d'équipements sportifs de qualité sur le campus. "
                    "Quelques appareils de musculation et des vélos d'appartement dans "
                    "un espace dédié permettraient aux étudiants de se dépenser entre "
                    "les cours, ce qui est bénéfique pour la concentration et la santé."
                ),
                "category": "vie-etudiante",
                "author": "ibrahima.fall@ensmg.sn",
                "status": Idea.REJETEE,
                "visibility": Idea.PUBLIC,
                "rejection_reason": (
                    "Manque d'espace disponible sur le campus pour ce type d'installation. "
                    "L'idée est bonne mais le budget et la logistique ne permettent pas "
                    "de la réaliser pour le moment."
                ),
            },
            {
                "title": "Organiser des visites de terrain mensuelles",
                "description": (
                    "Les visites sur des sites miniers ou géologiques sont essentielles "
                    "pour notre formation pratique. Actuellement, elles sont trop rares. "
                    "Je propose d'en organiser au minimum une par mois pour chaque filière, "
                    "en partenariat avec les entreprises du secteur."
                ),
                "category": "pedagogie-formation",
                "author": "mariama.diop@ensmg.sn",
                "status": Idea.EN_ETUDE,
                "visibility": Idea.PUBLIC,
            },
            {
                "title": "Digitaliser les demandes administratives",
                "description": (
                    "Les démarches administratives (relevés de notes, certificats de scolarité, "
                    "attestations) nécessitent encore de se déplacer physiquement à la scolarité. "
                    "Un portail en ligne permettrait de soumettre ces demandes à distance et "
                    "de recevoir les documents par email, ce qui ferait gagner du temps à tout le monde."
                ),
                "category": "administration-services",
                "author": "oumar.traore@ensmg.sn",
                "status": Idea.MISE_EN_OEUVRE,
                "visibility": Idea.PUBLIC,
                "official_response": (
                    "Un groupe de travail a été constitué. La plateforme de demandes en ligne "
                    "est en cours de développement et sera disponible dans 3 mois."
                ),
            },
            {
                "title": "Proposer des cours de langues supplémentaires",
                "description": (
                    "L'anglais technique est important dans notre domaine mais il manque "
                    "des cours adaptés. Je propose aussi d'ajouter des cours de mandarin "
                    "ou d'arabe, langues très utiles dans le secteur minier international. "
                    "Ces cours pourraient être optionnels et dispensés en soirée."
                ),
                "category": "pedagogie-formation",
                "author": "aissatou.barry@ensmg.sn",
                "status": Idea.PUBLIEE,
                "visibility": Idea.PUBLIC,
            },
            {
                "title": "Créer un partenariat avec des entreprises minières locales",
                "description": (
                    "Pour faciliter l'insertion professionnelle, il serait judicieux de "
                    "formaliser des partenariats avec des sociétés minières opérant au Sénégal. "
                    "Ces partenariats pourraient déboucher sur des stages, des projets de fin "
                    "d'études et des offres d'emploi en priorité pour nos diplômés."
                ),
                "category": "recherche-innovation",
                "author": "amadou.diallo@ensmg.sn",
                "status": Idea.EN_ATTENTE,
                "visibility": Idea.PUBLIC,
                "is_confidential": True,
            },
            {
                "title": "Installer des panneaux solaires pour alimenter le campus",
                "description": (
                    "Les coupures de courant perturbent régulièrement les cours et les travaux "
                    "en salle informatique. L'installation de panneaux solaires, en plus d'un "
                    "groupe électrogène, garantirait une alimentation continue du campus. "
                    "Cela cadrerait aussi avec une démarche de développement durable."
                ),
                "category": "infrastructure-equipements",
                "author": "fatou.ndiaye@ensmg.sn",
                "status": Idea.PUBLIEE,
                "visibility": Idea.PUBLIC,
            },
        ]

        created_ideas = []
        for idea_data in ideas_data:
            author = users.get(idea_data["author"])
            category = categories.get(idea_data["category"])
            if not author or not category:
                continue

            idea, created = Idea.objects.get_or_create(
                title=idea_data["title"],
                defaults={
                    "description": idea_data["description"],
                    "category": category,
                    "author": author,
                    "status": idea_data.get("status", Idea.EN_ATTENTE),
                    "visibility": idea_data.get("visibility", Idea.PUBLIC),
                    "is_confidential": idea_data.get("is_confidential", False),
                    "is_pinned": idea_data.get("is_pinned", False),
                    "official_response": idea_data.get("official_response", ""),
                    "rejection_reason": idea_data.get("rejection_reason", ""),
                }
            )
            if created:
                self.stdout.write(f"  Idée : {idea.title[:50]}")
            created_ideas.append(idea)

        # ── Votes ─────────────────────────────────────────────────────
        voters = list(users.values())
        vote_count = 0
        for idea in created_ideas:
            eligible_voters = [u for u in voters if u != idea.author]
            nb_votes = random.randint(1, min(6, len(eligible_voters)))
            chosen = random.sample(eligible_voters, nb_votes)
            for voter in chosen:
                _, created = Vote.objects.get_or_create(idea=idea, user=voter)
                if created:
                    vote_count += 1

        # Recalcule vote_count sur chaque idée
        for idea in created_ideas:
            real_count = Vote.objects.filter(idea=idea).count()
            if idea.vote_count != real_count:
                Idea.objects.filter(pk=idea.pk).update(vote_count=real_count)

        self.stdout.write(f"  {vote_count} vote(s) ajouté(s)")

        # ── Commentaires ──────────────────────────────────────────────
        comments_data = [
            # (idea_title_start, author_email, content)
            (
                "bibliothèque numérique",
                "fatou.ndiaye@ensmg.sn",
                "Excellente idée ! J'ai du mal à accéder aux ressources pendant les stages."
            ),
            (
                "bibliothèque numérique",
                "moussa.ba@ensmg.sn",
                "Cairn propose effectivement des tarifs intéressants pour les institutions. +1 pour cette idée."
            ),
            (
                "club entrepreneuriat",
                "aminata.sow@ensmg.sn",
                "J'adhère totalement ! On pourrait aussi organiser des concours de pitch."
            ),
            (
                "club entrepreneuriat",
                "ibrahima.fall@ensmg.sn",
                "On devrait s'inspirer du Club des Ingénieurs Innovateurs de l'ESP."
            ),
            (
                "club entrepreneuriat",
                "prof.kane@ensmg.sn",
                "Je serais ravi de parrainer ce club et d'y intervenir en tant que mentor."
            ),
            (
                "connexion internet",
                "mariama.diop@ensmg.sn",
                "En amphi A le Wi-Fi coupe constamment. C'est vraiment gênant pour les cours qui utilisent des simulations."
            ),
            (
                "connexion internet",
                "oumar.traore@ensmg.sn",
                "Bonne nouvelle que ça soit accepté ! On attendait ça depuis longtemps."
            ),
            (
                "tutorat entre pairs",
                "amadou.diallo@ensmg.sn",
                "Je serais volontaire pour aider les 1ère année en mathématiques et thermodynamique."
            ),
            (
                "tutorat entre pairs",
                "prof.sarr@ensmg.sn",
                "Très bonne initiative. Cela développe aussi les compétences pédagogiques des tuteurs."
            ),
            (
                "visites de terrain",
                "aissatou.barry@ensmg.sn",
                "Une visite de la mine de Sabodala serait fantastique pour les filières minières !"
            ),
            (
                "visites de terrain",
                "moussa.ba@ensmg.sn",
                "On pourrait aussi visiter les installations pétrolières offshore de Sangomar."
            ),
            (
                "demandes administratives",
                "fatou.ndiaye@ensmg.sn",
                "Il m'a fallu trois allers-retours pour avoir mon attestation. Un portail en ligne serait une vraie révolution !"
            ),
            (
                "cours de langues",
                "ibrahima.fall@ensmg.sn",
                "L'anglais technique est indispensable pour les publications et les conférences internationales."
            ),
            (
                "cours de langues",
                "prof.kane@ensmg.sn",
                "Le mandarin est effectivement très utile dans le contexte minier africain actuel."
            ),
            (
                "panneaux solaires",
                "oumar.traore@ensmg.sn",
                "L'ENSMG a tout à gagner à être une école vitrine en matière de développement durable."
            ),
            (
                "panneaux solaires",
                "aminata.sow@ensmg.sn",
                "On pourrait faire de ce projet un cas d'étude pour les étudiants en énergie renouvelable."
            ),
        ]

        comment_count = 0
        for title_start, author_email, content in comments_data:
            idea = next(
                (i for i in created_ideas if title_start.lower() in i.title.lower()),
                None
            )
            author = users.get(author_email)
            if not idea or not author:
                continue
            _, created = Comment.objects.get_or_create(
                idea=idea,
                author=author,
                content=content,
            )
            if created:
                comment_count += 1

        self.stdout.write(f"  {comment_count} commentaire(s) ajouté(s)")
        self.stdout.write(self.style.SUCCESS(
            f"\nInitialisation terminée — "
            f"{len(created_ideas)} idées, {vote_count} votes, {comment_count} commentaires."
        ))
