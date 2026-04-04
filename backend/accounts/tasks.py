from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string


@shared_task
def send_invitation_email(user_id):
    from .models import User
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return

    set_password_url = f"{settings.FRONTEND_URL}/set-password/{user.invitation_token}"

    subject = "Bienvenue sur la Boîte à Idées ENSMG — Définissez votre mot de passe"
    message = f"""Bonjour {user.first_name},

Vous avez été ajouté(e) à la plateforme Boîte à Idées de l'ENSMG.

Pour accéder à la plateforme, veuillez définir votre mot de passe en cliquant sur le lien ci-dessous :

{set_password_url}

Ce lien est valable 72 heures.

Cordialement,
L'équipe ENSMG
"""
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=True,
    )


@shared_task
def send_password_reset_email(user_id):
    from .models import User
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return

    reset_url = f"{settings.FRONTEND_URL}/set-password/{user.invitation_token}"

    subject = "Réinitialisation de votre mot de passe — ENSMG Boîte à Idées"
    message = f"""Bonjour {user.first_name},

Vous avez demandé la réinitialisation de votre mot de passe.

Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :

{reset_url}

Ce lien est valable 72 heures.

Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.

Cordialement,
L'équipe ENSMG
"""
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=True,
    )
