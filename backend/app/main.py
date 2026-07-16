from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from app.routes import (
    prediction_router,
    report_router,
    history_router,
    upload_router,
    notification_router,
)
from app.services.dataset_service import dataset_service

app = FastAPI(
    title="PreGene-AI Backend",
    version="1.0.0"
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
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    print("STARTUP EVENT RUNNING")
    dataset_service.load_dataset()


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

    return {
        "found": True,
        "Disease": row["Disease"],
        "Gene": row["Gene"],
        "Gene_Name": row["Gene_Name"],
        "Age_Of_Onset": row["Age_Of_Onset"],
        "Inheritance_Type": row["Inheritance_Type"]
    }


@app.get("/search")
def search_disease(q: str = Query(..., min_length=2)):
    df = dataset_service.get_dataset()

    results = (
        df[df["Disease"].str.contains(q, case=False, na=False)]
        .drop_duplicates(subset=["Disease"])
        .head(10)
    )

    return results.to_dict(orient="records")


print("Prediction:", type(prediction_router))
print("Report:", type(report_router))
print("History:", type(history_router))
print("Upload:", type(upload_router))
print("Notification:", type(notification_router))

app.include_router(prediction_router)
app.include_router(report_router)
app.include_router(history_router)
app.include_router(upload_router)
app.include_router(notification_router)