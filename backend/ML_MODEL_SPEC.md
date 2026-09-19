# ARCNAVE ML Model Specification

> Extracted directly from `arcnave.code.ipynb`. Nothing is invented.

---

## 1. Training Dataset

- **File:** `cumulativefiltered.csv`
- **Path used in notebook:** `C:/Users/GOWTHAMM/Downloads/cumulativefiltered.csv`
- **Load method:**
  ```python
  train_data = pd.read_csv("C:/Users/GOWTHAMM/Downloads/cumulativefiltered.csv")
  ```
- `cumulative_2025.10.04_06.36.28.csv` is loaded separately for evaluation and candidate inference — it is **not** used for training.

---

## 2. Target Column

- **Column name:** `koi_disposition`
- **Classes kept:** `CONFIRMED` and `FALSE POSITIVE` only (rows with `CANDIDATE` are excluded before training)
- **Mapping:**
  ```python
  y = train_data['koi_disposition'].map({'CONFIRMED': 1, 'FALSE POSITIVE': 0})
  ```
  | Label | Integer |
  |-------|---------|
  | CONFIRMED | 1 |
  | FALSE POSITIVE | 0 |

---

## 3. Input Features

Exactly **9 numerical features**:

| # | Feature | Description |
|---|---------|-------------|
| 1 | `koi_period` | Orbital period (days) |
| 2 | `koi_time0bk` | Transit epoch (BJD − 2454833.0) |
| 3 | `koi_duration` | Transit duration (hours) |
| 4 | `koi_depth` | Transit depth (ppm) |
| 5 | `koi_prad` | Planetary radius (Earth radii) |
| 6 | `koi_model_snr` | Transit signal-to-noise ratio |
| 7 | `koi_steff` | Stellar effective temperature (K) |
| 8 | `koi_srad` | Stellar radius (solar radii) |
| 9 | `koi_kepmag` | Kepler-band magnitude |

---

## 4. Exact Feature Order

```python
feature_cols = [
    'koi_period',
    'koi_time0bk',
    'koi_duration',
    'koi_depth',
    'koi_prad',
    'koi_model_snr',
    'koi_steff',
    'koi_srad',
    'koi_kepmag'
]
```

The model expects a 2D array with columns in this exact order:
```python
[[koi_period, koi_time0bk, koi_duration, koi_depth, koi_prad, koi_model_snr, koi_steff, koi_srad, koi_kepmag]]
```

> **Note:** In the interactive input cell (Cell 9), the variable is named `koi_snr` and the prompt says `"enter the koi_snr:"`, but it maps to the same position as `koi_model_snr` in the feature order.

---

## 5. Preprocessing Before Training

1. **Class filter:** Keep only rows where `koi_disposition` is `CONFIRMED` or `FALSE POSITIVE`.
2. **Drop NaN:** `.dropna()` on the entire filtered DataFrame (listwise deletion).
3. **Feature extraction:** `X = train_data[feature_cols]` (the 9 columns above).
4. **Target encoding:** Map `CONFIRMED → 1`, `FALSE POSITIVE → 0`.
5. **Train/test split:**
   ```python
   X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
   ```
6. No categorical encoding, no text transformations — all 9 features are numeric.

---

## 6. Missing Value Handling

| Phase | Method |
|-------|--------|
| **Training** | `.dropna()` — rows with any NaN are dropped entirely |
| **Evaluation** (Cell 3, `test_data`) | `.dropna(subset=feature_cols)` — drops rows missing any of the 9 feature columns |
| **Candidate inference** (Cell 7) | Mean imputation per column — if a feature column is absent, it is filled with `X[col].mean()`; if present but has NaNs, they are filled with `X[col].mean()` (falling back to `candidates[col].mean()` if `X` is unavailable) |
| **Interactive input** (Cell 9) | No handling — raw `float(input(...))` conversion |

Candidate imputation code from the notebook:
```python
for col in feature_cols:
    if col not in candidates.columns:
        candidates[col] = X[col].mean()
    else:
        mean_val = X[col].mean() if col in X.columns else candidates[col].mean()
        candidates[col] = candidates[col].fillna(mean_val)
```

