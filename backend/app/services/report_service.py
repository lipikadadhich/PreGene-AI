from datetime import datetime
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    ListFlowable,
    ListItem,
)

from ai.recommendation.evidence_tiers import tier_has_validated_details


# ---------------------------------------------------------------------------
# Color Palette
# ---------------------------------------------------------------------------
PRIMARY_BLUE = colors.HexColor("#1A3A63")
SECONDARY_BLUE = colors.HexColor("#2C5F9E")
LIGHT_BLUE = colors.HexColor("#EAF1FA")
ACCENT_BLUE = colors.HexColor("#D6E4F5")
DARK_TEXT = colors.HexColor("#1F2937")
GREY_TEXT = colors.HexColor("#6B7280")
BORDER_GREY = colors.HexColor("#B9C4D0")
ROW_ALT = colors.HexColor("#F4F7FB")
WHITE = colors.white
AMBER_BG = colors.HexColor("#FEF3C7")
AMBER_BORDER = colors.HexColor("#F59E0B")
AMBER_TEXT = colors.HexColor("#92400E")

RISK_COLORS = {
    "LOW": colors.HexColor("#1E8449"),
    "MODERATE": colors.HexColor("#B9770E"),
    "MEDIUM": colors.HexColor("#B9770E"),
    "HIGH": colors.HexColor("#C0392B"),
    "CRITICAL": colors.HexColor("#922B21"),
}


# ---------------------------------------------------------------------------
# Styles
# ---------------------------------------------------------------------------
def _build_styles():
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        name="SectionHeading",
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        textColor=PRIMARY_BLUE,
        spaceBefore=14,
        spaceAfter=6,
    ))

    styles.add(ParagraphStyle(
        name="SubText",
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=GREY_TEXT,
    ))

    styles.add(ParagraphStyle(
        name="CellText",
        fontName="Helvetica",
        fontSize=9.5,
        leading=13,
        textColor=DARK_TEXT,
    ))

    styles.add(ParagraphStyle(
        name="CellLabel",
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=13,
        textColor=PRIMARY_BLUE,
    ))

    styles.add(ParagraphStyle(
        name="BulletText",
        fontName="Helvetica",
        fontSize=10,
        leading=15,
        textColor=DARK_TEXT,
        alignment=TA_LEFT,
    ))

    styles.add(ParagraphStyle(
        name="BodyJustify",
        fontName="Helvetica",
        fontSize=10,
        leading=15,
        textColor=DARK_TEXT,
        alignment=TA_JUSTIFY,
    ))

    styles.add(ParagraphStyle(
        name="AmberNotice",
        fontName="Helvetica",
        fontSize=9.5,
        leading=14,
        textColor=AMBER_TEXT,
        alignment=TA_JUSTIFY,
    ))

    return styles


STYLES = _build_styles()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _generate_report_id():
    return f"PGAI-{datetime.now().strftime('%Y%m%d')}-{datetime.now().strftime('%H%M%S%f')}"


def _risk_color(level):
    if not level:
        return DARK_TEXT
    return RISK_COLORS.get(str(level).upper(), DARK_TEXT)


def _p(text, style="CellText"):
    return Paragraph(str(text) if text not in (None, "") else "N/A", STYLES[style])


def _section_table(rows, col_widths):
    """Bordered label/value table with alternating row colors (used for
    Patient Summary, Risk Assessment, and CRISPR Recommendation)."""
    table = Table(rows, colWidths=col_widths, hAlign="LEFT")
    style_cmds = [
        ("BOX", (0, 0), (-1, -1), 0.75, BORDER_GREY),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER_GREY),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("BACKGROUND", (0, 0), (0, -1), LIGHT_BLUE),
    ]
    for i in range(len(rows)):
        if i % 2 == 1:
            style_cmds.append(("BACKGROUND", (1, i), (1, i), ROW_ALT))
    table.setStyle(TableStyle(style_cmds))
    return table


