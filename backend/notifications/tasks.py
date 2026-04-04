from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings


def create_notification(recipient_id, title, message, link=""):
    from .models import Notification
    from accounts.models import User
    try:
        user = User.objects.get(id=recipient_id)
        Notification.objects.create(recipient=user, title=title, message=message, link=link)
    except User.DoesNotExist:
        pass


@shared_task
def notify_new_idea(idea_id):
    from ideas.models import Idea
    from accounts.models import User
    try:
        idea = Idea.objects.select_related("author", "category").get(id=idea_id)
    except Idea.DoesNotExist:
        return

    # Notify author
    if idea.author:
        create_notification(
            str(idea.author.id),
            "Idée soumise",
            f"Votre idée « {idea.title} » a été soumise et est en attente de validation.",
            f"/ideas/{idea.id}",
        )
        if idea.author.email:
            send_mail(
                subject="Votre idée a été soumise — ENSMG Boîte à Idées",
                message=f"Bonjour {idea.author.first_name},\n\nVotre idée « {idea.title} » a bien été soumise et est en attente de validation.\n\nCordialement,\nENSMG",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[idea.author.email],
                fail_silently=True,
            )

    # Notify responsable and admin
    from accounts.models import User
    managers = User.objects.filter(role__in=["responsable", "admin"], is_active=True)
    for manager in managers:
        create_notification(
            str(manager.id),
            "Nouvelle idée à valider",
            f"Une nouvelle idée « {idea.title} » attend votre validation.",
            f"/dashboard/ideas/{idea.id}",
        )


@shared_task
def notify_status_change(idea_id, old_status, new_status):
    from ideas.models import Idea
    try:
        idea = Idea.objects.select_related("author").get(id=idea_id)
    except Idea.DoesNotExist:
        return

    if not idea.author:
        return

    status_labels = {
        "en_attente": "En attente de validation",
        "publiee": "Publiée",
        "en_etude": "En étude",
        "acceptee": "Acceptée",
        "rejetee": "Rejetée",
        "mise_en_oeuvre": "Mise en œuvre",
        "archivee": "Archivée",
    }

    new_label = status_labels.get(new_status, new_status)
    create_notification(
        str(idea.author.id),
        f"Statut mis à jour : {new_label}",
        f"Le statut de votre idée « {idea.title} » est maintenant : {new_label}.",
        f"/ideas/{idea.id}",
    )

    if idea.author.email:
        send_mail(
            subject=f"Votre idée a été mise à jour — {new_label}",
            message=f"Bonjour {idea.author.first_name},\n\nLe statut de votre idée « {idea.title} » a été mis à jour : {new_label}.\n\nCordialement,\nENSMG",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[idea.author.email],
            fail_silently=True,
        )


@shared_task
def notify_comment_reported(comment_id):
    from ideas.models import Comment
    from accounts.models import User
    try:
        comment = Comment.objects.select_related("idea").get(id=comment_id)
    except Comment.DoesNotExist:
        return

    admins = User.objects.filter(role__in=["responsable", "admin"], is_active=True)
    for admin in admins:
        create_notification(
            str(admin.id),
            "Commentaire signalé",
            f"Un commentaire a été masqué automatiquement après 3 signalements sur l'idée « {comment.idea.title} ».",
            f"/dashboard/moderation",
        )
        if admin.email:
            send_mail(
                subject="Commentaire signalé — ENSMG Boîte à Idées",
                message=f"Un commentaire a été masqué automatiquement après 3 signalements.\n\nIdée concernée : {comment.idea.title}\n\nCordialement,\nSystème ENSMG",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[admin.email],
                fail_silently=True,
            )
