# CLAUDE HANDOFF

## Project
PreGene-AI

AI-powered genetic disease risk assessment and CRISPR recommendation platform.

---

# Current Development Phase

Frontend Redesign & Implementation

Backend architecture is considered stable.

Current focus is improving the frontend while preserving backend logic.

---

# Overall Progress

Backend
- Dataset Loader ✅
- FastAPI APIs ✅
- Disease Search ✅
- Risk Prediction ✅
- CRISPR Recommendation ✅
- Inheritance Probability ✅
- AI Counselling ✅
- PDF Generation ✅

Frontend
- Login ✅
- Dashboard ✅
- Disease Prediction Page ✅ (Reference Design)
- Home Page 🟡 In Progress
- Disease Explorer ⬜ Pending
- Disease Details ⬜ Pending
- Reports ⬜ Pending
- Research ⬜ Pending

---

# Current Design Reference

DiseasePredictionPage.tsx

This page is the official UI reference for:

- Typography
- Card design
- Spacing
- Color palette
- Clinical styling
- Healthcare visual language

New pages should match this design language.

---

# Current Task

Implement the Home Page.

Sections:

- Hero
- Stats Banner
- Capabilities
- Process
- Testimonials

---

# Approved Decisions

- Backend will NOT be modified.
- APIs will NOT be modified.
- Prediction logic will NOT be modified.
- DiseaseAnalysisCard remains unchanged.
- RiskMeter remains unchanged.
- GeneCard remains unchanged.
- Reuse components whenever possible.
- One page per implementation session.

---

# Navigation Flow

Home

↓

Disease Explorer

↓

Disease Details

↓

Risk Assessment

↓

Results

↓

Download PDF

---

# Rules

DO

- Keep code modular.
- Reuse existing components.
- Match DiseasePredictionPage styling.
- Preserve API compatibility.
- Preserve backend behavior.

DO NOT

- Change backend logic.
- Change API responses.
- Rename routes.
- Duplicate components.
- Rewrite working prediction logic.

---

# Pending After Home

1. Disease Explorer
2. Disease Details
3. Reports
4. Research
5. Final UI Polish
6. Integration Testing
7. Presentation Preparation

---

# Notes For Next AI Session

Assume backend is complete.

Focus only on frontend implementation.

Avoid unnecessary refactoring.

Implement one page at a time.

Maintain a premium healthcare appearance.

When requesting files, request only those necessary for the current page.