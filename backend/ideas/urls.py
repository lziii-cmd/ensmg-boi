from django.urls import path
from . import views

urlpatterns = [
    path("categories/", views.CategoryListView.as_view(), name="category_list"),
    path("", views.IdeaListView.as_view(), name="idea_list"),
    path("create/", views.IdeaCreateView.as_view(), name="idea_create"),
    path("mine/", views.MyIdeasView.as_view(), name="my_ideas"),
    path("dashboard/", views.DashboardStatsView.as_view(), name="dashboard_stats"),
    path("moderation/comments/", views.CommentModerationView.as_view(), name="comment_moderation"),
    path("moderation/comments/<uuid:pk>/", views.CommentModerationView.as_view(), name="comment_moderate"),
    path("<uuid:pk>/", views.IdeaDetailView.as_view(), name="idea_detail"),
    path("<uuid:pk>/status/", views.IdeaStatusUpdateView.as_view(), name="idea_status"),
    path("<uuid:pk>/pin/", views.IdeaPinView.as_view(), name="idea_pin"),
    path("<uuid:pk>/vote/", views.VoteView.as_view(), name="idea_vote"),
    path("<uuid:pk>/comments/", views.CommentCreateView.as_view(), name="idea_comment"),
    path("comments/<uuid:pk>/report/", views.CommentReportView.as_view(), name="comment_report"),
]
