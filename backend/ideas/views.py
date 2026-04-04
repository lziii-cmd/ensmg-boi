from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from accounts.permissions import IsResponsableOrAdmin, IsMember
from .models import Category, Idea, StatusHistory, Vote, Comment, CommentReport
from .serializers import (
    CategorySerializer, IdeaListSerializer, IdeaDetailSerializer,
    IdeaCreateSerializer, IdeaStatusUpdateSerializer, CommentSerializer,
)
from .tasks import notify_status_change, notify_comment_reported


class CategoryListView(generics.ListAPIView):
    serializer_class = CategorySerializer
    queryset = Category.objects.filter(is_active=True)


class IdeaListView(generics.ListAPIView):
    serializer_class = IdeaListSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "category"]
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "vote_count"]
    ordering = ["-is_pinned", "-created_at"]

    def get_queryset(self):
        user = self.request.user
        qs = Idea.objects.select_related("author", "category")

        if user.can_manage_ideas():
            # Responsable and admin see all ideas
            return qs

        # Regular members see:
        # - Public ideas that are published or later
        # - Their own ideas (any status/visibility)
        return qs.filter(
            Q(visibility=Idea.PUBLIC, status__in=[
                Idea.PUBLIEE, Idea.EN_ETUDE, Idea.ACCEPTEE, Idea.MISE_EN_OEUVRE
            ]) | Q(author=user)
        )


class IdeaCreateView(generics.CreateAPIView):
    serializer_class = IdeaCreateSerializer

    def perform_create(self, serializer):
        from notifications.tasks import notify_new_idea
        idea = serializer.save(author=self.request.user)
        notify_new_idea.delay(str(idea.id))


class IdeaDetailView(generics.RetrieveAPIView):
    serializer_class = IdeaDetailSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Idea.objects.select_related("author", "category").prefetch_related(
            "status_history", "comments__author"
        )
        if user.can_manage_ideas():
            return qs
        return qs.filter(
            Q(visibility=Idea.PUBLIC, status__in=[
                Idea.PUBLIEE, Idea.EN_ETUDE, Idea.ACCEPTEE, Idea.MISE_EN_OEUVRE
            ]) | Q(author=user)
        )


class MyIdeasView(generics.ListAPIView):
    serializer_class = IdeaListSerializer

    def get_queryset(self):
        return Idea.objects.filter(author=self.request.user).select_related("category")


class IdeaStatusUpdateView(APIView):
    permission_classes = [IsResponsableOrAdmin]

    def patch(self, request, pk):
        try:
            idea = Idea.objects.get(pk=pk)
        except Idea.DoesNotExist:
            return Response({"detail": "Idée introuvable."}, status=status.HTTP_404_NOT_FOUND)

        serializer = IdeaStatusUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        old_status = idea.status
        new_status = serializer.validated_data["status"]
        comment = serializer.validated_data.get("comment", "")
        official_response = serializer.validated_data.get("official_response", "")

        idea.status = new_status
        if new_status == Idea.REJETEE:
            idea.rejection_reason = comment
        if official_response:
            idea.official_response = official_response
        idea.save()

        StatusHistory.objects.create(
            idea=idea,
            old_status=old_status,
            new_status=new_status,
            changed_by=request.user,
            comment=comment,
        )

        from notifications.tasks import notify_status_change
        notify_status_change.delay(str(idea.id), old_status, new_status)

        return Response(IdeaDetailSerializer(idea, context={"request": request}).data)


class IdeaPinView(APIView):
    permission_classes = [IsResponsableOrAdmin]

    def patch(self, request, pk):
        try:
            idea = Idea.objects.get(pk=pk)
        except Idea.DoesNotExist:
            return Response({"detail": "Idée introuvable."}, status=status.HTTP_404_NOT_FOUND)
        idea.is_pinned = not idea.is_pinned
        idea.save(update_fields=["is_pinned"])
        return Response({"is_pinned": idea.is_pinned})


