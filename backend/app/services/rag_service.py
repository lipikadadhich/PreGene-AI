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
        return  # already loaded, nothing to do

    print("Loading RAG index and embedding model (lazy, first use)...")

    # Import here, not at module level — sentence_transformers itself
    # pulls in torch and other heavy dependencies, so delaying the
    # import delays that memory cost too, not just the model weights.
    from sentence_transformers import SentenceTransformer

    with open(os.path.join(INDEX_DIR, "config.json")) as f:
        config = json.load(f)

    _embedding_model = SentenceTransformer(config["embedding_model"])
    _index = faiss.read_index(os.path.join(INDEX_DIR, "knowledge.index"))

    with open(os.path.join(INDEX_DIR, "passages.json"), encoding="utf-8") as f:
        _passages = json.load(f)

    with open(os.path.join(INDEX_DIR, "sources.json"), encoding="utf-8") as f:
        _sources = json.load(f)

    print(f"RAG index loaded: {_index.ntotal} passages ready for retrieval.")


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
    Hybrid RAG + LLM pipeline, following this priority order:
      1. Retrieve relevant passages from the project's knowledge base.
      2. If retrieval is relevant, ground the answer in it and say so.
      3. If retrieval is insufficient, fall back to the LLM's own
         general medical/genetics knowledge — and say so explicitly.
      4. Never hallucinate: if confidence is genuinely low even with
         general knowledge, the model is instructed to state that
         limitation rather than invent an answer.
      5. Answer naturally, like a knowledgeable conversational
         assistant — not a rigid retrieval-only bot.

    Supports genetic diseases, genes, mutations, inheritance patterns,
    CRISPR, DNA/FASTA/VCF-related questions, general genetics topics,
    and ordinary conversational follow-ups.
    """
    retrieved = retrieve(question)

    # Only treat retrieved passages as usable grounding if they're
    # actually relevant — FAISS always returns *something*, even for
    # unrelated questions, so a similarity floor prevents irrelevant
    # passages from being presented as if they were the source.
    RELEVANCE_THRESHOLD = 0.35
    relevant = [r for r in retrieved if r["similarity"] >= RELEVANCE_THRESHOLD]

    base_persona = (
        "You are the PreGene-AI clinical assistant — a knowledgeable, "
        "conversational genetics and genomics expert, similar in tone to "
        "a helpful AI assistant like ChatGPT, but medically responsible. "
        "You help with genetic diseases, genes, mutations, inheritance "
        "patterns, CRISPR strategies, DNA/FASTA/VCF-related questions, "
        "general genetics topics, and ordinary conversational "
        "follow-ups — not just questions matching a fixed document set."
    )

    honesty_rules = (
        "Follow this priority order strictly:\n"
        "1. If the reference passages below are relevant to the "
        "question, use them as your primary source and say so plainly "
        "(e.g. 'Based on our knowledge base...'), citing which passage "
        "number(s) you used, like [1] or [2][3].\n"
        "2. If the reference passages are missing, irrelevant, or only "
        "partially answer the question, use your own general medical/"
        "genetics knowledge to fill the gap — and say so plainly (e.g. "
        "'This isn't in our knowledge base, but based on general "
        "genetics knowledge...') so the person always knows which parts "
        "came from the project's data versus your general training.\n"
        "3. NEVER present something as verified/sourced when it wasn't. "
        "If you're genuinely uncertain even drawing on general "
        "knowledge, say so explicitly rather than guessing confidently "
        "— e.g. 'I'm not fully certain about this specific detail; you "
        "should verify with a clinical genetics reference or "
        "professional.'\n"
        "4. Keep the tone natural, warm, and conversational — like "
        "talking to a knowledgeable colleague, not a rigid document "
        "lookup tool."
    )

    if relevant:
        context = "\n\n".join(
            f"[{i+1}] {r['passage']}" for i, r in enumerate(relevant)
        )
        system_prompt = f"{base_persona}\n\n{honesty_rules}"
        user_prompt = f"Reference passages from our knowledge base:\n{context}\n\nQuestion: {question}"
    else:
        system_prompt = (
            f"{base_persona}\n\n{honesty_rules}\n\n"
            "No relevant passages were found in the knowledge base for "
            "this question — answer using your own general medical/"
            "genetics knowledge, and say so plainly per rule 2 above."
        )
        user_prompt = question

    client = _get_groq_client()
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.4,
        max_tokens=700,
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