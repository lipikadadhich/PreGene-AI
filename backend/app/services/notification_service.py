import json
import uuid
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Optional

NOTIFICATIONS_FILE = Path("notifications.json")
MAX_NOTIFICATIONS = 200


# ---------------------------------------------------------------------------
# Repository interface — the only contract notification_router.py and any
# event-triggering code (upload_service.py, analysis_service.py,
# report_router.py) should depend on. A future SSE/WebSocket push layer,
# or a swap to SQLite/Postgres, means implementing this interface again —
# nothing else in the app changes.
# ---------------------------------------------------------------------------
class NotificationRepository(ABC):
    @abstractmethod
    def add(self, record: dict) -> None:
        ...

    @abstractmethod
    def get_all(self) -> list[dict]:
        ...

    @abstractmethod
    def mark_read(self, notification_id: str) -> Optional[dict]:
        ...

    @abstractmethod
    def mark_all_read(self) -> int:
        """Returns the number of notifications that were marked read."""
        ...

    @abstractmethod
    def delete(self, notification_id: str) -> Optional[dict]:
        ...


class JsonNotificationRepository(NotificationRepository):
    def __init__(self, path: Path, max_records: int):
        self._path = path
        self._max_records = max_records
        self._lock = Lock()

    def _load(self) -> list[dict]:
        if not self._path.exists():
            return []
        try:
            with open(self._path, "r") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            return []

    def _save(self, records: list[dict]) -> None:
        with open(self._path, "w") as f:
            json.dump(records, f, indent=2)

    def add(self, record: dict) -> None:
        with self._lock:
            records = self._load()
            records.insert(0, record)
            records = records[: self._max_records]
            self._save(records)

    def get_all(self) -> list[dict]:
        with self._lock:
            return self._load()

    def mark_read(self, notification_id: str) -> Optional[dict]:
        with self._lock:
            records = self._load()
            for record in records:
                if record.get("id") == notification_id:
                    record["is_read"] = True
                    self._save(records)
                    return record
            return None

    def mark_all_read(self) -> int:
        with self._lock:
            records = self._load()
            count = 0
            for record in records:
                if not record.get("is_read"):
                    record["is_read"] = True
                    count += 1
            if count:
                self._save(records)
            return count

    def delete(self, notification_id: str) -> Optional[dict]:
        with self._lock:
            records = self._load()
            match = None
            remaining = []
            for record in records:
                if record.get("id") == notification_id and match is None:
                    match = record
                else:
                    remaining.append(record)
            if match is not None:
                self._save(remaining)
            return match


# To migrate storage or add a push layer later: implement a new
# NotificationRepository subclass and change this one line.
_repository: NotificationRepository = JsonNotificationRepository(
    NOTIFICATIONS_FILE, MAX_NOTIFICATIONS
)


# ---------------------------------------------------------------------------
# Public API — this is what upload_service.py, analysis_service.py,
# report_router.py, and notification_router.py call. No caller touches
# notifications.json or the repository classes directly.
# ---------------------------------------------------------------------------
def create_notification(
    type: str,
    title: str,
    message: str,
    link: str | None = None,
) -> None:
    """
    Creates and persists a notification. Called only from real backend
    event sites (upload complete, analysis started/completed/failed,
    report generated/downloaded) — never on a timer, never speculatively.
    """
    record = {
        "id": str(uuid.uuid4()),
        "type": type,
        "title": title,
        "message": message,
        "link": link,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _repository.add(record)


def get_notifications() -> list[dict]:
    """Returns all notifications, most recent first."""
    return _repository.get_all()


def get_unread_count() -> int:
    return sum(1 for record in _repository.get_all() if not record.get("is_read"))


def mark_read(notification_id: str) -> Optional[dict]:
    return _repository.mark_read(notification_id)


def mark_all_read() -> int:
    return _repository.mark_all_read()


def delete_notification(notification_id: str) -> Optional[dict]:
    return _repository.delete(notification_id)