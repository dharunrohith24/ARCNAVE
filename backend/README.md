# ARCNAVE Backend — FastAPI Exoplanet Classifier

This backend serves the existing Random Forest model trained on NASA Kepler KOI data.

## Prerequisites

- Python 3.10+
- The training CSV (`cumulativefiltered.csv`) in your Downloads folder (only needed if regenerating the model)

## Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt
```

## Generate the model (one-time)

If `exo_planet.pkl` does not already exist in this directory, generate it:

```bash
python train_model.py
```

This runs the **exact same** training pipeline as `arcnave.code.ipynb` (same data, same parameters, same random seed) and saves the model as `exo_planet.pkl`.

## Start the server

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at **http://localhost:8000**.

## Endpoints

### `GET /health`

Returns server status and whether the model is loaded.

```json
{
  "status": "ok",
  "model_loaded": true
}
```

### `POST /predict`

Accepts the 9 Kepler KOI features and returns the model's prediction.

**Request body:**

```json
{
  "koi_period": 9.488,
  "koi_time0bk": 170.539,
  "koi_duration": 2.953,
  "koi_depth": 615.8,
  "koi_prad": 2.26,
  "koi_model_snr": 35.8,
  "koi_steff": 5455.0,
  "koi_srad": 0.927,
  "koi_kepmag": 15.347
}
```

**Response:**

```json
{
  "prediction": "CONFIRMED",
  "prediction_int": 1,
  "confirmed_probability": 0.893333,
  "false_positive_probability": 0.106667
}
```

### Interactive docs

Visit **http://localhost:8000/docs** for the Swagger UI.

## Feature reference

| # | Field             | Description                        |
|---|-------------------|------------------------------------|
| 1 | `koi_period`      | Orbital period (days)              |
| 2 | `koi_time0bk`     | Transit epoch (BJD − 2454833.0)    |
| 3 | `koi_duration`    | Transit duration (hours)           |
| 4 | `koi_depth`       | Transit depth (ppm)                |
| 5 | `koi_prad`        | Planetary radius (Earth radii)     |
| 6 | `koi_model_snr`   | Transit signal-to-noise ratio      |
| 7 | `koi_steff`       | Stellar effective temperature (K)  |
| 8 | `koi_srad`        | Stellar radius (solar radii)      |
| 9 | `koi_kepmag`      | Kepler-band magnitude              |

## Notes

- **No scaling** is applied — the model was trained on raw feature values.
- CORS is enabled for all origins so the React frontend can call the API.
- See `ML_MODEL_SPEC.md` for the full model specification.
