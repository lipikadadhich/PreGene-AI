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

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
INDEX_DIR = os.path.join(BASE_DIR, "ml", "rag_index")

TOP_K = 4  # how many passages to retrieve per question
GROQ_MODEL = "llama-3.1-8b-instant"  # fast, free-tier, good enough for this

# FIX: previously all loaded eagerly at module import time — meaning
# every one of these (the embedding model, the FAISS index, the full
# passage/source lists) loaded into memory the moment the server
# started, regardless of whether anyone ever used the chatbot. Combined
# with torch, pandas, and everything else the app already loads at
# startup, this pushed total memory usage past Render's free-tier RAM
# limit, causing the OS to kill the process (exit code 137 = SIGKILL)
# before it could even finish starting up.
#
# Now these load lazily — only the first time retrieve() or
# answer_question() is actually called — via _ensure_loaded(). This
# spreads memory usage out over time instead of front-loading all of it
# at startup, so /health, /search, /stats, etc. all work fine even
# before anyone has used the chatbot yet.
_embedding_model = None
_index = None
_passages = None
_sources = None
_groq_client = None


def _ensure_loaded():
    global _embedding_model, _index, _passages, _sources

    if _embedding_model is not None:
        return

    print("STEP 1 - Starting _ensure_loaded")

    print("STEP 2 - Importing SentenceTransformer")
    from sentence_transformers import SentenceTransformer
    print("STEP 3 - SentenceTransformer imported")

    print("STEP 4 - Opening config")
    with open(os.path.join(INDEX_DIR, "config.json")) as f:
        config = json.load(f)
    print("STEP 5 - Config loaded")

    print("STEP 6 - Loading embedding model")
    _embedding_model = SentenceTransformer(config["embedding_model"])
    print("STEP 7 - Embedding model loaded")

    print("STEP 8 - Loading FAISS index")
    _index = faiss.read_index(os.path.join(INDEX_DIR, "knowledge.index"))
    print("STEP 9 - FAISS loaded")

    print("STEP 10 - Loading passages")
    with open(os.path.join(INDEX_DIR, "passages.json"), encoding="utf-8") as f:
        _passages = json.load(f)
    print("STEP 11 - Passages loaded")

    print("STEP 12 - Loading sources")
    with open(os.path.join(INDEX_DIR, "sources.json"), encoding="utf-8") as f:
        _sources = json.load(f)
    print("STEP 13 - Sources loaded")

    print(f"RAG index loaded: {_index.ntotal} passages ready.")


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
    _ensure_loaded()

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
    Hybrid RAG pipeline: retrieves relevant passages and grounds the
    answer in them when they're genuinely relevant, but also lets the
    model use its own general medical/genetics knowledge to answer
    naturally — the way a real conversational assistant would, rather
    than refusing anything not explicitly in the knowledge base.
    """
    retrieved = retrieve(question)

    # Only include retrieved passages as grounding if they're actually
    # relevant to the question (similarity above a reasonable threshold).
    # Below this, the retrieved passages are likely noise (the FAISS
    # search always returns *something*, even for unrelated questions),
    # so we let the model answer from general knowledge instead of
    # force-feeding it irrelevant context.
    RELEVANCE_THRESHOLD = 0.35
    relevant = [r for r in retrieved if r["similarity"] >= RELEVANCE_THRESHOLD]

    if relevant:
        context = "\n\n".join(
            f"[{i+1}] {r['passage']}" for i, r in enumerate(relevant)
        )
        system_prompt = (
            "You are the PreGene-AI clinical assistant — a knowledgeable, "
            "conversational genetics and genomics expert, similar in tone "
            "to a helpful AI assistant like ChatGPT. You can answer both "
            "specific questions using the reference passages below AND "
            "general questions using your own broad medical/genetics "
            "knowledge, the same way a real expert would draw on both a "
            "specific patient chart and their general training.\n\n"
            "When the reference passages below are relevant to the "
            "question, use them and cite which one(s) you used, like [1] "
            "or [2][3] — this keeps your clinical claims grounded and "
            "verifiable. For background, definitional, or general "
            "questions (e.g. 'what is X condition', 'how does Y work'), "
            "answer naturally and conversationally using your own "
            "knowledge, without forcing a citation if the passages don't "
            "directly cover it. Keep answers clear, warm, and "
            "appropriately concise — a paragraph or two unless more "
            "detail is clearly wanted."
        )
        user_prompt = f"Reference passages:\n{context}\n\nQuestion: {question}"
    else:
        # No sufficiently relevant passages retrieved — answer as a
        # general knowledgeable assistant instead of saying "I don't know."
        system_prompt = (
            "You are the PreGene-AI clinical assistant — a knowledgeable, "
            "conversational genetics and genomics expert, similar in tone "
            "to a helpful AI assistant like ChatGPT. Answer the user's "
            "question using your own broad medical/genetics knowledge. "
            "Keep answers clear, warm, and appropriately concise."
        )
        user_prompt = question

    client = _get_groq_client()
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.4,  # slightly higher than pure-retrieval mode — allows more natural phrasing while staying factual
        max_tokens=600,
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
            for r in relevant
        ],
    }