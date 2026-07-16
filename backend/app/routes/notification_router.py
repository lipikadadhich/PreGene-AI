from fastapi import APIRouter, HTTPException

from app.services import notification_service
from app.schemas.notification_schema import NotificationListResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/list", response_model=NotificationListResponse)
def list_notifications():
    """
    Returns all notifications (most recent first) plus the current unread
    count. Called on page load and whenever the notification dropdown is
    opened — no polling, per the V1 design decision.
    """
    notifications = notification_service.get_notifications()
    unread_count = sum(1 for n in notifications if not n.get("is_read"))

    return {
        "notifications": notifications,
        "unread_count": unread_count,
    }


@router.post("/{notification_id}/read")
def mark_notification_read(notification_id: str):
    record = notification_service.mark_read(notification_id)

    if record is None:
        raise HTTPException(status_code=404, detail="Notification not found")

    return record


@router.post("/read-all")
def mark_all_notifications_read():
    count = notification_service.mark_all_read()
    return {"marked_read": count}


@router.delete("/{notification_id}")
def delete_notification(notification_id: str):
    record = notification_service.delete_notification(notification_id)

    if record is None:
        raise HTTPException(status_code=404, detail="Notification not found")

    return {"deleted": True, "id": notification_id}