def _grid_table(header, data_rows, col_widths):
    """Bordered multi-column table with a blue header row (used for
    Inheritance Probability)."""
    header_row = [
        Paragraph(f'<font color="white"><b>{h}</b></font>', STYLES["CellText"])
        for h in header
    ]
    full_data = [header_row] + data_rows

    table = Table(full_data, colWidths=col_widths, hAlign="LEFT", repeatRows=1)
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), SECONDARY_BLUE),
        ("BOX", (0, 0), (-1, -1), 0.75, BORDER_GREY),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER_GREY),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]
    for i in range(1, len(full_data)):
        if i % 2 == 0:
            style_cmds.append(("BACKGROUND", (0, i), (-1, i), ROW_ALT))
    table.setStyle(TableStyle(style_cmds))
    return table


def _notice_box(text):
    """
    Amber notice box used for the theoretical-candidate / no-known-strategy
    explanation — visually mirrors the amber notice used in the UI
    (CrisprEvidenceNotice), so the PDF and UI present this state
    consistently rather than looking like two different products.
    """
    table = Table([[_p(text, "AmberNotice")]], colWidths=[180 * mm], hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.75, AMBER_BORDER),
        ("BACKGROUND", (0, 0), (-1, -1), AMBER_BG),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return table


# ---------------------------------------------------------------------------
# Header / Footer drawing
# ---------------------------------------------------------------------------
def _draw_header_footer(canvas_obj, doc, report_id):
    canvas_obj.saveState()
    width, height = A4

    header_height = 26 * mm
    canvas_obj.setFillColor(PRIMARY_BLUE)
    canvas_obj.rect(0, height - header_height, width, header_height, fill=1, stroke=0)

    canvas_obj.setFillColor(SECONDARY_BLUE)
    canvas_obj.rect(0, height - header_height - 2, width, 2, fill=1, stroke=0)

    canvas_obj.setFillColor(WHITE)
    canvas_obj.setFont("Helvetica-Bold", 18)
    canvas_obj.drawCentredString(width / 2, height - 14 * mm, "PreGene-AI")

    canvas_obj.setFont("Helvetica", 10.5)
    canvas_obj.setFillColor(ACCENT_BLUE)
    canvas_obj.drawCentredString(width / 2, height - 20 * mm, "AI Genetic Risk Assessment Report")

    canvas_obj.setFont("Helvetica", 7.5)
    canvas_obj.setFillColor(ACCENT_BLUE)
    canvas_obj.drawRightString(width - 15 * mm, height - header_height - 10, report_id)

    footer_y = 12 * mm
    canvas_obj.setStrokeColor(BORDER_GREY)
    canvas_obj.setLineWidth(0.5)
    canvas_obj.line(15 * mm, footer_y + 8, width - 15 * mm, footer_y + 8)

    canvas_obj.setFont("Helvetica-Bold", 8)
    canvas_obj.setFillColor(PRIMARY_BLUE)
    canvas_obj.drawCentredString(width / 2, footer_y, "Generated by PreGene-AI v1.0")

    canvas_obj.setFont("Helvetica", 7.5)
    canvas_obj.setFillColor(GREY_TEXT)
    canvas_obj.drawCentredString(width / 2, footer_y - 10, "For Educational and Research Purposes Only")

    canvas_obj.setFont("Helvetica", 7.5)
    canvas_obj.drawRightString(width - 15 * mm, footer_y, f"Page {doc.page}")

    canvas_obj.restoreState()


def _make_page_callback(report_id):
    def _callback(canvas_obj, doc):
        _draw_header_footer(canvas_obj, doc, report_id)
    return _callback


# ---------------------------------------------------------------------------
# Report Assembly
#
# report_id is generated here (not inside create_pdf) so the SAME id can
# be used as: the PDF filename, the value stored in history_service, and
# the id used for GET /report/{report_id} lookups. No keys are renamed or
# restructured beyond adding report_id.
# ---------------------------------------------------------------------------
def generate_report(result, patient):

    report = {
        "report_id": _generate_report_id(),

        "generated_on": datetime.now().strftime("%d-%m-%Y %H:%M"),

        "patient": patient,

        "risk_score": result["risk_score"],
        "risk_level": result["risk_level"],

        "recommendation": result["recommendation"],

        "inheritance": result["inheritance"],

        "counselling": result["counselling"]
    }

    return report


