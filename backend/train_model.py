"""
train_model.py — Reproduce the exact model from arcnave.code.ipynb (Cell 1).

This script trains the Random Forest model using the EXACT same code,
parameters, and random seed as the notebook so the resulting pkl file
is identical to what the notebook would produce.

Run once:  python train_model.py
"""

import os
import pickle
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# ── 1. Load training data (same path the notebook uses) ──────────────
DATA_PATH = r"C:/Users/GOWTHAMM/Downloads/cumulativefiltered.csv"
if not os.path.exists(DATA_PATH):
    raise FileNotFoundError(
        f"Training CSV not found at {DATA_PATH}. "
        "Place cumulativefiltered.csv in your Downloads folder."
    )

train_data = pd.read_csv(DATA_PATH)

# ── 2. Filter & clean (identical to notebook Cell 1) ─────────────────
train_data = train_data[
    train_data["koi_disposition"].isin(["CONFIRMED", "FALSE POSITIVE"])
].dropna()

# ── 3. Features & target (identical to notebook) ─────────────────────
feature_cols = [
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

X = train_data[feature_cols]
y = train_data["koi_disposition"].map({"CONFIRMED": 1, "FALSE POSITIVE": 0})

# ── 4. Split (identical to notebook) ─────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# ── 5. Train (identical to notebook) ─────────────────────────────────
rf_model = RandomForestClassifier(n_estimators=300, random_state=42)
rf_model.fit(X_train, y_train)

# ── 6. Quick sanity check ────────────────────────────────────────────
acc = round(accuracy_score(y_test, rf_model.predict(X_test)), 2)
print(f"Test accuracy: {acc}")
print(classification_report(y_test, rf_model.predict(X_test)))

# ── 7. Save model to backend/ directory ──────────────────────────────
MODEL_PATH = os.path.join(os.path.dirname(__file__), "exo_planet.pkl")
with open(MODEL_PATH, "wb") as f:
    pickle.dump(rf_model, f)

print(f"Model saved to {MODEL_PATH}")
