import os
import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


def idea_attachment_path(instance, filename):
    ext = os.path.splitext(filename)[1]
    return f"attachments/{instance.id}{ext}"


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name = "Catégorie"
        verbose_name_plural = "Catégories"
        ordering = ["order", "name"]

    def __str__(self):
        return self.name


class Idea(models.Model):
    EN_ATTENTE = "en_attente"
    PUBLIEE = "publiee"
    EN_ETUDE = "en_etude"
    ACCEPTEE = "acceptee"
    REJETEE = "rejetee"
    MISE_EN_OEUVRE = "mise_en_oeuvre"
    ARCHIVEE = "archivee"

    STATUS_CHOICES = [
        (EN_ATTENTE, "En attente de validation"),
        (PUBLIEE, "Publiée"),
        (EN_ETUDE, "En étude"),
        (ACCEPTEE, "Acceptée"),
        (REJETEE, "Rejetée"),
        (MISE_EN_OEUVRE, "Mise en œuvre"),
        (ARCHIVEE, "Archivée"),
    ]

    STATUS_COLORS = {
        EN_ATTENTE: "orange",
        PUBLIEE: "gray",
        EN_ETUDE: "blue",
        ACCEPTEE: "green",
        REJETEE: "red",
        MISE_EN_OEUVRE: "gold",
        ARCHIVEE: "dark_gray",
    }

    PUBLIC = "public"
    PRIVATE = "private"
    VISIBILITY_CHOICES = [
        (PUBLIC, "Publique"),
        (PRIVATE, "Privée"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=100)
    description = models.TextField(max_length=2000)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="ideas")
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name="ideas"
    )
    is_confidential = models.BooleanField(default=False)
    visibility = models.CharField(max_length=10, choices=VISIBILITY_CHOICES, default=PUBLIC)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=EN_ATTENTE)
    attachment = models.FileField(upload_to=idea_attachment_path, null=True, blank=True)
    official_response = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)
    is_pinned = models.BooleanField(default=False)
    vote_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Idée"
        verbose_name_plural = "Idées"
        ordering = ["-is_pinned", "-created_at"]

    def __str__(self):
        return self.title

    def get_status_color(self):
        return self.STATUS_COLORS.get(self.status, "gray")


class StatusHistory(models.Model):
    idea = models.ForeignKey(Idea, on_delete=models.CASCADE, related_name="status_history")
    old_status = models.CharField(max_length=20, blank=True)
    new_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name="status_changes"
    )
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class Vote(models.Model):
    idea = models.ForeignKey(Idea, on_delete=models.CASCADE, related_name="votes")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="votes")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["idea", "user"]


class Comment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idea = models.ForeignKey(Idea, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name="comments"
    )
    content = models.TextField(max_length=1000)
    is_hidden = models.BooleanField(default=False)
    report_count = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]


class CommentReport(models.Model):
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name="reports")
    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["comment", "reporter"]
