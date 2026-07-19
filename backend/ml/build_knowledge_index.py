"""
build_knowledge_index.py

Builds the retrieval index for the RAG chatbot. Converts each row of
pregene_knowledge_base.csv (rich CRISPR/clinical detail, 10 diseases) and
pregene_master_dataset.csv (broad coverage, 2,400+ diseases) into a
natural-language passage, embeds all passages with a sentence-transformer
model, and saves a FAISS index + the passage/source metadata to disk.

At query time (see rag_service.py), a user's question is embedded with the
same model, the FAISS index returns the top-k most similar passages, and
those passages are passed to an LLM as grounding context — this is the
"retrieval" half of Retrieval-Augmented Generation.

Run from backend/:
    python ml/build_knowledge_index.py
"""

import json
import os

import faiss
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KB_PATH = os.path.join(BASE_DIR, "datasets", "pregene_knowledge_base.csv")
MASTER_PATH = os.path.join(BASE_DIR, "datasets", "pregene_master_dataset.csv")
INDEX_DIR = os.path.join(BASE_DIR, "ml", "rag_index")
os.makedirs(INDEX_DIR, exist_ok=True)

EMBEDDING_MODEL = "all-MiniLM-L6-v2"  # small, free, runs locally, no API needed


def row_to_passage_knowledge_base(row: pd.Series) -> str:
    """
    Turns one pregene_knowledge_base.csv row into a readable passage.
    Richer detail available here (CRISPR method, clinical status,
    success rate, AI reasoning) — this is the higher-quality source.
    """
    return (
        f"{row['Disease']} is caused by mutations in the {row['Gene']} gene "
        f"({row['Gene_Name']}). It follows {row['Inheritance_Type']} "
        f"inheritance, typically has {row['Age_Of_Onset']} onset, and is "
        f"classified as {row['Mutation_Severity']} severity "
        f"({row['Mutation_Type']}: {row['Mutation_Effect']}). "
        f"The recommended CRISPR strategy is {row['CRISPR_Method']}, "
        f"targeting {row['Target_Cell']}, currently at "
        f"{row['Clinical_Status']} status with {row['Evidence_Level']} "
        f"evidence and an estimated {row['Success_Rate']}% success rate. "
        f"{row['AI_Reasoning']} (Sources: {row['Reference']})"
    )


def row_to_passage_master(row: pd.Series) -> str:
    """
    Turns one pregene_master_dataset.csv row into a readable passage.
    Less detail than the knowledge base, but covers many more diseases —
    fills in retrieval coverage for anything not in the curated set above.
    """
    return (
        f"{row['Disease']} is associated with the {row['Gene']} gene "
        f"({row.get('Gene_Name', 'unknown gene name')}). "
        f"It follows {row.get('Inheritance_Type', 'an unspecified')} "
        f"inheritance pattern, typically presenting at "
        f"{row.get('Age_Of_Onset', 'an unspecified')} age of onset."
    )


print("Loading datasets...")
kb_df = pd.read_csv(KB_PATH)
master_df = pd.read_csv(MASTER_PATH)
print(f"Knowledge base: {len(kb_df)} rows | Master dataset: {len(master_df)} rows")

passages = []
sources = []

for _, row in kb_df.iterrows():
    passages.append(row_to_passage_knowledge_base(row))
    sources.append({"disease": row["Disease"], "source": "knowledge_base"})

for _, row in master_df.iterrows():
    passages.append(row_to_passage_master(row))
    sources.append({"disease": row["Disease"], "source": "master_dataset"})

print(f"Total passages to embed: {len(passages)}")

print(f"Loading embedding model ({EMBEDDING_MODEL})... this may take a moment on first run.")
model = SentenceTransformer(EMBEDDING_MODEL)

print("Embedding passages...")
embeddings = model.encode(passages, show_progress_bar=True, convert_to_numpy=True)
embeddings = embeddings.astype("float32")

# Normalize so we can use inner-product search as cosine similarity
faiss.normalize_L2(embeddings)

dimension = embeddings.shape[1]
index = faiss.IndexFlatIP(dimension)  # inner product = cosine similarity, since normalized
index.add(embeddings)

print(f"Built FAISS index: {index.ntotal} vectors, dimension {dimension}")

faiss.write_index(index, os.path.join(INDEX_DIR, "knowledge.index"))

with open(os.path.join(INDEX_DIR, "passages.json"), "w", encoding="utf-8") as f:
    json.dump(passages, f, indent=2)

with open(os.path.join(INDEX_DIR, "sources.json"), "w", encoding="utf-8") as f:
    json.dump(sources, f, indent=2)

with open(os.path.join(INDEX_DIR, "config.json"), "w") as f:
    json.dump({"embedding_model": EMBEDDING_MODEL, "dimension": dimension}, f, indent=2)

print("\nDone. Index saved to:", INDEX_DIR)