from rest_framework import serializers
from django.utils import timezone
from .models import User, MemberImport, AuditLog


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            "id", "email", "first_name", "last_name", "full_name",
            "role", "department", "is_active", "password_set", "date_joined",
        ]
        read_only_fields = ["id", "date_joined", "password_set"]


class UserPublicSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = ["id", "full_name", "role", "department"]


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get("email", "").lower().strip()
        password = data.get("password", "")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Identifiants invalides.")

        if not user.is_active:
            raise serializers.ValidationError("Ce compte est désactivé.")

        if user.is_locked:
            raise serializers.ValidationError(
                "Compte temporairement bloqué suite à trop de tentatives. Réessayez plus tard."
            )

        if not user.check_password(password):
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 5:
                user.locked_until = timezone.now() + timezone.timedelta(minutes=30)
            user.save(update_fields=["failed_login_attempts", "locked_until"])
            raise serializers.ValidationError("Identifiants invalides.")

        user.failed_login_attempts = 0
        user.locked_until = None
        user.save(update_fields=["failed_login_attempts", "locked_until"])

        if not user.password_set:
            raise serializers.ValidationError(
                "Vous devez d'abord définir votre mot de passe via le lien d'invitation.",
                code="password_not_set"
            )

        data["user"] = user
        return data


class SetPasswordSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    password = serializers.CharField(min_length=8, write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    def validate(self, data):
        if data["password"] != data["password_confirm"]:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas.")
        try:
            user = User.objects.get(invitation_token=data["token"], is_active=True)
        except User.DoesNotExist:
            raise serializers.ValidationError("Lien invalide ou expiré.")
        data["user"] = user
        return data


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(min_length=8, write_only=True)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, data):
        if data["new_password"] != data["new_password_confirm"]:
            raise serializers.ValidationError("Les nouveaux mots de passe ne correspondent pas.")
        return data


class MemberImportSerializer(serializers.ModelSerializer):
    imported_by_name = serializers.CharField(source="imported_by.full_name", read_only=True)

    class Meta:
        model = MemberImport
        fields = [
            "id", "imported_by_name", "imported_at", "file_name",
            "rows_processed", "rows_created", "rows_updated", "rows_errors", "errors",
        ]


class SuperuserSetupSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    def validate_email(self, value):
        return value.lower().strip()

    def validate(self, data):
        if data["password"] != data["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Les mots de passe ne correspondent pas."})
        return data


class RegisterSerializer(serializers.Serializer):
    first_name       = serializers.CharField(max_length=100)
    last_name        = serializers.CharField(max_length=100)
    email            = serializers.EmailField()
    role             = serializers.ChoiceField(choices=[
                           (User.ELEVE,      "Étudiant(e)"),
                           (User.PROFESSEUR, "Professeur"),
                           (User.PAT,        "Personnel administratif et technique"),
                           (User.DIRECTEUR,  "Directeur"),
                       ])
    password         = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True)

    def validate_email(self, value):
        value = value.lower().strip()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Cette adresse email est déjà utilisée.")
        return value

    def validate(self, data):
        if data["password"] != data["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Les mots de passe ne correspondent pas."})
        return data


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    action_label = serializers.CharField(source="get_action_display", read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            "id", "user_name", "user_email", "action", "action_label",
            "target_type", "target_id", "target_repr",
            "details", "ip_address", "created_at",
        ]

    def get_user_name(self, obj):
        return obj.user.full_name if obj.user else "Inconnu"

    def get_user_email(self, obj):
        return obj.user.email if obj.user else ""
