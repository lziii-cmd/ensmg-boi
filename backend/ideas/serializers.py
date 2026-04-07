from rest_framework import serializers
from accounts.serializers import UserPublicSerializer
from .models import Category, Idea, StatusHistory, Vote, Comment


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "is_active", "order"]


class StatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name     = serializers.CharField(source="changed_by.full_name", read_only=True)
    old_status_display  = serializers.SerializerMethodField()
    new_status_display  = serializers.SerializerMethodField()

    class Meta:
        model = StatusHistory
        fields = [
            "id", "old_status", "old_status_display",
            "new_status", "new_status_display",
            "changed_by_name", "comment", "created_at",
        ]

    def get_old_status_display(self, obj):
        return dict(Idea.STATUS_CHOICES).get(obj.old_status, obj.old_status)

    def get_new_status_display(self, obj):
        return dict(Idea.STATUS_CHOICES).get(obj.new_status, obj.new_status)


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_role = serializers.CharField(source="author.role", read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "author_name", "author_role", "content", "created_at", "is_hidden"]
        read_only_fields = ["id", "created_at", "is_hidden"]

    def get_author_name(self, obj):
        return obj.author.full_name if obj.author else "Utilisateur supprimé"


class IdeaListSerializer(serializers.ModelSerializer):
    category_name  = serializers.CharField(source="category.name", read_only=True)
    author_name    = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    status_color   = serializers.CharField(source="get_status_color", read_only=True)
    user_has_voted = serializers.SerializerMethodField()
    comment_count  = serializers.SerializerMethodField()

    class Meta:
        model = Idea
        fields = [
            "id", "title", "category_name", "author_name",
            "status", "status_display", "status_color",
            "visibility", "is_confidential", "is_pinned",
            "vote_count", "user_has_voted", "comment_count", "created_at",
        ]

    def get_author_name(self, obj):
        if obj.is_confidential:
            return "Anonyme"
        return obj.author.full_name if obj.author else "Inconnu"

    def get_user_has_voted(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return Vote.objects.filter(idea=obj, user=request.user).exists()
        return False

    def get_comment_count(self, obj):
        return obj.comments.filter(is_hidden=False).count()


class IdeaDetailSerializer(serializers.ModelSerializer):
    category       = CategorySerializer(read_only=True)
    category_id    = serializers.PrimaryKeyRelatedField(
                         queryset=Category.objects.filter(is_active=True),
                         source="category", write_only=True
                     )
    author_name    = serializers.SerializerMethodField()
    author_detail  = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    status_color   = serializers.CharField(source="get_status_color", read_only=True)
    rejection_category_display = serializers.SerializerMethodField()
    status_history = StatusHistorySerializer(many=True, read_only=True)
    comments       = CommentSerializer(many=True, read_only=True)
    user_has_voted = serializers.SerializerMethodField()

    class Meta:
        model = Idea
        fields = [
            "id", "title", "description", "category", "category_id",
            "author_name", "author_detail", "is_confidential", "visibility",
            "status", "status_display", "status_color", "attachment",
            "official_response",
            "rejection_category", "rejection_category_display", "rejection_reason",
            "is_pinned", "vote_count", "user_has_voted",
            "status_history", "comments",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "status", "vote_count", "created_at", "updated_at"]

    def get_author_name(self, obj):
        if obj.is_confidential:
            return "Anonyme"
        return obj.author.full_name if obj.author else "Inconnu"

    def get_author_detail(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated and request.user.can_manage_ideas():
            if obj.author:
                return UserPublicSerializer(obj.author).data
        return None

    def get_user_has_voted(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return Vote.objects.filter(idea=obj, user=request.user).exists()
        return False

    def get_rejection_category_display(self, obj):
        return dict(Idea.REJECTION_CATEGORY_CHOICES).get(obj.rejection_category, "")


class IdeaCreateSerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.filter(is_active=True), source="category"
    )
    status = serializers.ChoiceField(
        choices=[(Idea.BROUILLON, "Brouillon"), (Idea.EN_ATTENTE, "En attente")],
        default=Idea.EN_ATTENTE,
        required=False,
    )

    class Meta:
        model = Idea
        fields = [
            "title", "description", "category_id",
            "is_confidential", "visibility", "attachment", "status",
        ]

    def validate_attachment(self, value):
        if value:
            import os
            from django.conf import settings
            ext = os.path.splitext(value.name)[1].lower()
            if ext not in settings.ALLOWED_UPLOAD_EXTENSIONS:
                raise serializers.ValidationError(
                    "Extension non autorisée. Formats acceptés : PDF, DOCX, JPG, PNG."
                )
            if value.size > settings.MAX_UPLOAD_SIZE:
                raise serializers.ValidationError("Fichier trop volumineux. Maximum 5 Mo.")
        return value


class IdeaStatusUpdateSerializer(serializers.Serializer):
    status             = serializers.ChoiceField(choices=Idea.STATUS_CHOICES)
    comment            = serializers.CharField(required=False, allow_blank=True, default="")
    official_response  = serializers.CharField(required=False, allow_blank=True, default="")
    rejection_category = serializers.ChoiceField(
                             choices=Idea.REJECTION_CATEGORY_CHOICES,
                             required=False, allow_blank=True, default=""
                         )

    def validate(self, data):
        new_status = data["status"]

        if new_status == Idea.REJETEE:
            if not data.get("rejection_category"):
                raise serializers.ValidationError(
                    {"rejection_category": "La catégorie de rejet est obligatoire."}
                )
            if not data.get("comment"):
                raise serializers.ValidationError(
                    {"comment": "Un commentaire explicatif est obligatoire pour un rejet."}
                )

        if new_status in (Idea.ACCEPTEE, Idea.MISE_EN_OEUVRE, Idea.REALISEE):
            if not data.get("official_response"):
                raise serializers.ValidationError(
                    {"official_response": "Une réponse officielle est obligatoire pour ce statut."}
                )

        return data
