from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, MemberImport


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ["email", "full_name", "role", "department", "is_active", "password_set"]
    list_filter = ["role", "is_active", "password_set"]
    search_fields = ["email", "first_name", "last_name"]
    ordering = ["email"]
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Informations personnelles", {"fields": ("first_name", "last_name", "department")}),
        ("Rôle et accès", {"fields": ("role", "is_active", "is_staff", "is_superuser", "password_set")}),
        ("Invitation", {"fields": ("invitation_token", "invitation_sent_at")}),
    )
    add_fieldsets = (
        (None, {"fields": ("email", "password1", "password2", "first_name", "last_name", "role")}),
    )


@admin.register(MemberImport)
class MemberImportAdmin(admin.ModelAdmin):
    list_display = ["file_name", "imported_by", "imported_at", "rows_created", "rows_errors"]
    readonly_fields = ["imported_at"]
