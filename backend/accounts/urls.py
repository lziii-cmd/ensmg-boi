from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path("setup/", views.SetupView.as_view(), name="setup"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("register/", views.RegisterView.as_view(), name="register"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("set-password/", views.SetPasswordView.as_view(), name="set_password"),
    path("password-reset/", views.PasswordResetRequestView.as_view(), name="password_reset"),
    path("me/", views.MeView.as_view(), name="me"),
    path("change-password/", views.ChangePasswordView.as_view(), name="change_password"),
    path("users/", views.UserListView.as_view(), name="user_list"),
    path("users/<uuid:pk>/", views.UserDetailView.as_view(), name="user_detail"),
    path("users/<uuid:pk>/resend-invitation/", views.ResendInvitationView.as_view(), name="resend_invitation"),
    path("users/create/", views.CreateMemberView.as_view(), name="create_member"),
    path("import/", views.ImportMembersView.as_view(), name="import_members"),
    path("import/history/", views.ImportHistoryView.as_view(), name="import_history"),
    path("audit/", views.AuditLogView.as_view(), name="audit_log"),
]
