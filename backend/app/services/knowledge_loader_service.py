"""
knowledge_loader_service.py

Document loader + chunking pipeline for the medical knowledge base that
backs the RAG chatbot. Reads every supported file under
backend/app/knowledge/<category>/ and turns it into a list of text
chunks, each carrying enough metadata (category, source document, page
number where applicable) to power the citation engine later.

Supported formats: .pdf, .txt, .csv, .md
Categories (folder names under app/knowledge/):
  - genetic_diseases
  - genes
  - mutations
  - chromosomes
  - crispr
  - nih_references
  - who_references
  - research_papers
  - clinical_guidelines

This module only loads and chunks documents — it does not do any
embedding/indexing itself. rag_service.py (or a future retriever module)
is responsible for turning these chunks into a searchable index.
"""

from __future__ import annotations

import csv
import os
from dataclasses import dataclass, field
from pathlib import Path

from pypdf import PdfReader

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
KNOWLEDGE_DIR = Path(BASE_DIR) / "app" / "knowledge"

CATEGORIES = [
    "genetic_diseases",
    "genes",
    "mutations",
    "chromosomes",
    "crispr",
    "nih_references",
    "who_references",
    "research_papers",
    "clinical_guidelines",
]

SUPPORTED_EXTENSIONS = {".pdf", ".txt", ".csv", ".md"}

# Chunking defaults — configurable per call, these are sane starting
# points for short-to-medium medical reference passages.
DEFAULT_CHUNK_SIZE = 800       # characters per chunk
DEFAULT_CHUNK_OVERLAP = 150    # characters of overlap between chunks


@dataclass
class DocumentChunk:
    text: str
    category: str
    source_document: str
    page: int | None = None
    extra: dict = field(default_factory=dict)


def ensure_knowledge_folders() -> None:
    """
    Creates the standard category folders under app/knowledge/ if they
    don't already exist. Safe to call repeatedly — does nothing to
    folders/files that already exist.
    """
    for category in CATEGORIES:
        (KNOWLEDGE_DIR / category).mkdir(parents=True, exist_ok=True)


def _recursive_split(text: str, chunk_size: int, chunk_overlap: int) -> list[str]:
    """
    A dependency-free recursive-ish text splitter: tries to break on
    paragraph boundaries first, then sentence boundaries, then falls
    back to a hard character cut — always respecting chunk_size, and
    carrying chunk_overlap characters forward into the next chunk so
    context isn't lost at chunk boundaries.
    """
    text = text.strip()
    if not text:
        return []

    if len(text) <= chunk_size:
        return [text]

    separators = ["\n\n", "\n", ". ", " "]

    def split_on(piece: str, seps: list[str]) -> list[str]:
        if not seps:
            # Hard fallback: cut at chunk_size regardless of word boundaries
            return [piece[i:i + chunk_size] for i in range(0, len(piece), chunk_size)]

        sep = seps[0]
        parts = piece.split(sep)
        if len(parts) == 1:
            # This separator didn't split anything — try the next one
            return split_on(piece, seps[1:])

        chunks: list[str] = []
        current = ""
        for part in parts:
            candidate = (current + sep + part) if current else part
            if len(candidate) <= chunk_size:
                current = candidate
            else:
                if current:
                    chunks.append(current)
                if len(part) > chunk_size:
                    chunks.extend(split_on(part, seps[1:]))
                    current = ""
                else:
                    current = part
        if current:
            chunks.append(current)
        return chunks

    raw_chunks = split_on(text, separators)

    # Apply overlap: prepend the tail of the previous chunk to the next one
    if chunk_overlap <= 0 or len(raw_chunks) <= 1:
        return raw_chunks

    overlapped = [raw_chunks[0]]
    for i in range(1, len(raw_chunks)):
        prev_tail = raw_chunks[i - 1][-chunk_overlap:]
        overlapped.append((prev_tail + " " + raw_chunks[i]).strip())
    return overlapped


def _load_txt_or_md(path: Path) -> str:
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()


def _load_csv(path: Path) -> str:
    """
    Flattens a CSV into readable text — one line per row, columns joined
    as "Header: value" pairs — so the chunker/retriever can treat it like
    any other text source instead of needing separate tabular handling.
    """
    lines: list[str] = []
    with open(path, "r", encoding="utf-8", errors="ignore", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            line = "; ".join(f"{key}: {value}" for key, value in row.items() if value)
            if line:
                lines.append(line)
    return "\n".join(lines)


def _load_pdf_pages(path: Path) -> list[tuple[int, str]]:
    """
    Returns [(page_number, page_text), ...], 1-indexed, so page numbers
    can be preserved all the way through to the citation engine.
    """
    pages: list[tuple[int, str]] = []
    try:
        reader = PdfReader(str(path))
        for i, page in enumerate(reader.pages, start=1):
            text = page.extract_text() or ""
            if text.strip():
                pages.append((i, text))
    except Exception as exc:
        # A single corrupt/unreadable PDF shouldn't take down the whole
        # knowledge base load — skip it and let the rest load normally.
        print(f"[knowledge_loader] Failed to read PDF {path.name}: {exc}")
    return pages


def load_category(
    category: str,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> list[DocumentChunk]:
    """
    Loads and chunks every supported file inside a single category
    folder (app/knowledge/<category>/). Returns an empty list if the
    folder doesn't exist or has no supported files yet — this is
    expected while the knowledge base is still being populated.
    """
    folder = KNOWLEDGE_DIR / category
    if not folder.exists():
        return []

    chunks: list[DocumentChunk] = []

    for path in sorted(folder.iterdir()):
        if not path.is_file() or path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            continue

        extension = path.suffix.lower()

        if extension == ".pdf":
            for page_number, page_text in _load_pdf_pages(path):
                for chunk_text in _recursive_split(page_text, chunk_size, chunk_overlap):
                    chunks.append(
                        DocumentChunk(
                            text=chunk_text,
                            category=category,
                            source_document=path.name,
                            page=page_number,
                        )
                    )
        else:
            if extension == ".csv":
                raw_text = _load_csv(path)
            else:  # .txt or .md
                raw_text = _load_txt_or_md(path)

            for chunk_text in _recursive_split(raw_text, chunk_size, chunk_overlap):
                chunks.append(
                    DocumentChunk(
                        text=chunk_text,
                        category=category,
                        source_document=path.name,
                        page=None,
                    )
                )

    return chunks


def load_all_categories(
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> list[DocumentChunk]:
    """
    Loads and chunks every file across every category folder. This is
    the main entry point the embedding/indexing step (rag_service.py or
    a future retriever module) should call to rebuild the knowledge base.
    """
    ensure_knowledge_folders()

    all_chunks: list[DocumentChunk] = []
    for category in CATEGORIES:
        all_chunks.extend(load_category(category, chunk_size, chunk_overlap))

    return all_chunks
