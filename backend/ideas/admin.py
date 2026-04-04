from django.contrib import admin
from .models import Category, Idea, StatusHistory, Vote, Comment


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "is_active", "order"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Idea)
class IdeaAdmin(admin.ModelAdmin):
    list_display = ["title", "author", "category", "status", "visibility", "vote_count", "created_at"]
    list_filter = ["status", "visibility", "category"]
    search_fields = ["title", "description"]
    readonly_fields = ["created_at", "updated_at", "vote_count"]


@admin.register(StatusHistory)
class StatusHistoryAdmin(admin.ModelAdmin):
    list_display = ["idea", "old_status", "new_status", "changed_by", "created_at"]
    readonly_fields = ["created_at"]


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ["idea", "author", "is_hidden", "report_count", "created_at"]
    list_filter = ["is_hidden"]
