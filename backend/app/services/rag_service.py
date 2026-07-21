"""
rag_service.py

The generation half of the RAG (Retrieval-Augmented Generation) pipeline.
Given a user's question:
  1. Load and chunk every document under app/knowledge/ (via
     knowledge_loader_service.py) — PDF, TXT, CSV, and Markdown files
     across all 9 knowledge categories.
  2. Score the question against those chunks using TF-IDF + cosine
     similarity (scikit-learn) — a lightweight, dependency-cheap
     alternative to sentence-transformer embeddings.
  3. Retrieve the top-k most similar chunks.
  4. Pass those chunks to Groq's free-tier LLM as grounding context,
     instructed to answer only from that context.
  5. Return the answer along with which sources were actually used —
     category, source document, and page number where available.

MEMORY FIX: this previously used sentence-transformers + torch + FAISS
to build dense embeddings from a static passages.json/sources.json
pair. That stack pulls in several hundred MB of RAM the moment it's
loaded, which reliably exceeded Render's 512MB free-tier limit and got
the whole process killed (OOM) the first time anyone opened the chat -
with no error response, just a dropped connection, which is what
looked like a CORS failure in the browser.

TF-IDF (scikit-learn) needs no GPU/tensor runtime, no pretrained model
download, and a few MB of RAM instead of hundreds. It's a purely
lexical (word-overlap) similarity measure rather than a semantic one,
which is a reasonable trade-off for a small, domain-specific knowledge
base, and can be swapped for dense embeddings later once the app is on
a tier with more memory headroom.

KNOWLEDGE BASE: chunks are now loaded live from app/knowledge/<category>/
via knowledge_loader_service.py, instead of a prebuilt static index -
so adding a new PDF/TXT/CSV/MD file to any category folder and
restarting the server (or calling reload_knowledge_base()) is enough to
make it retrievable, no separate index-build step required.

Requires GROQ_API_KEY to be set as an environment variable (never
hardcoded). Get a free key at https://console.groq.com
"""

from groq import Groq
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.services.knowledge_loader_service import load_all_categories, DocumentChunk

TOP_K = 4  # how many chunks to retrieve per question
GROQ_MODEL = "llama-3.1-8b-instant"  # fast, free-tier, good enough for this

# Everything below loads lazily, only on the first real chat request —
# not at server startup — so /health, /search, /stats, etc. all work
# immediately regardless of whether the chatbot has been used yet.
_vectorizer: TfidfVectorizer | None = None
_chunk_matrix = None  # scipy sparse matrix, one row per chunk
_chunks: list[DocumentChunk] | None = None
_groq_client = None


def _ensure_loaded():
    global _vectorizer, _chunk_matrix, _chunks

    if _vectorizer is not None:
        return  # already loaded, nothing to do

    print("Loading RAG knowledge base (lazy, first use)...")

    _chunks = load_all_categories()

    if not _chunks:
        print(
            "RAG knowledge base is empty (no files found under "
            "app/knowledge/<category>/). The chatbot will answer from "
            "general knowledge only until documents are added."
        )
        _vectorizer = TfidfVectorizer(stop_words="english")
        _chunk_matrix = _vectorizer.fit_transform([""])  # placeholder, never matches
        return

    texts = [chunk.text for chunk in _chunks]
    _vectorizer = TfidfVectorizer(stop_words="english")
    _chunk_matrix = _vectorizer.fit_transform(texts)

    print(f"RAG knowledge base loaded: {len(_chunks)} chunks ready.")


def reload_knowledge_base() -> int:
    """
    Forces a fresh reload of the knowledge base on the next retrieval -
    useful after adding new files to app/knowledge/ without restarting
    the whole server. Returns the number of chunks loaded.
    """
    global _vectorizer, _chunk_matrix, _chunks
    _vectorizer = None
    _chunk_matrix = None
    _chunks = None
    _ensure_loaded()
    return len(_chunks) if _chunks else 0


def _get_groq_client() -> Groq:
    global _groq_client
    if _groq_client is None:
        import os

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
    Scores the question against every knowledge-base chunk using TF-IDF
    + cosine similarity, and returns the top_k most similar chunks along
    with their citation metadata (category, source document, page) and
    similarity scores.
    """
    _ensure_loaded()

    if not _chunks:
        return []

    query_vector = _vectorizer.transform([question])
    similarities = cosine_similarity(query_vector, _chunk_matrix)[0]

    top_indices = similarities.argsort()[-top_k:][::-1]

    results = []
    for idx in top_indices:
        score = float(similarities[idx])
        if score <= 0:
            continue  # zero overlap - not a meaningful match, skip it
        chunk = _chunks[idx]
        results.append(
            {
                "passage": chunk.text,
                "category": chunk.category,
                "source_document": chunk.source_document,
                "page": chunk.page,
                "similarity": score,
            }
        )
    return results


def answer_question(question: str) -> dict:
    """
    Hybrid RAG pipeline: retrieves relevant knowledge-base chunks and
    grounds the answer in them when they're genuinely relevant, but also
    lets the model use its own general medical/genetics knowledge to
    answer naturally - the way a real conversational assistant would,
    rather than refusing anything not explicitly in the knowledge base.
    """
    retrieved = retrieve(question)

    # TF-IDF cosine similarity tends to score lower than dense-embedding
    # similarity for short, differently-worded queries, since it only
    # rewards literal word overlap. Tune this threshold further based on
    # real query/answer quality as the knowledge base grows.
    RELEVANCE_THRESHOLD = 0.12
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
            "specific reference document and their general training.\n\n"
            "When the reference passages below are relevant to the "
            "question, use them and cite which one(s) you used, like [1] "
            "or [2][3] — this keeps your clinical claims grounded and "
            "verifiable. For background, definitional, or general "
            "questions (e.g. 'what is X condition', 'how does Y work'), "
            "answer naturally and conversationally using your own "
            "knowledge, without forcing a citation if the passages don't "
            "directly cover it. If the available evidence is thin or "
            "uncertain, say so plainly rather than overstating "
            "confidence. Keep answers clear, warm, and appropriately "
            "concise — a paragraph or two unless more detail is clearly "
            "wanted."
        )
        user_prompt = f"Reference passages:\n{context}\n\nQuestion: {question}"
    else:
        system_prompt = (
            "You are the PreGene-AI clinical assistant — a knowledgeable, "
            "conversational genetics and genomics expert, similar in tone "
            "to a helpful AI assistant like ChatGPT. Answer the user's "
            "question using your own broad medical/genetics knowledge. "
            "If you're not confident in an answer, say so plainly rather "
            "than guessing. Keep answers clear, warm, and appropriately "
            "concise."
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
        max_tokens=600,
    )

    answer = response.choices[0].message.content

    return {
        "answer": answer,
        "sources": [
            {
                "category": r["category"],
                "source_document": r["source_document"],
                "page": r["page"],
                "similarity": round(r["similarity"], 3),
            }
            for r in relevant
        ],
    }