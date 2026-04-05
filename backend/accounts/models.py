import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("L'adresse email est obligatoire.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("role", User.SUPERUSER)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("password_set", True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ELEVE = "eleve"
    PROFESSEUR = "professeur"
    PAT = "pat"
    RESPONSABLE = "responsable"
    ADMIN = "admin"
    SUPERUSER = "superuser"

    ROLE_CHOICES = [
        (ELEVE, "Étudiant(e)"),
        (PROFESSEUR, "Professeur"),
        (PAT, "Personnel administratif et technique"),
        (RESPONSABLE, "Responsable des communications"),
        (ADMIN, "Administrateur"),
        (SUPERUSER, "Super administrateur"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ELEVE)
    department = models.CharField(max_length=150, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    password_set = models.BooleanField(default=False)
    invitation_token = models.UUIDField(default=uuid.uuid4, unique=True)
    invitation_sent_at = models.DateTimeField(null=True, blank=True)
    date_joined = models.DateTimeField(default=timezone.now)
    failed_login_attempts = models.PositiveSmallIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    objects = UserManager()

    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def is_locked(self):
        if self.locked_until and self.locked_until > timezone.now():
            return True
        return False

    def can_manage_ideas(self):
        """Responsable et superuser peuvent gérer les idées. Admin NON."""
        return self.role in (self.RESPONSABLE, self.SUPERUSER)

    def can_manage_users(self):
        """Admin et superuser peuvent gérer les utilisateurs."""
        return self.role in (self.ADMIN, self.SUPERUSER)

    def can_audit(self):
        """Admin et superuser ont accès aux logs d'audit."""
        return self.role in (self.ADMIN, self.SUPERUSER)

    def is_admin_role(self):
        return self.role in (self.ADMIN, self.SUPERUSER)

    def is_regular_member(self):
        """Peut soumettre des idées, voter, commenter. Admin pur exclu."""
        return self.is_active and self.role != self.ADMIN


class MemberImport(models.Model):
    imported_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    imported_at = models.DateTimeField(auto_now_add=True)
    file_name = models.CharField(max_length=255)
    rows_processed = models.PositiveIntegerField(default=0)
    rows_created = models.PositiveIntegerField(default=0)
    rows_updated = models.PositiveIntegerField(default=0)
    rows_errors = models.PositiveIntegerField(default=0)
    errors = models.JSONField(default=list)

    class Meta:
        ordering = ["-imported_at"]

    def __str__(self):
        return f"Import {self.file_name} — {self.imported_at:%d/%m/%Y %H:%M}"


class AuditLog(models.Model):
    # Types d'actions
    LOGIN = "login"
    LOGOUT = "logout"
    CREATE_USER = "create_user"
    UPDATE_USER = "update_user"
    DELETE_USER = "delete_user"
    TOGGLE_ACTIVE = "toggle_active"
    IMPORT_USERS = "import_users"
    IDEA_STATUS = "idea_status"
    IDEA_CREATE = "idea_create"
    IDEA_PIN = "idea_pin"
    COMMENT_MODERATE = "comment_moderate"

    ACTION_CHOICES = [
        (LOGIN, "Connexion"),
        (LOGOUT, "Déconnexion"),
        (CREATE_USER, "Création de membre"),
        (UPDATE_USER, "Modification de membre"),
        (DELETE_USER, "Suppression de membre"),
        (TOGGLE_ACTIVE, "Activation/Désactivation"),
        (IMPORT_USERS, "Import de membres"),
        (IDEA_STATUS, "Changement de statut d'idée"),
        (IDEA_CREATE, "Soumission d'idée"),
        (IDEA_PIN, "Épinglage d'idée"),
        (COMMENT_MODERATE, "Modération de commentaire"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True,
        related_name="audit_logs"
    )
    action = models.CharField(max_length=30, choices=ACTION_CHOICES)
    target_type = models.CharField(max_length=50, blank=True)   # "user", "idea", "comment"
    target_id = models.CharField(max_length=100, blank=True)
    target_repr = models.CharField(max_length=255, blank=True)  # description lisible
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Log d'audit"
        verbose_name_plural = "Logs d'audit"
        ordering = ["-created_at"]

    def __str__(self):
        user_str = self.user.full_name if self.user else "Inconnu"
        return f"[{self.created_at:%d/%m/%Y %H:%M}] {user_str} — {self.get_action_display()}"
