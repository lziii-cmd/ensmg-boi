from .base import *  # noqa: F401, F403

DEBUG = True

# Celery exécute les tâches de façon synchrone en dev (pas besoin de Redis)
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Cache mémoire en dev/tests — pas besoin de Redis
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "ensmg-dev",
    }
}

# Throttle illimité en dev/tests pour ne pas bloquer les appels répétés
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = {  # noqa: F405
    "anon": "9999/minute",
    "user": "9999/minute",
    "login": "9999/minute",
}
