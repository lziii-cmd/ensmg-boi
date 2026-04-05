"""
Commande de seed démo — ENSMG Boîte à Idées
Crée : directeur, professeurs (2 depts), PATS (8 services), étudiants (1ère–5ème),
        responsable des communications + idées/votes/commentaires (jan–avr 2026)
"""
import unicodedata
import random
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone


def slugify(name):
    name = unicodedata.normalize("NFD", name)
    name = "".join(c for c in name if unicodedata.category(c) != "Mn")
    return name.lower().strip().replace(" ", "")


def make_email(first, last):
    return f"{slugify(first)}.{slugify(last)}@ensmg.sn"


def rand_date(start_days_ago, end_days_ago=0):
    """Return a timezone-aware datetime between start and end days ago."""
    start = timezone.now() - timedelta(days=start_days_ago)
    end = timezone.now() - timedelta(days=end_days_ago)
    delta = end - start
    return start + timedelta(seconds=random.randint(0, int(delta.total_seconds())))


class Command(BaseCommand):
    help = "Peuple la base avec des données réalistes pour la démo ENSMG"

    @transaction.atomic
    def handle(self, *args, **options):
        from accounts.models import User
        from ideas.models import Category, Idea, Vote, Comment, StatusHistory

        self.stdout.write(self.style.MIGRATE_HEADING("=== Seed démo ENSMG ==="))
        created_users = []

        # ── 1. RESPONSABLE DES COMMUNICATIONS ─────────────────────────────
        resp = self._create_user(
            "Khadijatou", "Diallo", User.RESPONSABLE,
            department="Communication et Relations Externes"
        )
        created_users.append(resp)

        # ── 2. DIRECTEUR ───────────────────────────────────────────────────
        directeur = self._create_user(
            "Mamadou Lamine", "Diallo", User.PROFESSEUR,
            department="Direction"
        )
        created_users.append(directeur)

        # ── 3. PROFESSEURS — Département Géotechnique ─────────────────────
        dept_geo = "Géotechnique"
        profs_geo = [
            ("Adama", "Dioné"),       # Chef de département
            ("Oumar", "Ndiaye"),
            ("Fatou", "Gaye"),
            ("Ibrahima", "Sarr"),
            ("Aminata", "Fall"),
        ]
        prof_geo_users = []
        for i, (fn, ln) in enumerate(profs_geo):
            u = self._create_user(fn, ln, User.PROFESSEUR, department=dept_geo)
            prof_geo_users.append(u)
            created_users.append(u)

        # ── 4. PROFESSEURS — Département Ressources Minérales et Énergétiques
        dept_rme = "Ressources Minérales et Énergétiques"
        profs_rme = [
            ("Mohamadou Moustapha", "Thiam"),  # Chef de département
            ("Seydou", "Kouyaté"),
            ("Mariama", "Baldé"),
            ("Cheikh", "Diop"),
            ("Aliou", "Sow"),
        ]
        prof_rme_users = []
        for fn, ln in profs_rme:
            u = self._create_user(fn, ln, User.PROFESSEUR, department=dept_rme)
            prof_rme_users.append(u)
            created_users.append(u)

        all_profs = [directeur] + prof_geo_users + prof_rme_users

        # ── 5. PATS (2 par service) ────────────────────────────────────────
        pats_data = [
            ("Pathé",      "Diallo",   "Service Informatique"),
            ("Rokhaya",    "Mbaye",    "Service Informatique"),
            ("Lamine",     "Cissé",    "Service Communication"),
            ("Aïda",       "Ndiaye",   "Service Communication"),
            ("Boubacar",   "Camara",   "Service Ressources Humaines"),
            ("Ndéye",      "Dieng",    "Service Ressources Humaines"),
            ("Moussa",     "Balde",    "Service Scolarité"),
            ("Fatoumata",  "Traoré",   "Service Scolarité"),
            ("Amadou",     "Bâ",       "Service Comptabilité Financière"),
            ("Marème",     "Sarr",     "Service Comptabilité Financière"),
            ("Souleymane", "Faye",     "Service Comptabilité des Matières"),
            ("Coumba",     "Diop",     "Service Comptabilité des Matières"),
            ("Abdoulaye",  "Koné",     "Service Relations Extérieures et Marché"),
            ("Bineta",     "Diouf",    "Service Relations Extérieures et Marché"),
            ("Modou",      "Fall",     "Service Archives"),
            ("Yacine",     "Sall",     "Service Archives"),
        ]
        pat_users = []
        for fn, ln, dept in pats_data:
            u = self._create_user(fn, ln, User.PAT, department=dept)
            pat_users.append(u)
            created_users.append(u)

        # ── 6. ÉTUDIANTS ──────────────────────────────────────────────────
        students_by_year = {
            "1ère année": [
                ("Ousmane",   "Diallo"),  ("Aissatou",  "Fall"),
                ("Mamadou",   "Baldé"),   ("Rokhaya",   "Sarr"),
                ("Alioune",   "Ndiaye"),  ("Aminata",   "Cissé"),
                ("Babacar",   "Diouf"),   ("Fatou",     "Diop"),
                ("Ibrahima",  "Koné"),    ("Ndéye",     "Sow"),
                ("Pape",      "Sall"),    ("Mariama",   "Gaye"),
            ],
            "2ème année": [
                ("Abdoulaye", "Diallo"),  ("Khady",     "Ndiaye"),
                ("Seydou",    "Bâ"),      ("Fatoumata", "Mbaye"),
                ("Moussa",    "Fall"),    ("Awa",       "Cissé"),
                ("Modou",     "Sarr"),    ("Bineta",    "Kouyaté"),
                ("Cheikh",    "Diallo"),  ("Yacine",    "Sow"),
                ("Lamine",    "Diouf"),   ("Aïda",      "Baldé"),
                ("Oumar",     "Faye"),
            ],
            "3ème année": [
                ("Mamadou",   "Diop"),    ("Sokhna",    "Ndiaye"),
                ("Aliou",     "Baldé"),   ("Ndéye",     "Sarr"),
                ("Boubacar",  "Fall"),    ("Mariama",   "Cissé"),
                ("Ibrahima",  "Mbaye"),   ("Fatou",     "Koné"),
                ("Assane",    "Diallo"),  ("Coumba",    "Sall"),
                ("Pape",      "Ndiaye"),
            ],
            "4ème année": [
                ("Amadou",    "Sarr"),    ("Khadijatou","Fall"),
                ("Ousmane",   "Bâ"),      ("Aissatou",  "Diop"),
                ("Mouhamed",  "Ndiaye"),  ("Rokhaya",   "Cissé"),
                ("Babacar",   "Kouyaté"), ("Awa",       "Sow"),
                ("Abdou",     "Diallo"),  ("Ndéye",     "Faye"),
                ("Alioune",   "Mbaye"),   ("Fatou",     "Baldé"),
            ],
            "5ème année": [
                ("Seydou",      "Sarr"),   ("Aminata",   "Ndiaye"),
                ("Cheikh",      "Baldé"),  ("Mariama",   "Fall"),
                ("Lamine",      "Diop"),   ("Khady",     "Cissé"),
                ("Modou",       "Koné"),   ("Bineta",    "Mbaye"),
                ("Oumar",       "Sall"),   ("Souleymane","Diallo"),
            ],
        }

        all_students = []
        for year, names in students_by_year.items():
            for fn, ln in names:
                u = self._create_user(fn, ln, User.ELEVE, department=year)
                all_students.append(u)
                created_users.append(u)

        total_users = len([u for u in created_users if u is not None])
        self.stdout.write(self.style.SUCCESS(f"[OK] {total_users} membres crees"))

        # ── 7. IDÉES ──────────────────────────────────────────────────────
        cats = {c.slug: c for c in Category.objects.all()}

        ideas_data = [
            # (titre, desc, cat_slug, statut, auteur, jours_ago, confidentiel, votes_nb, commentaires)
            (
                "Mise en place d'une bibliothèque numérique",
                "Il serait très utile d'avoir accès à des ressources pédagogiques en ligne : manuels, articles scientifiques, thèses. Cela permettrait aux étudiants d'accéder aux documents depuis leurs chambres ou chez eux, sans dépendre uniquement de la bibliothèque physique.",
                "numerique-si", "mise_en_oeuvre",
                random.choice(all_students[:10]), 90, False, 38,
                ["Excellente initiative !", "Très utile pour les révisions", "J'appuie cette idée à 100%"]
            ),
            (
                "Amélioration de la connexion WiFi sur le campus",
                "La connexion internet est souvent très lente dans les amphithéâtres et les salles de TP. Une infrastructure WiFi moderne avec des points d'accès dans chaque salle améliorerait considérablement les conditions de travail et de recherche.",
                "infrastructure-equipements", "acceptee",
                random.choice(all_students[10:25]), 85, False, 29,
                ["Le WiFi est vraiment problématique ici", "Totalement d'accord avec cette proposition"]
            ),
            (
                "Organisation d'une journée portes ouvertes annuelle",
                "Une journée portes ouvertes permettrait à l'ENSMG de se faire connaître auprès des lycéens et de leurs parents, de valoriser nos formations et de renforcer notre attractivité au niveau national et sous-régional.",
                "administration-services", "en_etude",
                resp, 75, False, 15,
                ["Bonne idée pour la visibilité de l'école", "On pourrait aussi inviter des entreprises partenaires"]
            ),
            (
                "Création d'un laboratoire de géologie numérique",
                "L'acquisition de logiciels de modélisation géologique (Surpac, Vulcan, Leapfrog) et de stations de travail haute performance permettrait aux étudiants en Géotechnique de se former aux outils utilisés dans l'industrie minière.",
                "recherche-innovation", "acceptee",
                prof_geo_users[0], 70, False, 22,
                ["Indispensable pour notre formation", "Les entreprises minières nous demandent ces compétences"]
            ),
            (
                "Révision des maquettes pédagogiques de 3ème année",
                "Les programmes de 3ème année n'ont pas été mis à jour depuis plusieurs années. Il serait important d'intégrer de nouveaux modules sur les énergies renouvelables et le développement durable dans le secteur minier.",
                "pedagogie-formation", "en_etude",
                prof_rme_users[0], 65, False, 18,
                ["La mise à jour est urgente", "On pourrait inviter des experts du secteur"]
            ),
            (
                "Installation de panneaux solaires pour l'autonomie énergétique",
                "Face aux fréquentes coupures d'électricité qui perturbent les cours et les travaux pratiques, l'installation de panneaux solaires avec stockage assurerait une continuité pédagogique et réduirait les factures d'électricité.",
                "infrastructure-equipements", "en_etude",
                random.choice(pat_users), 62, False, 31,
                ["Priorité absolue !", "Les coupures pendant les TP sont très problématiques", "Initiative verte et pratique"]
            ),
            (
                "Mise en place d'un système de gestion des absences en ligne",
                "Un système numérique permettrait aux étudiants de consulter leurs absences en temps réel et aux professeurs de les saisir facilement. Cela éviterait les erreurs et les contestations en fin de semestre.",
                "numerique-si", "publiee",
                random.choice(all_students[25:40]), 58, False, 12,
                ["Très pratique pour le suivi"]
            ),
            (
                "Création d'une salle de sport pour les étudiants",
                "L'ENSMG ne dispose d'aucune infrastructure sportive. L'aménagement d'une salle polyvalente permettrait aux étudiants de pratiquer une activité physique régulière, bénéfique pour leur santé et leur concentration.",
                "vie-etudiante", "publiee",
                random.choice(all_students[15:30]), 55, False, 24,
                ["Vraiment nécessaire !", "On pourrait commencer par un terrain de sport extérieur", "La santé des étudiants est importante"]
            ),
            (
                "Instaurer des partenariats avec les entreprises minières de la sous-région",
                "Des conventions de partenariat avec des entreprises comme Teranga Gold, SOMISY, ou des groupes internationaux permettraient d'offrir des stages qualifiants et des opportunités d'emploi à nos diplômés.",
                "administration-services", "mise_en_oeuvre",
                directeur, 50, False, 19,
                ["Initiative très stratégique", "Ça valoriserait nos diplômes"]
            ),
            (
                "Amélioration de la cantine universitaire",
                "Les conditions d'hygiène et la qualité des repas à la cantine méritent d'être améliorées. Une meilleure alimentation contribue directement à la performance académique des étudiants.",
                "vie-etudiante", "en_attente",
                random.choice(all_students[30:45]), 48, False, 27,
                ["Complètement d'accord !", "Les étudiants méritent mieux"]
            ),
            (
                "Formation des enseignants aux nouvelles pédagogies",
                "L'intégration de méthodes pédagogiques actives (classes inversées, apprentissage par projets, e-learning) améliorerait l'engagement des étudiants et leur préparation au monde professionnel.",
                "pedagogie-formation", "publiee",
                random.choice(prof_geo_users[1:]), 45, False, 9,
                ["Bonne approche pour moderniser l'enseignement"]
            ),
            (
                "Création d'un incubateur de startups minières",
                "L'ENSMG pourrait créer un espace d'innovation pour accompagner les projets entrepreneuriaux des étudiants et alumni dans le secteur minier et géologique, en partenariat avec des investisseurs locaux.",
                "recherche-innovation", "en_etude",
                prof_rme_users[1], 42, False, 16,
                ["Idée visionnaire !", "Le secteur minier a besoin d'innovation locale"]
            ),
            (
                "Mise à disposition de casiers sécurisés pour les étudiants",
                "Des casiers individuels permettraient aux étudiants de stocker leurs affaires et matériels de terrain en toute sécurité, évitant de transporter des équipements lourds chaque jour.",
                "vie-etudiante", "en_attente",
                random.choice(all_students[40:55]), 40, True, 7,
                []
            ),
            (
                "Digitalisation du processus de demande de documents administratifs",
                "Les démarches administratives (relevés de notes, attestations, certificats de scolarité) devraient pouvoir se faire en ligne pour éviter les longues files d'attente et les déplacements inutiles.",
                "numerique-si", "acceptee",
                random.choice(pat_users[4:8]), 38, False, 21,
                ["Enfin une idée pratique !", "La scolarité serait soulagée aussi", "Très attendu par les étudiants"]
            ),
            (
                "Organisation d'un congrès annuel des géologues et miniers",
                "L'ENSMG pourrait organiser chaque année un événement scientifique réunissant professionnels, chercheurs et étudiants du secteur minier et géologique de toute l'Afrique de l'Ouest.",
                "recherche-innovation", "en_attente",
                prof_geo_users[2], 35, False, 13,
                ["Excellente idée pour le rayonnement de l'école"]
            ),
            (
                "Rénovation des toilettes dans les bâtiments pédagogiques",
                "L'état des sanitaires dans les bâtiments est préoccupant. Une rénovation complète avec un système d'entretien régulier améliorerait les conditions d'hygiène pour tous.",
                "infrastructure-equipements", "en_attente",
                random.choice(all_students[20:35]), 32, False, 33,
                ["Priorité urgente !", "C'est une question de dignité", "En accord total avec cette idée"]
            ),
            (
                "Création d'un club d'astronomie et de géophysique",
                "Un club scientifique permettrait aux étudiants passionnés d'approfondir leurs connaissances en dehors des cours, d'organiser des sorties terrain et de participer à des compétitions scientifiques.",
                "vie-etudiante", "publiee",
                random.choice(all_students[:15]), 28, False, 8,
                ["Super idée pour la vie du campus"]
            ),
            (
                "Mise en place d'un système de tutorat entre étudiants",
                "Un programme de tutorat où les étudiants de 4ème et 5ème année aident ceux de 1ère et 2ème année permettrait de renforcer la cohésion et d'améliorer les résultats académiques.",
                "pedagogie-formation", "acceptee",
                random.choice(all_students[45:58]), 25, False, 17,
                ["Initiative solidaire !", "Ça nous aiderait vraiment en 1ère année"]
            ),
            (
                "Acquisition de véhicules pour les sorties de terrain",
                "Les sorties géologiques de terrain sont essentielles à notre formation mais souvent annulées ou limitées par le manque de véhicules disponibles. Deux minibus supplémentaires résoudraient ce problème.",
                "infrastructure-equipements", "en_etude",
                prof_rme_users[2], 22, False, 20,
                ["Les sorties terrain sont fondamentales pour notre formation", "Sans terrain, pas de géologue !"]
            ),
            (
                "Instaurer un système de bourses d'excellence",
                "Pour encourager les meilleurs étudiants et retenir les talents à l'ENSMG, la mise en place de bourses d'excellence financées par des partenaires industriels serait très motivante.",
                "administration-services", "en_attente",
                random.choice(all_students[30:45]), 18, False, 25,
                ["Très motivant pour les étudiants", "Il faudrait aussi des bourses pour les étudiants dans le besoin"]
            ),
            (
                "Création d'une salle de prière sur le campus",
                "L'ENSMG n'a pas d'espace dédié à la prière. Aménager une salle de prière mixte permettrait aux membres de la communauté de pratiquer leur foi dans de bonnes conditions.",
                "vie-etudiante", "publiee",
                random.choice(all_students[10:25]), 15, True, 14,
                ["Très important pour nous", "Merci pour cette initiative"]
            ),
            (
                "Automatisation du système de pointage des présences",
                "L'utilisation de badges RFID ou d'une application mobile pour le pointage remplacerait les listes papier, réduirait les fraudes et faciliterait le suivi automatique des présences par les enseignants.",
                "numerique-si", "en_attente",
                random.choice(pat_users[:4]), 12, False, 10,
                ["Solution moderne et efficace"]
            ),
            (
                "Revoir le règlement intérieur concernant les retards",
                "La politique actuelle de fermeture des portes dès le début des cours est trop stricte et pénalise les étudiants qui habitent loin du campus. Un délai de grâce de 10 minutes serait plus raisonnable.",
                "administration-services", "rejetee",
                random.choice(all_students[15:30]), 10, False, 6,
                ["Compréhensible mais difficile à appliquer"]
            ),
            (
                "Installation de fontaines d'eau potable dans les couloirs",
                "Aucun point d'eau potable n'est accessible librement sur le campus. Des fontaines dans chaque bâtiment amélioreraient le confort et la santé des étudiants et du personnel.",
                "infrastructure-equipements", "en_attente",
                random.choice(all_students[35:50]), 7, False, 19,
                ["Basique mais indispensable !", "Surtout en période de chaleur"]
            ),
            (
                "Organiser une cérémonie de remise de diplômes solennelle",
                "L'ENSMG n'a pas de cérémonie de remise de diplômes. Instaurer cet événement valoriserait nos diplômés, renforcerait le sentiment d'appartenance et attirerait l'attention des partenaires.",
                "administration-services", "en_attente",
                random.choice(all_students[45:58]), 4, False, 11,
                ["Nos familles méritent de partager ce moment avec nous", "Excellent pour l'image de l'école"]
            ),
        ]

        admin = User.objects.filter(role=User.ADMIN).first()
        created_ideas = 0

        for (title, desc, cat_slug, status_val, author, days_ago,
             confidential, nb_votes, comments_list) in ideas_data:

            if cat_slug not in cats:
                continue
            if author is None:
                continue

            # Create idea
            idea = Idea.objects.create(
                title=title,
                description=desc,
                category=cats[cat_slug],
                author=author,
                is_confidential=confidential,
                visibility="public",
                status=status_val,
            )
            # Backdate
            idea_date = rand_date(days_ago, max(0, days_ago - 3))
            Idea.objects.filter(pk=idea.pk).update(created_at=idea_date, updated_at=idea_date)

            # Status history
            if status_val != "en_attente":
                StatusHistory.objects.create(
                    idea=idea,
                    old_status="en_attente",
                    new_status=status_val,
                    changed_by=resp if resp else admin,
                    comment=self._status_comment(status_val),
                )

            # Votes
            voters = random.sample(
                all_students + all_profs[:3] + pat_users[:2],
                min(nb_votes, len(all_students + all_profs + pat_users) - 1)
            )
            for voter in voters:
                if voter != author:
                    Vote.objects.get_or_create(idea=idea, user=voter)
            idea.vote_count = idea.votes.count()
            idea.save(update_fields=["vote_count"])

            # Comments
            commentators = random.sample(
                [u for u in all_students + all_profs + pat_users if u != author],
                min(len(comments_list), len(all_students + all_profs + pat_users) - 1)
            )
            for i, text in enumerate(comments_list):
                commenter = commentators[i] if i < len(commentators) else random.choice(all_students)
                comment = Comment.objects.create(
                    idea=idea,
                    author=commenter,
                    content=text,
                )
                c_date = idea_date + timedelta(hours=random.randint(2, 48))
                Comment.objects.filter(pk=comment.pk).update(created_at=c_date)

            created_ideas += 1

        self.stdout.write(self.style.SUCCESS(f"[OK] {created_ideas} idees creees"))
        self.stdout.write(self.style.SUCCESS("[OK] Seed demo terminee avec succes !"))
        self.stdout.write("")
        self.stdout.write("  Quelques comptes créés :")
        self.stdout.write(f"  Responsable : khadijatou.diallo@ensmg.sn / passer01")
        self.stdout.write(f"  Directeur   : mamadoulamine.diallo@ensmg.sn / passer01")
        self.stdout.write(f"  Chef Géotech: adama.dione@ensmg.sn / passer01")
        self.stdout.write(f"  Étudiant 1A : ousmane.diallo@ensmg.sn / passer01")

    def _create_user(self, first_name, last_name, role, department=""):
        from accounts.models import User
        email = make_email(first_name, last_name)
        # Handle duplicate emails
        base = email
        counter = 2
        while User.objects.filter(email=email).exists():
            name_part = base.split("@")[0]
            email = f"{name_part}{counter}@ensmg.sn"
            counter += 1

        if User.objects.filter(email=email).exists():
            u = User.objects.get(email=email)
            self.stdout.write(f"  Existant : {email}")
            return u

        u = User.objects.create(
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=role,
            department=department,
            is_active=True,
            password_set=True,
        )
        u.set_password("passer01")
        u.save(update_fields=["password"])
        self.stdout.write(f"  Créé : {email} ({role})")
        return u

    def _status_comment(self, status):
        messages = {
            "publiee": "Idée validée et publiée pour consultation communautaire.",
            "en_etude": "Idée intéressante, un comité d'étude va l'examiner.",
            "acceptee": "Idée acceptée et intégrée dans le plan d'action de l'école.",
            "rejetee": "Idée non retenue pour le moment, ne correspond pas aux priorités actuelles.",
            "mise_en_oeuvre": "Idée approuvée et en cours de réalisation.",
        }
        return messages.get(status, "")
