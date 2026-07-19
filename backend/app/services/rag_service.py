"""
rag_service.py

The generation half of the RAG (Retrieval-Augmented Generation) pipeline.
Given a user's question:
  1. Embed the question with the same sentence-transformer model used to
     build the index (see build_knowledge_index.py)
  2. Retrieve the top-k most similar passages from the FAISS index
  3. Pass those passages to Groq's free-tier LLM as grounding context,
     instructed to answer only from that context
  4. Return the answer along with which sources were actually used —
     this transparency (showing retrieval, not just a black-box answer)
     is what makes this a genuine RAG system rather than "I called an API."

Requires GROQ_API_KEY to be set as an environment variable (never
hardcoded). Get a free key at https://console.groq.com
"""

import json
import os

import faiss
import numpy as np
from groq import Groq
from sentence_transformers import SentenceTransformer

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
INDEX_DIR = os.path.join(BASE_DIR, "ml", "rag_index")

TOP_K = 4  # how many passages to retrieve per question
GROQ_MODEL = "llama-3.1-8b-instant"  # fast, free-tier, good enough for this

# Loaded once at import time — same pattern as risk_predictor.py, avoids
# reloading the embedding model / index on every request.
print("Loading RAG index and embedding model...")

with open(os.path.join(INDEX_DIR, "config.json")) as f:
    _config = json.load(f)

_embedding_model = SentenceTransformer(_config["embedding_model"])
_index = faiss.read_index(os.path.join(INDEX_DIR, "knowledge.index"))

with open(os.path.join(INDEX_DIR, "passages.json"), encoding="utf-8") as f:
    _passages = json.load(f)

with open(os.path.join(INDEX_DIR, "sources.json"), encoding="utf-8") as f:
    _sources = json.load(f)

print(f"RAG index loaded: {_index.ntotal} passages ready for retrieval.")

_groq_client = None


def _get_groq_client() -> Groq:
    global _groq_client
    if _groq_client is None:
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError(
                "GROQ_API_KEY environment variable is not set. "
                "Get a free key at https://console.groq.com and set it "
                "in your environment (locally) or Render's dashboard "
                "(in production)."
            )
        _groq_client = Groq(api_key=api_key)
    return _groq_client


def retrieve(question: str, top_k: int = TOP_K):
    """
    Embeds the question and returns the top_k most similar passages,
    along with their source metadata and similarity scores.
    """
    query_embedding = _embedding_model.encode([question], convert_to_numpy=True)
    query_embedding = query_embedding.astype("float32")
    faiss.normalize_L2(query_embedding)

    scores, indices = _index.search(query_embedding, top_k)

    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx == -1:
            continue
        results.append(
            {
                "passage": _passages[idx],
                "disease": _sources[idx]["disease"],
                "source": _sources[idx]["source"],
                "similarity": float(score),
            }
        )
    return results


def answer_question(question: str) -> dict:
    """
    Full RAG pipeline: retrieve relevant passages, then generate an
    answer grounded in them. Returns the answer plus the sources used,
    so the frontend can show "this answer was based on: ..." for
    transparency.
    """
    retrieved = retrieve(question)

    if not retrieved:
        return {
            "answer": "I couldn't find anything relevant in the knowledge base to answer that.",
            "sources": [],
        }

    context = "\n\n".join(
        f"[{i+1}] {r['passage']}" for i, r in enumerate(retrieved)
    )

    system_prompt = (
        "You are a clinical genetics assistant for PreGene-AI. Answer the "
        "user's question using ONLY the numbered context passages provided "
        "below. If the context doesn't contain enough information to "
        "answer confidently, say so clearly rather than guessing. Keep "
        "answers concise and clinically appropriate. Cite which numbered "
        "passage(s) you used, like [1] or [2][3]."
    )

    user_prompt = f"Context:\n{context}\n\nQuestion: {question}"

    client = _get_groq_client()
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.2,  # low temperature — this is clinical info, not creative writing
        max_tokens=500,
    )

    answer = response.choices[0].message.content

    return {
        "answer": answer,
        "sources": [
            {
                "disease": r["disease"],
                "source": r["source"],
                "similarity": round(r["similarity"], 3),
            }
            for r in retrieved
        ],
    }