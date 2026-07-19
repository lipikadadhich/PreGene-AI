from contextlib import asynccontextmanager
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
from app.database import Base, engine
from app.models.user import User  # CRITICAL: Must be imported before create_all
from app.routes import (
    prediction_router,
    report_router,
    history_router,
    upload_router,
    notification_router,
)
from app.routes.auth_router import auth_router
from app.routes.chat_router import chat_router
from app.services.dataset_service import dataset_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("STARTUP EVENT RUNNING")
    # 1. Create DB tables (Will now correctly detect the User model)
    Base.metadata.create_all(bind=engine)
    # 2. Load dataset safely
    dataset_service.load_dataset()
    yield
    # Any necessary shutdown logic would go here


# Pass the lifespan context manager into the FastAPI app
app = FastAPI(
    title="PreGene-AI Backend",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:5177",
        "http://localhost:5178",
        # Production frontend (Vercel)
        "https://pre-gene-ai.vercel.app",
    ],

    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "PreGene-AI Backend Running",
        "dataset": "Loaded"
    }


@app.get("/health")
def health():
    return {
        "status": "Healthy"
    }


@app.get("/stats")
def get_stats():
    df = dataset_service.get_dataset()
    return {
        "total_diseases": int(df["Disease"].nunique()),
        "total_genes": int(df["Gene"].nunique()),
        "total_records": int(len(df)),
        "columns": list(df.columns)
    }


@app.get("/diseases")
def get_diseases():
    df = dataset_service.get_dataset()
    diseases = (
        df["Disease"]
        .dropna()
        .drop_duplicates()
        .sort_values()
        .tolist()
    )
    return {
        "count": len(diseases),
        "diseases": diseases
    }


@app.get("/disease/{disease_name}")
def get_disease(disease_name: str):
    try:
        df = dataset_service.get_dataset()
        result = df[
            df["Disease"].str.lower() == disease_name.lower()
        ]
        if result.empty:
            return {
                "found": False,
                "message": "Disease not found"
            }
        row = result.iloc[0]
        print("========== DEBUG ==========")
        print("Columns:", df.columns.tolist())
        print("Row Index:", row.index.tolist())
        print("Row Dict:", row.to_dict())
        print("===========================")
        data = {
            key: (None if pd.isna(value) else str(value))
            for key, value in row.to_dict().items()
        }
        return {
            "found": True,
            "data": data
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "error": str(e)
        }


def _to_json_safe(value):
    """
    Convert a single value to something Python's/FastAPI's default JSON
    encoder can always handle. This is the actual fix: pandas/numpy values
    (np.int64, np.float64, np.bool_, pd.Timestamp, etc.) are NOT natively
    JSON-serializable. When to_dict(orient="records") is used, values keep
    their numpy/pandas dtypes. FastAPI serializes the return value AFTER
    your function's try/except has already exited successfully — so a
    serialization failure here produces a raw, unguarded 500 Internal
    Server Error that your try/except never sees or catches.
    """
    if value is None:
        return None
    if isinstance(value, float) and pd.isna(value):
        return None
    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass  # pd.isna() can raise on some types (e.g. arrays) — ignore and continue

    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating,)):
        return float(value)
    if isinstance(value, (np.bool_,)):
        return bool(value)
    if isinstance(value, pd.Timestamp):
        return value.isoformat()
    if isinstance(value, (np.ndarray,)):
        return value.tolist()

    return value


@app.get("/search")
def search_disease(q: str = Query(..., min_length=2)):
    try:
        df = dataset_service.get_dataset()

        if "Disease" not in df.columns:
            raise ValueError(
                f"'Disease' column not found. Available columns: {list(df.columns)}"
            )

        # Ensure the column is actually string dtype before calling
        # .str.contains() on it — if the dataset loaded with NaNs or mixed
        # types in this column, .str.contains() can raise here.
        results = (
            df[df["Disease"].astype(str).str.contains(q, case=False, na=False)]
            .drop_duplicates(subset=["Disease"])
            .head(10)
        )
        records = results.to_dict(orient="records")

        # FIX: sanitize every value to a native Python type BEFORE returning,
        # so FastAPI's response encoder never has to deal with a raw numpy
        # or pandas type. This is what a bare `if pd.isna(value): record[key]
        # = None` misses — it only handles NaN, not int64/float64/bool_/
        # Timestamp values, which are the actual common cause of a
        # serialization-stage 500 error.
        safe_records = [
            {key: _to_json_safe(value) for key, value in record.items()}
            for record in records
        ]

        return safe_records
    except Exception as e:
        # Any exception INSIDE this try block (before the return) is caught
        # here and reported as a real JSON error instead of a silent 500.
        import traceback
        traceback.print_exc()
        return {
            "error": "Search failed",
            "detail": str(e)
        }


print("Prediction:", type(prediction_router))
print("Report:", type(report_router))
print("History:", type(history_router))
print("Upload:", type(upload_router))
print("Notification:", type(notification_router))
print("Auth:", type(auth_router))
print("Chat:", type(chat_router))

app.include_router(prediction_router)
app.include_router(report_router)
app.include_router(history_router)
app.include_router(upload_router)
app.include_router(notification_router)
app.include_router(auth_router)
app.include_router(chat_router)