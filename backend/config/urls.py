from django.contrib import admin
from django.urls import path, include
from django.http import FileResponse
from django.conf import settings
from django.conf.urls.static import static


def spa_index(request, path=""):
    """Sert index.html pour toutes les routes React."""
    return FileResponse(
        open(settings.BASE_DIR / "frontend_build" / "index.html", "rb"),
        content_type="text/html",
    )


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/auth/", include("accounts.urls")),
    path("api/v1/ideas/", include("ideas.urls")),
    path("api/v1/notifications/", include("notifications.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Catch-all : toute URL non-API renvoie le frontend React
urlpatterns += [
    path("", spa_index),
    path("<path:path>", spa_index),
]
