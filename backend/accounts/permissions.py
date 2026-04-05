from rest_framework.permissions import BasePermission
from .models import User


class IsAdmin(BasePermission):
    """Admin pur ou superuser — gestion des utilisateurs + audit."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.can_manage_users()


class IsResponsable(BasePermission):
    """Responsable ou superuser — gestion des idées."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.can_manage_ideas()


class IsResponsableOrAdmin(BasePermission):
    """Responsable, admin pur ou superuser — accès au dashboard."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in (
            User.RESPONSABLE, User.ADMIN, User.SUPERUSER
        )


class IsAuditor(BasePermission):
    """Admin pur ou superuser — accès aux logs d'audit."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.can_audit()


class IsMember(BasePermission):
    """Membre actif quelconque (hors admin pur)."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_active


class IsRegularMember(BasePermission):
    """Peut soumettre/voter/commenter. Admin pur exclu (il utilise son compte PAT)."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.is_regular_member()
        )
