from pydantic import BaseModel
from typing import Optional


# Every notification has one of these types. Keeping this as a fixed set
# (not free-text) means the frontend can map each type to a consistent
# icon/color, and makes it easy to filter/query by type later.
NOTIFICATION_TYPES = {
    "dna_uploaded",
    "dna_upload_failed",
    "analysis_started",
    "analysis_completed",
    "analysis_failed",
    "report_generated",
    "report_downloaded",
}


class NotificationCreate(BaseModel):
    """
    Internal shape used when a backend event creates a notification.
    Not exposed via any API route directly — notification_service.py
    consumes this.
    """
    type: str
    title: str
    message: str
    link: Optional[str] = None  # e.g. "/reports" so the frontend can navigate on click


class NotificationResponse(BaseModel):
    """
    Public shape returned by GET /notifications/list.
    """
    id: str
    type: str
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool
    created_at: str


class NotificationListResponse(BaseModel):
    notifications: list[NotificationResponse]
    unread_count: int