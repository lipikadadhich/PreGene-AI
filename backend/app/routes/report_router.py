from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path

from app.services import history_service

router = APIRouter(prefix="/report", tags=["Report"])


@router.get("/download")
def download_report():
    """
    Legacy endpoint, left as-is: serves reports/Pregene_Report.pdf if that
    exact fixed file still exists. New reports no longer write to this
    path (see report_service.py), so this will only work for whatever
    file was last generated before that change. Prefer
    GET /report/{report_id}/download for anything going forward.
    """
    pdf_path = Path("reports/Pregene_Report.pdf")

    if not pdf_path.exists():
        return {"error": "Report not found"}

    return FileResponse(
        path=str(pdf_path),
        filename="PreGene_AI_Report.pdf",
        media_type="application/pdf",
    )


@router.get("/list")
def list_reports():
    """
    Returns all saved report records, most recent first. Used by the
    Report History page for the table/list view, search, filter, sort.
    """
    return {"reports": history_service.get_history()}


@router.get("/{report_id}")
def get_report(report_id: str):
    """
    Returns the full record for one report (patient info, recommendation,
    inheritance, counselling) — used for the View and Compare features.
    """
    record = history_service.get_report_by_id(report_id)

    if record is None:
        raise HTTPException(status_code=404, detail="Report not found")

    return record


@router.get("/{report_id}/download")
def download_report_by_id(report_id: str):
    """
    Downloads the PDF for a specific report by id.
    """
    record = history_service.get_report_by_id(report_id)

    if record is None:
        raise HTTPException(status_code=404, detail="Report not found")

    pdf_path = Path(record.get("pdf_path", ""))

    if not pdf_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Report record exists but its PDF file is missing.",
        )

    return FileResponse(
        path=str(pdf_path),
        filename=f"{report_id}.pdf",
        media_type="application/pdf",
    )


@router.delete("/{report_id}")
def delete_report(report_id: str):
    """
    Deletes a report record and its associated PDF file from disk.
    """
    record = history_service.delete_report_by_id(report_id)

    if record is None:
        raise HTTPException(status_code=404, detail="Report not found")

    pdf_path = Path(record.get("pdf_path", ""))
    if pdf_path.exists():
        pdf_path.unlink()

    return {"deleted": True, "report_id": report_id}