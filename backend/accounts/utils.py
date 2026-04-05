from .models import AuditLog


def get_client_ip(request):
    x_forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded:
        return x_forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "")


def log_action(user, action, target_type="", target_id="", target_repr="", details=None, ip=""):
    """Crée un log d'audit."""
    AuditLog.objects.create(
        user=user,
        action=action,
        target_type=target_type,
        target_id=str(target_id) if target_id else "",
        target_repr=target_repr,
        details=details or {},
        ip_address=ip,
    )