# ---------------------------------------------------------------------------
# PDF Builder — same layout as before for validated CRISPR tiers. For
# THEORETICAL_CANDIDATE / NO_KNOWN_STRATEGY tiers, the CRISPR section now
# shows gene + evidence tier + explanation + data source instead of a
# table full of "N/A" rows for fields that were never fabricated in the
# first place. This mirrors CrisprEvidenceNotice.tsx on the frontend, so
# the PDF and the UI can never disagree about what a theoretical
# recommendation looks like.
# ---------------------------------------------------------------------------
def create_pdf(report):

    reports_dir = Path("reports")
    reports_dir.mkdir(exist_ok=True)

    report_id = report["report_id"]
    pdf_path = reports_dir / f"{report_id}.pdf"

    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=A4,
        topMargin=34 * mm,
        bottomMargin=24 * mm,
        leftMargin=15 * mm,
        rightMargin=15 * mm,
        title="PreGene-AI Genetic Analysis Report",
    )

    story = []

    patient = report["patient"]
    recommendation = report["recommendation"]
    inheritance_probability = report["inheritance"]

    # -------------------- Report Meta Line --------------------
    meta_table = Table(
        [[
            Paragraph(f"<b>Report ID:</b> {report_id}", STYLES["SubText"]),
            Paragraph(f"<b>Generated:</b> {report['generated_on']}", STYLES["SubText"]),
        ]],
        colWidths=[90 * mm, 90 * mm],
    )
    meta_table.setStyle(TableStyle([
        ("ALIGN", (0, 0), (0, 0), "LEFT"),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(meta_table)
    story.append(HRFlowable(width="100%", thickness=0.75, color=BORDER_GREY, spaceAfter=10))

    # -------------------- Patient Summary --------------------
    story.append(Paragraph("Patient Summary", STYLES["SectionHeading"]))
    patient_rows = [
        [_p("Disease", "CellLabel"), _p(patient["disease"])],
        [_p("Inheritance Pattern", "CellLabel"), _p(patient["inheritance"])],
        [_p("Father Genotype", "CellLabel"), _p(patient["father_genotype"])],
        [_p("Mother Genotype", "CellLabel"), _p(patient["mother_genotype"])],
        [_p("Family History", "CellLabel"), _p(patient["family_history"])],
        [_p("Consanguinity", "CellLabel"), _p(patient["consanguinity"])],
    ]
    story.append(_section_table(patient_rows, col_widths=[55 * mm, 125 * mm]))
    story.append(Spacer(1, 10))

    # -------------------- Risk Assessment --------------------
    story.append(Paragraph("Risk Assessment", STYLES["SectionHeading"]))
    risk_score = report["risk_score"]
    risk_level = report["risk_level"]

    risk_level_style = ParagraphStyle(
        "RiskLevelValue",
        parent=STYLES["CellText"],
        textColor=_risk_color(risk_level),
        fontName="Helvetica-Bold",
    )

    risk_rows = [
        [_p("Risk Score", "CellLabel"), _p(risk_score)],
        [_p("Risk Level", "CellLabel"), Paragraph(str(risk_level), risk_level_style)],
    ]
    story.append(_section_table(risk_rows, col_widths=[55 * mm, 125 * mm]))
    story.append(Spacer(1, 10))

    # -------------------- CRISPR Recommendation --------------------
    story.append(Paragraph("CRISPR Recommendation", STYLES["SectionHeading"]))

    is_validated = tier_has_validated_details(recommendation.get("evidence_tier"))

    if is_validated:
        success_rate = recommendation["success_rate"]
        success_rate_display = f"{success_rate}%" if success_rate not in (None, "") else "N/A"

        recommendation_rows = [
            [_p("Disease Category", "CellLabel"), _p(recommendation["disease_category"])],
            [_p("Evidence Tier", "CellLabel"), _p(recommendation.get("evidence"))],
            [_p("Gene", "CellLabel"), _p(recommendation["gene"])],
            [_p("Mutation", "CellLabel"), _p(recommendation["mutation"])],
            [_p("Editing Method", "CellLabel"), _p(recommendation["editing_method"])],
            [_p("Clinical Status", "CellLabel"), _p(recommendation["clinical_status"])],
            [_p("Confidence", "CellLabel"), _p(recommendation["confidence"])],
            [_p("Success Rate", "CellLabel"), _p(success_rate_display)],
        ]
        story.append(_section_table(recommendation_rows, col_widths=[55 * mm, 125 * mm]))
    else:
        # Theoretical candidate or no known strategy: show only what's
        # real. No mutation, editing method, or success rate rows — those
        # would render as fabricated-looking "N/A" fields for a case where
        # they were never meant to exist.
        summary_rows = [
            [_p("Evidence Tier", "CellLabel"), _p(recommendation.get("evidence"))],
            [_p("Associated Gene(s)", "CellLabel"), _p(recommendation.get("gene"))],
            [
                _p("Data Source", "CellLabel"),
                _p(
                    ", ".join(recommendation["sources"])
                    if recommendation.get("sources")
                    else "Project disease-gene library"
                ),
            ],
        ]
        story.append(_section_table(summary_rows, col_widths=[55 * mm, 125 * mm]))
        story.append(Spacer(1, 8))

        explanation_text = (
            recommendation.get("explanation")
            or recommendation.get("message")
            or "CRISPR recommendation is currently unavailable for this disease."
        )
        story.append(_notice_box(explanation_text))

    story.append(Spacer(1, 10))

    # -------------------- Inheritance Probability --------------------
    story.append(Paragraph("Inheritance Probability", STYLES["SectionHeading"]))
    prob_header = ["Healthy", "Carrier", "Affected"]
    prob_row = [
        _p(inheritance_probability["Healthy"]),
        _p(inheritance_probability["Carrier"]),
        _p(inheritance_probability["Affected"]),
    ]
    story.append(_grid_table(prob_header, [prob_row], col_widths=[60 * mm, 60 * mm, 60 * mm]))
    story.append(Spacer(1, 10))

    # -------------------- AI Genetic Counselling --------------------
    story.append(Paragraph("AI Genetic Counselling", STYLES["SectionHeading"]))
    counselling = report["counselling"]

    if counselling:
        bullet_items = [
            ListItem(Paragraph(str(item), STYLES["BulletText"]), bulletColor=SECONDARY_BLUE)
            for item in counselling
        ]
        story.append(ListFlowable(
            bullet_items,
            bulletType="bullet",
            start="circle",
            leftIndent=14,
            bulletFontSize=6,
        ))
    else:
        story.append(Paragraph("No counselling information available.", STYLES["CellText"]))
    story.append(Spacer(1, 10))

    # -------------------- AI Reasoning --------------------
    # Only rendered for validated tiers — for theoretical/no-strategy
    # results, ai_reasoning duplicates the explanation already shown in
    # the CRISPR Recommendation section above, and would otherwise print
    # the literal word "None" for NO_KNOWN_STRATEGY (bug fixed here by
    # both skipping the section AND using _p() instead of raw str()).
    if is_validated:
        story.append(Paragraph("AI Reasoning", STYLES["SectionHeading"]))
        story.append(Paragraph(_p(recommendation.get("ai_reasoning")).text, STYLES["BodyJustify"]))
        story.append(Spacer(1, 10))

    # -------------------- Reference --------------------
    if is_validated:
        story.append(Paragraph("Reference", STYLES["SectionHeading"]))
        story.append(_p(recommendation.get("reference"), "CellText"))
        story.append(Spacer(1, 6))

    # -------------------- Disclaimer --------------------
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_GREY, spaceBefore=8, spaceAfter=6))
    story.append(Paragraph(
        "Disclaimer: This report is generated using an AI-based predictive model developed as part of an "
        "academic project. It is not a certified clinical diagnostic tool and must not be used as a "
        "substitute for professional medical or genetic counselling advice.",
        STYLES["SubText"],
    ))

    doc.build(
        story,
        onFirstPage=_make_page_callback(report_id),
        onLaterPages=_make_page_callback(report_id),
    )

    return str(pdf_path)