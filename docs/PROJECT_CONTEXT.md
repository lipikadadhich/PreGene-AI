# PreGene-AI
### AI-Powered Genetic Disease Risk Assessment and CRISPR Recommendation Platform

---

# 1. Project Overview

PreGene-AI is an AI-powered healthcare platform designed to assist in the early assessment of inherited genetic disorders.

The application allows users to search a disease, analyze genetic risk, understand inheritance probability, receive AI-assisted CRISPR recommendations, obtain counselling suggestions, and generate a professional PDF report.

This project is intended as a research-driven healthcare application demonstrating how Artificial Intelligence can support precision medicine and genetic counselling.

---

# 2. Problem Statement

Millions of inherited diseases remain undetected until symptoms appear.

Families often lack:

- Early genetic risk estimation
- Easy-to-understand inheritance probability
- Accessible genetic counselling
- AI-assisted CRISPR treatment information
- Centralized disease information

Current healthcare systems generally separate these resources.

PreGene-AI combines them into one platform.

---

# 3. Project Objectives

The primary objectives are:

- Search genetic diseases
- Estimate genetic risk
- Predict inheritance probability
- Suggest CRISPR editing approaches
- Explain disease information
- Provide AI counselling
- Generate downloadable reports

---

# 4. Intended Users

- Patients
- Parents
- Researchers
- Medical Students
- Genetic Counsellors
- Healthcare Professionals

---

# 5. Project Scope

PreGene-AI is a research and educational prototype.

The platform demonstrates how AI can assist decision-making.

It does NOT replace professional medical advice.

Clinical decisions must always involve certified healthcare professionals.

---

# 6. Technology Stack

Frontend

- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Vite

Backend

- FastAPI
- Python

AI / ML

- Python
- NumPy
- Pandas
- Scikit-learn

Visualization

- Matplotlib

Report Generation

- ReportLab

Dataset

- Curated genetic disease dataset
- Orphadata references
- Kaggle-derived datasets

---

# 7. Overall Workflow

Home

↓

Disease Explorer

↓

Disease Details

↓

Risk Assessment

↓

AI Prediction

↓

CRISPR Recommendation

↓

Inheritance Probability

↓

AI Counselling

↓

PDF Report

---

# 8. Project Philosophy

PreGene-AI is designed to look and behave like a professional healthcare platform.

The interface should communicate:

- Trust
- Scientific credibility
- Clinical quality
- Simplicity
- Accessibility

The application should never resemble a generic SaaS dashboard or student management system.

---
---

# 9. Backend Architecture

The backend is developed using FastAPI and follows a modular architecture.

Main responsibilities include:

- Disease search
- Genetic risk prediction
- CRISPR recommendation
- Inheritance probability calculation
- AI counselling generation
- PDF report generation
- REST API communication with the frontend

Current backend modules:

- Dataset Loader
- Search Engine
- Prediction Engine
- Recommendation Engine
- Report Generator

---

# 10. Frontend Architecture

The frontend is developed using React, TypeScript, Tailwind CSS, and Framer Motion.

The application follows a component-based architecture.

Main sections include:

- Landing Page
- Disease Explorer
- Disease Details
- Risk Assessment
- Results
- Reports
- Research

The DiseasePredictionPage serves as the primary UI reference for typography, spacing, cards, and overall design language.

---

# 11. AI Pipeline

The AI workflow follows this sequence:

1. User searches for a genetic disease.
2. Disease information is retrieved from the dataset.
3. Family history and genetic parameters are collected.
4. Risk score is calculated.
5. Risk level is determined.
6. Inheritance probability is estimated.
7. CRISPR recommendation is generated.
8. AI counselling suggestions are prepared.
9. A structured report is generated.
10. A professional PDF report is created.

---

# 12. Dataset

The project uses a curated dataset containing genetic disease information.

Important fields include:

- Disease
- Gene
- Gene Name
- Mutation
- Inheritance Type
- Disease Category
- Clinical Status
- Evidence Level
- Success Rate
- CRISPR Editing Method
- References

Primary references include:

- Orphadata
- ClinVar
- GeneReviews
- Curated Kaggle datasets

---

# 13. Machine Learning Components

The project uses Machine Learning as a supporting decision system.

Current libraries include:

- NumPy
- Pandas
- Scikit-learn
- Matplotlib

These libraries support:

- Data preprocessing
- Risk score computation
- Statistical analysis
- Dataset handling
- Data visualization

Future versions may include TensorFlow models for predictive learning.

---

# 14. API Communication

Frontend communicates with FastAPI using REST APIs.

Major endpoints include:

- Disease Search
- Risk Prediction
- CRISPR Recommendation
- PDF Generation
- Health Check

The frontend should never directly manipulate prediction logic.

All calculations remain inside the backend.

---

# 15. Folder Structure

Project follows a modular structure.

Frontend

- components
- pages
- sections
- services
- hooks
- context
- data
- layouts

Backend

- app
- ai
- datasets
- reports
- uploads
- trained_models

Documentation

- docs

---

# 16. Design Philosophy

The application should always feel like a premium healthcare platform.

Design principles:

- Minimal
- Clinical
- Clean
- Trustworthy
- Professional
- Spacious
- Accessible

Avoid:

- Dashboard clutter
- Bright gradients
- Neon colors
- Gaming-style UI
- Consumer AI aesthetics

---

# 17. Coding Rules

Development rules:

- Reuse components whenever possible.
- Keep backend and frontend separated.
- Never duplicate business logic.
- Keep APIs stable.
- Build one page at a time.
- Review each implementation before merging.

---

# 18. Things Never To Modify Without Approval

- Prediction algorithms
- Backend API response format
- Dataset schema
- Risk calculation logic
- CRISPR recommendation logic
- PDF generation workflow

These components are considered stable unless a planned upgrade is approved.

---

# 19. Current Project Status

Current development stage:

Backend: Nearly complete

Frontend: Active redesign

Navigation: Finalized

Architecture: Finalized

Home Page: In progress

Disease Prediction: Stable

Next priority:

1. Home Page
2. Disease Explorer
3. Disease Details
4. Reports
5. Research

---

# 20. Future Scope

Potential future enhancements:

- User authentication
- Cloud deployment
- Database integration
- Patient history
- Doctor dashboard
- Multi-language support
- AI chatbot
- Advanced ML models
- Clinical trial integration
- Electronic Health Record (EHR) integration

---

# End of Project Context