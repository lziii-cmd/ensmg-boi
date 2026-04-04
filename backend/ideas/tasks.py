from celery import shared_task


@shared_task
def notify_status_change(idea_id, old_status, new_status):
    pass  # Delegated to notifications app


@shared_task
def notify_comment_reported(comment_id):
    pass  # Delegated to notifications app