class VoteView(APIView):
    def post(self, request, pk):
        try:
            idea = Idea.objects.get(pk=pk, status__in=[
                Idea.PUBLIEE, Idea.EN_ETUDE, Idea.ACCEPTEE, Idea.MISE_EN_OEUVRE
            ])
        except Idea.DoesNotExist:
            return Response({"detail": "Idée introuvable ou non publiée."}, status=status.HTTP_404_NOT_FOUND)

        vote, created = Vote.objects.get_or_create(idea=idea, user=request.user)
        if not created:
            vote.delete()
            Idea.objects.filter(pk=pk).update(vote_count=max(0, idea.vote_count - 1))
            return Response({"voted": False, "vote_count": idea.vote_count - 1})

        Idea.objects.filter(pk=pk).update(vote_count=idea.vote_count + 1)
        return Response({"voted": True, "vote_count": idea.vote_count + 1})


class CommentCreateView(generics.CreateAPIView):
    serializer_class = CommentSerializer

    def perform_create(self, serializer):
        try:
            idea = Idea.objects.get(pk=self.kwargs["pk"])
        except Idea.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound("Idée introuvable.")
        serializer.save(author=self.request.user, idea=idea)


class CommentReportView(APIView):
    def post(self, request, pk):
        try:
            comment = Comment.objects.get(pk=pk, is_hidden=False)
        except Comment.DoesNotExist:
            return Response({"detail": "Commentaire introuvable."}, status=status.HTTP_404_NOT_FOUND)

        _, created = CommentReport.objects.get_or_create(comment=comment, reporter=request.user)
        if not created:
            return Response({"detail": "Vous avez déjà signalé ce commentaire."}, status=status.HTTP_400_BAD_REQUEST)

        comment.report_count += 1
        if comment.report_count >= 3:
            comment.is_hidden = True
            from notifications.tasks import notify_comment_reported
            notify_comment_reported.delay(str(comment.id))
        comment.save()
        return Response({"detail": "Commentaire signalé."})


class CommentModerationView(APIView):
    permission_classes = [IsResponsableOrAdmin]

    def get(self, request):
        comments = Comment.objects.filter(is_hidden=True).select_related("author", "idea")
        data = []
        for c in comments:
            data.append({
                "id": str(c.id),
                "content": c.content,
                "author": c.author.full_name if c.author else "Inconnu",
                "idea_title": c.idea.title,
                "idea_id": str(c.idea.id),
                "report_count": c.report_count,
                "created_at": c.created_at,
            })
        return Response(data)

    def patch(self, request, pk):
        try:
            comment = Comment.objects.get(pk=pk)
        except Comment.DoesNotExist:
            return Response({"detail": "Commentaire introuvable."}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get("action")
        if action == "approve":
            comment.is_hidden = False
            comment.report_count = 0
            comment.save()
            return Response({"detail": "Commentaire réapprouvé."})
        elif action == "delete":
            comment.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response({"detail": "Action invalide."}, status=status.HTTP_400_BAD_REQUEST)


class DashboardStatsView(APIView):
    permission_classes = [IsResponsableOrAdmin]

    def get(self, request):
        from django.db.models import Count
        from datetime import timedelta

        now = timezone.now()
        week_ago = now - timedelta(days=7)

        total = Idea.objects.count()
        by_status = {
            s: Idea.objects.filter(status=s).count()
            for s, _ in Idea.STATUS_CHOICES
        }
        by_category = list(
            Idea.objects.values("category__name")
            .annotate(count=Count("id"))
            .order_by("-count")[:5]
        )
        pending_old = Idea.objects.filter(
            status=Idea.EN_ATTENTE, created_at__lte=now - timedelta(hours=48)
        ).count()
        in_study_old = Idea.objects.filter(
            status=Idea.EN_ETUDE, updated_at__lte=now - timedelta(days=7)
        ).count()
        recent = Idea.objects.filter(created_at__gte=week_ago).count()

        return Response({
            "total": total,
            "by_status": by_status,
            "by_category": by_category,
            "alerts": {
                "pending_over_48h": pending_old,
                "in_study_over_7d": in_study_old,
            },
            "recent_week": recent,
        })
