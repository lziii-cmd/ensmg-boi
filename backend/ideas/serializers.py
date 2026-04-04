from rest_framework import serializers
from accounts.serializers import UserPublicSerializer
from .models import Category, Idea, StatusHistory, Vote, Comment


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "is_active", "order"]


class StatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source="changed_by.full_name", read_only=True)
    old_status_display = serializers.CharField(source="get_old_status_display", read_only=True)
    new_status_display = serializers.CharField(source="get_new_status_display", read_only=True)

    class Meta:
        model = StatusHistory
        fields = ["id", "old_status", "old_status_display", "new_status", "new_status_display",
                  "changed_by_name", "comment", "created_at"]


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_role = serializers.CharField(source="author.role", read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "author_name", "author_role", "content", "created_at", "is_hidden"]
        read_only_fields = ["id", "created_at", "is_hidden"]

    def get_author_name(self, obj):
        if obj.author:
            return obj.author.full_name
        return "Utilisateur supprimé"


class IdeaListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    author_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    status_color = serializers.CharField(source="get_status_color", read_only=True)
    user_has_voted = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()

    class Meta:
        model = Idea
        fields = [
            "id", "title", "category_name", "author_name", "status", "status_display",
            "status_color", "visibility", "is_confidential", "is_pinned",
            "vote_count", "user_has_voted", "comment_count", "created_at",
        ]

    def get_author_name(self, obj):
        if obj.is_confidential:
            return "Anonyme"
        if obj.author:
            return obj.author.full_name
        return "Inconnu"

    def get_user_has_voted(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return Vote.objects.filter(idea=obj, user=request.user).exists()
        return False

    def get_comment_count(self, obj):
        return obj.comments.filter(is_hidden=False).count()


class IdeaDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.filter(is_active=True), source="category", write_only=True
    )
    author_name = serializers.SerializerMethodField()
    author_detail = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    status_color = serializers.CharField(source="get_status_color", read_only=True)
    status_history = StatusHistorySerializer(many=True, read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    user_has_voted = serializers.SerializerMethodField()

    class Meta:
        model = Idea
        fields = [
            "id", "title", "description", "category", "category_id",
            "author_name", "author_detail", "is_confidential", "visibility",
            "status", "status_display", "status_color", "attachment",
            "official_response", "rejection_reason", "is_pinned",
            "vote_count", "user_has_voted", "status_history", "comments",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "status", "vote_count", "created_at", "updated_at"]

    def get_author_name(self, obj):
        if obj.is_confidential:
            return "Anonyme"
        if obj.author:
            return obj.author.full_name
        return "Inconnu"

    def get_author_detail(self, obj):
        request = self.context.get("request")
        # Admin/responsable see real identity even for confidential ideas
        if request and request.user.is_authenticated and request.user.can_manage_ideas():
            if obj.author:
                return UserPublicSerializer(obj.author).data
        return None

    def get_user_has_voted(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return Vote.objects.filter(idea=obj, user=request.user).exists()
        return False


class IdeaCreateSerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.filter(is_active=True), source="category"
    )

    class Meta:
        model = Idea
        fields = ["title", "description", "category_id", "is_confidential", "visibility", "attachment"]

    def validate_attachment(self, value):
        if value:
            import os
            from django.conf import settings
            ext = os.path.splitext(value.name)[1].lower()
            if ext not in settings.ALLOWED_UPLOAD_EXTENSIONS:
                raise serializers.ValidationError(
                    f"Extension non autorisée. Formats acceptés : PDF, DOCX, JPG, PNG."
                )
            if value.size > settings.MAX_UPLOAD_SIZE:
                raise serializers.ValidationError("Fichier trop volumineux. Maximum 5 Mo.")
        return value


class IdeaStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Idea.STATUS_CHOICES)
    comment = serializers.CharField(required=False, allow_blank=True)
    official_response = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        if data["status"] == Idea.REJETEE and not data.get("comment"):
            raise serializers.ValidationError({"comment": "Un motif est obligatoire pour un rejet."})
        return data
