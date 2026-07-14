import json
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Optional

HISTORY_FILE = Path("analysis_history.json")
MAX_RECORDS = 50


# ---------------------------------------------------------------------------
# Repository interface
#
# This is the ONLY contract report_router.py, analysis_service.py, and any
# future caller should ever depend on. It knows nothing about JSON files —
# a SQLite or PostgreSQL implementation could satisfy this exact interface
# with zero changes needed anywhere else in the app.
# ---------------------------------------------------------------------------
class ReportHistoryRepository(ABC):
    @abstractmethod
    def add(self, record: dict) -> None:
        ...

    @abstractmethod
    def get_all(self) -> list[dict]:
        ...

    @abstractmethod
    def get_by_id(self, report_id: str) -> Optional[dict]:
        ...

    @abstractmethod
    def delete_by_id(self, report_id: str) -> Optional[dict]:
        """Deletes the record and returns it (so the caller can clean up
        any associated file, e.g. the PDF), or None if not found."""
        ...


# ---------------------------------------------------------------------------
# Flat-file JSON implementation (today's storage).
#
# Same read-whole-file/write-whole-file pattern as before, with a Lock to
# guard against races (same reasoning as job_service.py). Swapping this
# out later for a SqliteReportHistoryRepository or similar means writing
# one new class here and changing the single line that constructs
# `_repository` below — nothing else in the app needs to know.
# ---------------------------------------------------------------------------
class JsonReportHistoryRepository(ReportHistoryRepository):
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

    def get_by_id(self, report_id: str) -> Optional[dict]:
        with self._lock:
            records = self._load()
        for record in records:
            if record.get("report_id") == report_id:
                return record
        return None

    def delete_by_id(self, report_id: str) -> Optional[dict]:
        with self._lock:
            records = self._load()
            match = None
            remaining = []
            for record in records:
                if record.get("report_id") == report_id and match is None:
                    match = record
                else:
                    remaining.append(record)
            if match is not None:
                self._save(remaining)
            return match


# ---------------------------------------------------------------------------
# Active repository instance.
#
# To migrate storage later: implement a new ReportHistoryRepository
# subclass (e.g. SqliteReportHistoryRepository) and change this one line.
# Everything below (and every caller elsewhere in the app) stays the same.
# ---------------------------------------------------------------------------
_repository: ReportHistoryRepository = JsonReportHistoryRepository(
    HISTORY_FILE, MAX_RECORDS
)


# ---------------------------------------------------------------------------
# Public API — this is what the rest of the backend calls. Nothing outside
# this file should import ReportHistoryRepository, JsonReportHistoryRepository,
# or touch analysis_history.json directly.
# ---------------------------------------------------------------------------
def append_history_record(patient: dict, result: dict, report_id: str, pdf_path: str) -> None:
    """
    Stores a full record of a completed analysis — enough data for the
    Report History list, View, and Compare features, not just the
    lightweight summary fields used previously.
    """
    record = {
        "report_id": report_id,
        "disease": patient.get("disease", "Unknown"),
        "risk_score": result.get("risk_score"),
        "risk_level": result.get("risk_level"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "pdf_path": pdf_path,
        "patient": patient,
        "recommendation": result.get("recommendation"),
        "inheritance": result.get("inheritance"),
        "counselling": result.get("counselling"),
    }

    _repository.add(record)


def get_history() -> list[dict]:
    """Returns all stored report records, most recent first."""
    return _repository.get_all()


def get_report_by_id(report_id: str) -> Optional[dict]:
    """Returns the full record for one report, or None if not found."""
    return _repository.get_by_id(report_id)


def delete_report_by_id(report_id: str) -> Optional[dict]:
    """
    Deletes the record and returns the deleted record (which includes
    pdf_path) so the caller — report_router.py — can also delete the
    PDF file from disk. Returns None if no record matched.
    """
    return _repository.delete_by_id(report_id)