---

## 7. Scaling

**None.** No `StandardScaler`, `MinMaxScaler`, or any other scaler is used anywhere in the notebook. Raw feature values are passed directly to the model.

---

## 8. Random Forest Parameters

```python
rf_model = RandomForestClassifier(n_estimators=300, random_state=42)
```

| Parameter | Value | Note |
|-----------|-------|------|
| `n_estimators` | `300` | Explicitly set |
| `random_state` | `42` | Explicitly set |
| `criterion` | `'gini'` | scikit-learn default |
| `max_depth` | `None` | scikit-learn default (no limit) |
| `min_samples_split` | `2` | scikit-learn default |
| `min_samples_leaf` | `1` | scikit-learn default |
| `max_features` | `'sqrt'` | scikit-learn default |
| `bootstrap` | `True` | scikit-learn default |
| `class_weight` | `None` | scikit-learn default |

---

## 9. How Prediction Is Performed

### Single-sample interactive prediction (Cell 9)
```python
import pickle
pickle.dump(rf_model, open('exo_planet.pkl', 'wb'))

# ... collect 9 float inputs from user ...

r = pickle.load(open('exo_planet.pkl', 'rb'))
prediction = r.predict([[koi_period, koi_time0bk, koi_duration, koi_depth,
                          koi_prad, koi_snr, koi_steff, koi_srad, koi_kepmag]])

label_map = {1: "CONFIRMED", 0: "FALSE POSITIVE"}
print("Predicted class:", label_map[prediction[0]])
```

### Batch candidate prediction (Cell 7)
```python
candidates['CONFIRMED_Prob'] = rf_model.predict_proba(X_cand)[:, 1]
candidates['AI_Prediction'] = [
    'CONFIRMED' if p >= 0.51 else 'FALSE POSITIVE'
    for p in candidates['CONFIRMED_Prob']
]
```
- Uses `predict_proba`, not `predict`.
- Classification threshold is **0.51** (not the default 0.5).

### Evaluation prediction (Cell 3)
```python
y_pred = rf_model.predict(X_new)
y_prob = rf_model.predict_proba(X_new)[:, 1]
```

---

## 10. Prediction Probability Calculation

```python
rf_model.predict_proba(X)[:, 1]
```

- `predict_proba` returns shape `(n_samples, 2)`.
- Column 0 = probability of `FALSE POSITIVE` (class 0).
- Column 1 = probability of `CONFIRMED` (class 1).
- Each probability is the fraction of the 300 trees voting for that class.

---

## 11. What the Model Output Represents

| Output | Meaning |
|--------|---------|
| `prediction == 1` | `CONFIRMED` — the transit signal is a verified exoplanet |
| `prediction == 0` | `FALSE POSITIVE` — the signal is an artifact / eclipsing binary / noise |
| `CONFIRMED_Prob` | Float in [0, 1] — ensemble confidence that the signal is a real exoplanet |

For batch candidate inference, the notebook uses a **0.51 threshold** on `CONFIRMED_Prob` to assign the `AI_Prediction` label.

---

## Appendix: Recorded Performance (from notebook outputs)

### Train/test split (Cell 1) — 1,465 test samples
- **Accuracy:** 0.91
- Class 0 (FALSE POSITIVE): Precision 0.94, Recall 0.92, F1 0.93 (support 900)
- Class 1 (CONFIRMED): Precision 0.87, Recall 0.90, F1 0.89 (support 565)

### NASA cumulative evaluation (Cell 3) — 7,325 samples
- **Accuracy:** 0.98
- Confusion matrix: TN=4507, FP=74, FN=57, TP=2687

### Candidate analysis (Cell 7) — 1,979 CANDIDATE KOIs
- Predicted CONFIRMED: 490
- Predicted FALSE POSITIVE: 1,489
- Mean CONFIRMED_Prob: 0.293

### Model serialization
- Saved as `exo_planet.pkl` via `pickle.dump`.
