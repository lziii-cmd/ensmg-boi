import random
from django.core.management.base import BaseCommand
from django.db import transaction


class Command(BaseCommand):
    help = "Initialise les catégories et insère des données de démonstration"

    @transaction.atomic
    def handle(self, *args, **options):
        from accounts.models import User
        from ideas.models import Category, Idea, Vote, Comment, StatusHistory

        # ── Superuser ─────────────────────────────────────────────────
        su, created = User.objects.get_or_create(email="superuser@ensmg.sn", defaults={
            "first_name": "Super", "last_name": "Administrateur",
            "role": User.SUPERUSER, "is_active": True,
            "is_staff": True, "is_superuser": True, "password_set": True,
        })
        if created:
            su.set_password("passer01"); su.save()
            self.stdout.write(self.style.SUCCESS("Superuser créé : superuser@ensmg.sn"))
        else:
            self.stdout.write("Superuser déjà existant.")

        # ── Admin ──────────────────────────────────────────────────────
        adm, created = User.objects.get_or_create(email="admin@ensmg.sn", defaults={
            "first_name": "Administrateur", "last_name": "ENSMG",
            "role": User.ADMIN, "department": "Service Informatique",
            "is_active": True, "is_staff": True, "password_set": True,
        })
        if created:
            adm.set_password("passer01"); adm.save()
            self.stdout.write(self.style.SUCCESS("Admin créé : admin@ensmg.sn"))
        else:
            self.stdout.write("Admin déjà existant.")

        # ── Responsable des communications ────────────────────────────
        resp, created = User.objects.get_or_create(email="responsable@ensmg.sn", defaults={
            "first_name": "Ndèye", "last_name": "Mbaye",
            "role": User.RESPONSABLE, "department": "Direction",
            "is_active": True, "password_set": True,
        })
        if created:
            resp.set_password("passer01"); resp.save()
            self.stdout.write(self.style.SUCCESS("Responsable créé : responsable@ensmg.sn"))
        else:
            self.stdout.write("Responsable déjà existant.")

        # ── Catégories ────────────────────────────────────────────────
        categories_data = [
            ("Pédagogie et Formation",              "pedagogie-formation",      1),
            ("Infrastructure et Équipements",       "infrastructure-equipements",2),
            ("Vie étudiante",                       "vie-etudiante",            3),
            ("Numérique et Systèmes d'information", "numerique-si",             4),
            ("Recherche et Innovation",              "recherche-innovation",     5),
            ("Administration et Services",          "administration-services",  6),
            ("Autre",                               "autre",                    7),
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
            # étudiants
            ("amadou.diallo@ensmg.sn",     "Amadou",     "Diallo",   User.ELEVE,      "Génie Civil"),
            ("fatou.ndiaye@ensmg.sn",      "Fatou",      "Ndiaye",   User.ELEVE,      "Génie Minier"),
            ("moussa.ba@ensmg.sn",         "Moussa",     "Ba",       User.ELEVE,      "Génie Pétrolier"),
            ("aminata.sow@ensmg.sn",       "Aminata",    "Sow",      User.ELEVE,      "Génie Civil"),
            ("ibrahima.fall@ensmg.sn",     "Ibrahima",   "Fall",     User.ELEVE,      "Génie Minier"),
            ("mariama.diop@ensmg.sn",      "Mariama",    "Diop",     User.ELEVE,      "Génie Pétrolier"),
            ("oumar.traore@ensmg.sn",      "Oumar",      "Traoré",   User.ELEVE,      "Génie Civil"),
            ("aissatou.barry@ensmg.sn",    "Aïssatou",   "Barry",    User.ELEVE,      "Génie Minier"),
            # professeurs
            ("mamadou.kane@ensmg.sn",      "Mamadou",    "Kane",     User.PROFESSEUR, "Département Géologie"),
            ("rokhaya.sarr@ensmg.sn",      "Rokhaya",    "Sarr",     User.PROFESSEUR, "Département Mines"),
            ("mamoudou@ensmg.sn",          "Mamoudou",   "Diallo",   User.PROFESSEUR, "Département Énergie"),
            # PAT
            ("cheikh.gueye@ensmg.sn",      "Cheikh",     "Guèye",    User.PAT,        "Scolarité"),
            ("coumba.fall@ensmg.sn",       "Coumba",     "Fall",     User.PAT,        "Bibliothèque"),
            # directeur
            ("mouhamadou.diallo@ensmg.sn", "Mouhamadou", "Diallo",   User.DIRECTEUR,  "Direction"),
        ]

        users = {}
        for email, first, last, role, dept in members_data:
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "first_name": first, "last_name": last,
                    "role": role, "department": dept,
                    "is_active": True, "password_set": True,
                }
            )
            if created:
                user.set_password("passer01")
                user.save()
                self.stdout.write(f"  Membre : {first} {last} ({role})")
            users[email] = user

        # ── Idées de démonstration ────────────────────────────────────
        ideas_data = [
            # PUBLIEE
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
            },
            # PUBLIEE épinglée
            {
                "title": "Créer un club entrepreneuriat étudiant",
                "description": (
                    "Je propose la création d'un club entrepreneuriat pour encourager "
                    "l'innovation et l'esprit d'entreprise parmi les étudiants. Ce club "
                    "pourrait organiser des hackathons, inviter des entrepreneurs et aider "
                    "les étudiants à monter des projets.\n\n"
                    "Plusieurs grandes écoles d'ingénieurs en Afrique ont ce type de structure "
                    "avec d'excellents résultats."
                ),
                "category": "vie-etudiante",
                "author": "fatou.ndiaye@ensmg.sn",
                "status": Idea.PUBLIEE,
                "is_pinned": True,
            },
            # EN_ETUDE
            {
                "title": "Organiser des visites de terrain mensuelles",
                "description": (
                    "Les visites sur des sites miniers ou géologiques sont essentielles "
                    "pour notre formation pratique. Actuellement elles sont trop rares. "
                    "Je propose d'en organiser au minimum une par mois pour chaque filière, "
                    "en partenariat avec les entreprises du secteur."
                ),
                "category": "pedagogie-formation",
                "author": "mariama.diop@ensmg.sn",
                "status": Idea.EN_ETUDE,
            },
            # EN_ETUDE
            {
                "title": "Améliorer la connexion internet dans les salles de cours",
                "description": (
                    "La connexion Wi-Fi dans les amphithéâtres et salles de TP est souvent "
                    "instable, ce qui rend difficile l'utilisation d'outils numériques. "
                    "Il faudrait renforcer l'infrastructure réseau et installer des bornes "
                    "Wi-Fi supplémentaires dans les zones les plus fréquentées."
                ),
                "category": "infrastructure-equipements",
                "author": "moussa.ba@ensmg.sn",
                "status": Idea.EN_ETUDE,
            },
            # ACCEPTEE
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
                "status": Idea.ACCEPTEE,
                "official_response": (
                    "Excellente initiative ! La direction approuve ce projet. "
                    "Un coordinateur sera nommé dès la rentrée prochaine pour organiser "
                    "les binômes tuteurs/tutorés."
                ),
            },
            # MISE_EN_OEUVRE
            {
                "title": "Digitaliser les demandes administratives",
                "description": (
                    "Les démarches administratives (relevés de notes, certificats de scolarité, "
                    "attestations) nécessitent encore de se déplacer physiquement à la scolarité. "
                    "Un portail en ligne permettrait de soumettre ces demandes à distance et "
                    "de recevoir les documents par email."
                ),
                "category": "administration-services",
                "author": "oumar.traore@ensmg.sn",
                "status": Idea.MISE_EN_OEUVRE,
                "official_response": (
                    "Un groupe de travail a été constitué et le développement est en cours. "
                    "La plateforme de demandes en ligne sera disponible dans 2 mois."
                ),
            },
            # REALISEE
            {
                "title": "Installer des panneaux d'affichage numériques",
                "description": (
                    "Remplacer les panneaux d'affichage papier par des écrans numériques "
                    "dans les couloirs principaux pour diffuser les informations importantes "
                    "en temps réel : emplois du temps, événements, annonces de la direction."
                ),
                "category": "infrastructure-equipements",
                "author": "ibrahima.fall@ensmg.sn",
                "status": Idea.REALISEE,
                "official_response": (
                    "Les écrans numériques ont été installés dans les 3 bâtiments principaux. "
                    "Le système est pleinement opérationnel depuis ce mois."
                ),
            },
            # REJETEE
            {
                "title": "Ajouter des machines de sport dans le campus",
                "description": (
                    "Il n'y a pas d'équipements sportifs de qualité sur le campus. "
                    "Quelques appareils de musculation et des vélos d'appartement dans "
                    "un espace dédié permettraient aux étudiants de se dépenser entre les cours."
                ),
                "category": "vie-etudiante",
                "author": "ibrahima.fall@ensmg.sn",
                "status": Idea.REJETEE,
                "rejection_category": Idea.BUDGET,
                "rejection_reason": (
                    "Le budget alloué aux équipements cette année est entièrement consacré "
                    "à la rénovation des laboratoires. L'idée sera reconsidérée l'an prochain."
                ),
            },
            # REJETEE (doublon)
            {
                "title": "Créer une application mobile pour l'école",
                "description": (
                    "Une application mobile officielle de l'ENSMG permettrait aux étudiants "
                    "d'accéder à leurs emplois du temps, résultats, actualités et services "
                    "depuis leur smartphone."
                ),
                "category": "numerique-si",
                "author": "aissatou.barry@ensmg.sn",
                "status": Idea.REJETEE,
                "rejection_category": Idea.DEJA_EN_COURS,
                "rejection_reason": (
                    "Un projet de portail numérique est déjà en cours de développement "
                    "par le service informatique et inclura une version mobile."
                ),
            },
            # EN_ATTENTE
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
                "status": Idea.EN_ATTENTE,
            },
            # EN_ATTENTE confidentielle
            {
                "title": "Créer un partenariat avec des entreprises minières locales",
                "description": (
                    "Pour faciliter l'insertion professionnelle, il serait judicieux de "
                    "formaliser des partenariats avec des sociétés minières opérant au Sénégal. "
                    "Ces partenariats pourraient déboucher sur des stages, des projets de fin "
                    "d'études et des offres d'emploi prioritaires pour nos diplômés."
                ),
                "category": "recherche-innovation",
                "author": "amadou.diallo@ensmg.sn",
                "status": Idea.EN_ATTENTE,
                "is_confidential": True,
            },
            # BROUILLON
            {
                "title": "Installer des panneaux solaires pour alimenter le campus",
                "description": (
                    "Les coupures de courant perturbent régulièrement les cours et les travaux "
                    "en salle informatique. L'installation de panneaux solaires garantirait "
                    "une alimentation continue du campus et s'inscrirait dans une démarche "
                    "de développement durable."
                ),
                "category": "infrastructure-equipements",
                "author": "fatou.ndiaye@ensmg.sn",
                "status": Idea.BROUILLON,
            },
        ]

        created_ideas = []
        for data in ideas_data:
            author = users.get(data["author"])
            category = categories.get(data["category"])
            if not author or not category:
                continue
            idea, created = Idea.objects.get_or_create(
                title=data["title"],
                defaults={
                    "description":        data["description"],
                    "category":           category,
                    "author":             author,
                    "status":             data.get("status", Idea.EN_ATTENTE),
                    "visibility":         data.get("visibility", Idea.PUBLIC),
                    "is_confidential":    data.get("is_confidential", False),
                    "is_pinned":          data.get("is_pinned", False),
                    "official_response":  data.get("official_response", ""),
                    "rejection_category": data.get("rejection_category", ""),
                    "rejection_reason":   data.get("rejection_reason", ""),
                }
            )
            if created:
                self.stdout.write(f"  Idée : {idea.title[:55]}")
            created_ideas.append(idea)

        # ── Historique de statuts pour les idées traitées ─────────────
        transitions = [
            ("Instaurer des séances de tutorat entre pairs", [
                (Idea.EN_ATTENTE, Idea.PUBLIEE,  resp, "Idée pertinente, on la publie."),
                (Idea.PUBLIEE,    Idea.EN_ETUDE,  resp, "Analyse en cours avec la direction pédagogique."),
                (Idea.EN_ETUDE,   Idea.ACCEPTEE,  resp, "Approuvé par la direction."),
            ]),
            ("Digitaliser les demandes administratives", [
                (Idea.EN_ATTENTE, Idea.PUBLIEE,      resp, "Publiée pour consultation."),
                (Idea.PUBLIEE,    Idea.EN_ETUDE,      resp, "Étude de faisabilité lancée."),
                (Idea.EN_ETUDE,   Idea.ACCEPTEE,      resp, "Budget validé."),
                (Idea.ACCEPTEE,   Idea.MISE_EN_OEUVRE,resp, "Développement démarré."),
            ]),
            ("Installer des panneaux d'affichage numériques", [
                (Idea.EN_ATTENTE,     Idea.PUBLIEE,       resp, "Publication validée."),
                (Idea.PUBLIEE,        Idea.ACCEPTEE,      resp, "Acceptée par la direction."),
                (Idea.ACCEPTEE,       Idea.MISE_EN_OEUVRE,resp, "Commande du matériel effectuée."),
                (Idea.MISE_EN_OEUVRE, Idea.REALISEE,      resp, "Installation terminée."),
            ]),
            ("Ajouter des machines de sport dans le campus", [
                (Idea.EN_ATTENTE, Idea.PUBLIEE, resp, "Publiée."),
                (Idea.PUBLIEE,    Idea.REJETEE, resp, "Rejet pour contrainte budgétaire."),
            ]),
            ("Créer une application mobile pour l'école", [
                (Idea.EN_ATTENTE, Idea.PUBLIEE, resp, "Publiée."),
                (Idea.PUBLIEE,    Idea.REJETEE, resp, "Projet similaire déjà en cours."),
            ]),
        ]

        for title, steps in transitions:
            idea = next((i for i in created_ideas if i.title == title), None)
            if not idea:
                continue
            if StatusHistory.objects.filter(idea=idea).exists():
                continue
            for old_s, new_s, by, comment in steps:
                StatusHistory.objects.create(
                    idea=idea, old_status=old_s, new_status=new_s,
                    changed_by=by, comment=comment
                )

        # ── Votes ─────────────────────────────────────────────────────
        votable_statuses = [
            Idea.PUBLIEE, Idea.EN_ETUDE, Idea.ACCEPTEE,
            Idea.MISE_EN_OEUVRE, Idea.REALISEE,
        ]
        votable_ideas = [i for i in created_ideas if i.status in votable_statuses]
        voters = list(users.values())
        vote_count = 0
        for idea in votable_ideas:
            eligible = [u for u in voters if u != idea.author]
            nb = random.randint(2, min(8, len(eligible)))
            for voter in random.sample(eligible, nb):
                _, created = Vote.objects.get_or_create(idea=idea, user=voter)
                if created:
                    vote_count += 1

        for idea in votable_ideas:
            real = Vote.objects.filter(idea=idea).count()
            if idea.vote_count != real:
                Idea.objects.filter(pk=idea.pk).update(vote_count=real)

        self.stdout.write(f"  {vote_count} vote(s) ajouté(s)")

        # ── Commentaires ──────────────────────────────────────────────
        comments_data = [
            ("bibliothèque numérique",   "fatou.ndiaye@ensmg.sn",
             "Excellente idée ! J'ai du mal à accéder aux ressources pendant les stages."),
            ("bibliothèque numérique",   "moussa.ba@ensmg.sn",
             "Cairn propose effectivement des tarifs intéressants pour les institutions."),
            ("club entrepreneuriat",     "aminata.sow@ensmg.sn",
             "J'adhère totalement ! On pourrait aussi organiser des concours de pitch."),
            ("club entrepreneuriat",     "ibrahima.fall@ensmg.sn",
             "On devrait s'inspirer du Club des Ingénieurs Innovateurs de l'ESP."),
            ("club entrepreneuriat",     "mamadou.kane@ensmg.sn",
             "Je serais ravi de parrainer ce club et d'y intervenir comme mentor."),
            ("visites de terrain",       "aissatou.barry@ensmg.sn",
             "Une visite de la mine de Sabodala serait fantastique pour les filières minières !"),
            ("visites de terrain",       "moussa.ba@ensmg.sn",
             "On pourrait aussi visiter les installations pétrolières offshore de Sangomar."),
            ("connexion internet",       "mariama.diop@ensmg.sn",
             "En amphi A le Wi-Fi coupe constamment. C'est vraiment gênant pour les simulations."),
            ("connexion internet",       "oumar.traore@ensmg.sn",
             "Bonne nouvelle que ça soit en étude ! On attendait ça depuis longtemps."),
            ("tutorat entre pairs",      "amadou.diallo@ensmg.sn",
             "Je serais volontaire pour aider les 1ère année en mathématiques."),
            ("tutorat entre pairs",      "rokhaya.sarr@ensmg.sn",
             "Très bonne initiative. Cela développe aussi les compétences pédagogiques des tuteurs."),
            ("demandes administratives", "fatou.ndiaye@ensmg.sn",
             "Il m'a fallu trois allers-retours pour avoir mon attestation. Un portail serait révolutionnaire !"),
            ("demandes administratives", "cheikh.gueye@ensmg.sn",
             "Cela nous ferait gagner beaucoup de temps côté scolarité aussi."),
            ("cours de langues",         "ibrahima.fall@ensmg.sn",
             "L'anglais technique est indispensable pour les publications internationales."),
            ("cours de langues",         "mamadou.kane@ensmg.sn",
             "Le mandarin est très utile dans le contexte minier africain actuel."),
            ("panneaux d'affichage",     "oumar.traore@ensmg.sn",
             "Super ! Plus besoin de chercher les infos sur des papiers déchirés."),
            ("panneaux d'affichage",     "aminata.sow@ensmg.sn",
             "Les écrans dans le couloir B sont vraiment bien placés."),
            ("partenariat",              "mamoudou@ensmg.sn",
             "Très importante cette idée. Les entreprises minières locales ont besoin de nos diplômés."),
        ]

        comment_count = 0
        for title_start, author_email, content in comments_data:
            idea = next(
                (i for i in created_ideas if title_start.lower() in i.title.lower()), None
            )
            author = users.get(author_email)
            if not idea or not author:
                continue
            if idea.status in (Idea.BROUILLON, Idea.REJETEE):
                continue
            _, created = Comment.objects.get_or_create(
                idea=idea, author=author, content=content
            )
            if created:
                comment_count += 1

        self.stdout.write(f"  {comment_count} commentaire(s) ajouté(s)")
        self.stdout.write(self.style.SUCCESS(
            f"\nInitialisation terminée — "
            f"{len(created_ideas)} idées, {vote_count} votes, {comment_count} commentaires."
        ))
