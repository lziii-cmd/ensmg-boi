# Boîte à Idées — ENSMG

Plateforme participative d'amélioration institutionnelle de l'École Nationale Supérieure des Mines et de la Géologie.

## Stack

| Couche | Technologie |
|--------|-------------|
| Backend | Python 3.11 / Django 4.2 LTS |
| Frontend | React 18 + Vite + Tailwind CSS |
| Base de données | PostgreSQL 15+ |
| Tâches async | Celery + Redis |
| Déploiement | Render |

## Compte admin par défaut

- **Email** : `admin@ensmg.sn`
- **Mot de passe** : `passer01`

## Lancement en développement

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # puis éditer .env
python manage.py migrate
python manage.py seed
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env      # puis éditer VITE_API_URL
npm run dev
```

## Déploiement sur Render

### Backend (Web Service)

- **Build Command** : `cd backend && pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate && python manage.py seed`
- **Start Command** : `cd backend && gunicorn config.wsgi:application`
- **Variables d'environnement** :
  - `SECRET_KEY` — clé secrète Django
  - `DEBUG` — `False`
  - `DATABASE_URL` — URL PostgreSQL Render
  - `REDIS_URL` — URL Redis Render
  - `ALLOWED_HOSTS` — domaine Render (ex: `monapp.onrender.com`)
  - `CORS_ALLOWED_ORIGINS` — URL du frontend (ex: `https://monfrontend.onrender.com`)
  - `FRONTEND_URL` — URL du frontend
  - `EMAIL_BACKEND` — `django.core.mail.backends.smtp.EmailBackend`
  - `EMAIL_HOST`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`
  - `DEFAULT_FROM_EMAIL` — `noreply@ensmg.sn`

### Frontend (Static Site)

- **Build Command** : `cd frontend && npm install && npm run build`
- **Publish Directory** : `frontend/dist`
- **Variables d'environnement** :
  - `VITE_API_URL` — URL du backend (ex: `https://monbackend.onrender.com/api/v1`)

## Rôles

| Rôle | Description |
|------|-------------|
| `eleve` | Étudiant |
| `professeur` | Enseignant-chercheur |
| `pat` | Personnel administratif et technique |
| `responsable` | Chargé des communications — gère le cycle de vie des idées |
| `admin` | Administrateur — gestion complète |

## Format du fichier Excel d'import

| Colonne | Obligatoire | Valeurs |
|---------|-------------|---------|
| Nom | Oui | texte |
| Prénom | Oui | texte |
| Email | Oui | email valide |
| Rôle | Oui | eleve, professeur, pat, responsable, admin |
| Département | Non | texte |
| Statut | Non | actif (défaut), inactif |
