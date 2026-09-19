"""
ARCNAVE FastAPI Backend
=======================
Serves the existing Random Forest exoplanet classification model.
No new model is trained — the pre-trained exo_planet.pkl is loaded at startup.
"""

import os
import pickle
import numpy as np
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ─────────────────────────────────────────────────────────────────────
# Constants (from ML_MODEL_SPEC.md / arcnave.code.ipynb)
# ─────────────────────────────────────────────────────────────────────
FEATURE_COLS = [
    "koi_period",
    "koi_time0bk",
    "koi_duration",
    "koi_depth",
    "koi_prad",
    "koi_model_snr",
    "koi_steff",
    "koi_srad",
    "koi_kepmag",
]

LABEL_MAP = {1: "CONFIRMED", 0: "FALSE POSITIVE"}

MODEL_PATH = os.path.join(os.path.dirname(__file__), "exo_planet.pkl")

# ─────────────────────────────────────────────────────────────────────
# Global model reference (populated on startup)
# ─────────────────────────────────────────────────────────────────────
model = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the trained model once at server startup."""
    global model
    if not os.path.exists(MODEL_PATH):
        raise RuntimeError(
            f"Trained model not found at {MODEL_PATH}. "
            "Run  python train_model.py  first to generate exo_planet.pkl."
        )
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
    print(f"✓ Model loaded from {MODEL_PATH}")
    yield


# ─────────────────────────────────────────────────────────────────────
# App
# ─────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="ARCNAVE Exoplanet Classifier API",
    description="Serves the existing Random Forest model trained on NASA Kepler KOI data.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow the React frontend on any localhost port
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────────────
# Pydantic schemas
# ─────────────────────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    """Exactly the 9 features the Random Forest model expects."""

    koi_period: float = Field(..., description="Orbital period (days)")
    koi_time0bk: float = Field(..., description="Transit epoch (BJD - 2454833.0)")
    koi_duration: float = Field(..., description="Transit duration (hours)")
    koi_depth: float = Field(..., description="Transit depth (ppm)")
    koi_prad: float = Field(..., description="Planetary radius (Earth radii)")
    koi_model_snr: float = Field(..., description="Transit signal-to-noise ratio")
    koi_steff: float = Field(..., description="Stellar effective temperature (K)")
    koi_srad: float = Field(..., description="Stellar radius (solar radii)")
    koi_kepmag: float = Field(..., description="Kepler-band magnitude")

    model_config = {"json_schema_extra": {
        "examples": [
            {
                "koi_period": 9.48803590,
                "koi_time0bk": 170.538750,
                "koi_duration": 2.95320,
                "koi_depth": 615.8,
                "koi_prad": 2.26,
                "koi_model_snr": 35.8,
                "koi_steff": 5455.0,
                "koi_srad": 0.927,
                "koi_kepmag": 15.347,
            }
        ]
    }}


class PredictResponse(BaseModel):
    prediction: str = Field(..., description="CONFIRMED or FALSE POSITIVE")
    prediction_int: int = Field(..., description="1 = CONFIRMED, 0 = FALSE POSITIVE")
    confirmed_probability: float = Field(
        ..., description="Probability the signal is a confirmed exoplanet (0-1)"
    )
    false_positive_probability: float = Field(
        ..., description="Probability the signal is a false positive (0-1)"
    )


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool


# ─────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────
@app.get("/health", response_model=HealthResponse)
async def health():
    """Check that the API is running and the model is loaded."""
    return HealthResponse(
        status="ok",
        model_loaded=model is not None,
    )


@app.post("/predict", response_model=PredictResponse)
async def predict(req: PredictRequest):
    """
    Run the existing Random Forest model on the supplied features.

    No preprocessing beyond what the notebook does is applied:
    - No scaling (the model was trained on raw values).
    - Features are assembled in the exact trained order.
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded.")

    # Assemble features in the exact order the model was trained on
    features = np.array(
        [[
            req.koi_period,
            req.koi_time0bk,
            req.koi_duration,
            req.koi_depth,
            req.koi_prad,
            req.koi_model_snr,
            req.koi_steff,
            req.koi_srad,
            req.koi_kepmag,
        ]]
    )

    try:
        prediction_int = int(model.predict(features)[0])
        probabilities = model.predict_proba(features)[0]
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Model prediction failed: {e}"
        )

    return PredictResponse(
        prediction=LABEL_MAP[prediction_int],
        prediction_int=prediction_int,
        confirmed_probability=round(float(probabilities[1]), 6),
        false_positive_probability=round(float(probabilities[0]), 6),
    )
