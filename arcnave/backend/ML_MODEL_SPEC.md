# ARCNAVE Machine Learning Model Specification

This document details the exact specifications, architecture, feature parameters, and operational behavior of the Random Forest exoplanet classification model extracted directly from `arcnave.code.ipynb`.

---

## 1. Training Dataset

- **Primary Training File:** `cumulativefiltered.csv`
- **File Path in Notebook:** `C:/Users/GOWTHAMM/Downloads/cumulativefiltered.csv`
- **Ingestion Method:**
  ```python
  train_data = pd.read_csv("C:/Users/GOWTHAMM/Downloads/cumulativefiltered.csv")
  ```
- **Evaluation / Candidate Datasets (Inference Only):**
  - `cumulative_2025.10.04_06.36.28.csv` is loaded in subsequent cells for post-training validation and candidate disposition analysis:
    ```python
    pd.read_csv(
        data_path,
        comment='#',
        on_bad_lines='skip',
        engine='python'
    )
    ```
  - `cumulative_2025.10.04_06.36.28.csv` was **not** used to train (`.fit()`) the primary model.

---

## 2. Target Column & Classes

- **Target Column:** `koi_disposition`
- **Classes Included:** Only `CONFIRMED` and `FALSE POSITIVE`
  ```python
  train_data = train_data[train_data['koi_disposition'].isin(['CONFIRMED', 'FALSE POSITIVE'])].dropna()
  ```
- **Target Mapping:**
  ```python
  y = train_data['koi_disposition'].map({'CONFIRMED': 1, 'FALSE POSITIVE': 0})
  ```
- **Binary Encoding:**
  - `1`: `CONFIRMED` (Exoplanet transit signal verified)
  - `0`: `FALSE POSITIVE` (Instrumental artifact, eclipsing binary, or stellar noise)
- **Excluded Classes:** `CANDIDATE` dispositions are filtered out prior to model fitting.

---

## 3. Exact Input Features

The model uses exactly **9 numerical features** extracted from Kepler Objects of Interest (KOI) transit data:

| # | Feature Name | Description | Units / Notes |
|---|--------------|-------------|---------------|
| 1 | `koi_period` | Orbital Period | Days |
| 2 | `koi_time0bk` | Transit Center Time Epoch | BJD - 2454833.0 |
| 3 | `koi_duration` | Transit Duration | Hours |
| 4 | `koi_depth` | Transit Depth | Parts Per Million (ppm) |
| 5 | `koi_prad` | Planetary Radius | Earth Radii (\(R_{\oplus}\)) |
| 6 | `koi_model_snr` | Transit Model Signal-to-Noise Ratio | Dimensionless ratio (Named `koi_snr` during manual interactive input) |
| 7 | `koi_steff` | Stellar Effective Temperature | Kelvin (K) |
| 8 | `koi_srad` | Stellar Radius | Solar Radii (\(R_{\odot}\)) |
| 9 | `koi_kepmag` | Kepler-Band Magnitude | Magnitude (mag) |

---

## 4. Exact Feature Order

The feature array passed to the model must strictly match the following order:

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

When predicting for single samples via `predict()`, the 2D input array format is:
```python
[[koi_period, koi_time0bk, koi_duration, koi_depth, koi_prad, koi_model_snr, koi_steff, koi_srad, koi_kepmag]]
```

---

## 5. Preprocessing Performed Before Training

1. **Class Filtering:** Filtered to keep only records where `koi_disposition` is in `['CONFIRMED', 'FALSE POSITIVE']`.
2. **Missing Value Removal:** Dropped all records containing any NaN values across the dataset:
   ```python
   train_data = train_data[train_data['koi_disposition'].isin(['CONFIRMED', 'FALSE POSITIVE'])].dropna()
   ```
3. **Feature Matrix Selection:** Extracted the 9 specified numerical columns:
   ```python
   X = train_data[feature_cols]
   ```
4. **Target Integer Mapping:** Mapped `CONFIRMED` to `1` and `FALSE POSITIVE` to `0`.
5. **Train/Test Split:** Stratified random split into 80% training and 20% test:
   ```python
   X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
   ```
6. **Categorical / Text Transformations:** None (all features are numeric).
7. **Feature Encoding:** None.

---

## 6. Missing Value Handling

- **Training Phase:** Listwise deletion. Rows containing any `NaN` are dropped using `.dropna()`.
- **Validation Phase (on `new_data`):** `.dropna(subset=feature_cols)` drops only records missing any of the 9 model features.
- **Candidate Inference Phase (`candidates`):** Mean value imputation:
  - If a required feature column is absent from the CSV, it is created and filled with the training set column mean: `X[col].mean()`.
  - If a required feature column has missing values, they are imputed with `X[col].mean()` (or `candidates[col].mean()` if `X` is unavailable):
    ```python
    for col in feature_cols:
        if col not in candidates.columns:
            candidates[col] = X[col].mean()
        else:
            mean_val = X[col].mean() if col in X.columns else candidates[col].mean()
            candidates[col] = candidates[col].fillna(mean_val)
    ```
- **Single Interactive Input Phase:** Direct float conversion `float(input(...))`; no missing value handling.

---

## 7. Scaling and Normalization

- **Scaling Used:** **None**.
- `StandardScaler`, `MinMaxScaler`, `RobustScaler`, or any other normalization method is **not** used.
- Raw, unscaled astronomical values are supplied directly into the Random Forest model.

---

## 8. Random Forest Parameters

- **Instantiation:**
  ```python
  rf_model = RandomForestClassifier(n_estimators=300, random_state=42)
  ```
- **Explicit Hyperparameters:**
  - `n_estimators`: `300` (Ensemble of 300 decision trees)
  - `random_state`: `42` (Fixed seed for reproducible bootstrapping and feature splits)
- **Implicit / Default Hyperparameters (Scikit-Learn defaults):**
  - `criterion`: `'gini'`
  - `max_depth`: `None` (Trees expanded until all leaves are pure or contain fewer than `min_samples_split`)
  - `min_samples_split`: `2`
  - `min_samples_leaf`: `1`
  - `max_features`: `'sqrt'`
  - `bootstrap`: `True`
  - `oob_score`: `False`
  - `class_weight`: `None`

---

## 9. Prediction Methodology

1. **Model Persistence:**
   The model is serialized using Python's standard `pickle` module:
   ```python
   pickle.dump(rf_model, open('exo_planet.pkl', 'wb'))
   ```
2. **Model Loading:**
   ```python
   r = pickle.load(open('exo_planet.pkl', 'rb'))
   ```
3. **Inference Execution:**
   - **Single Item Prediction:**
     ```python
     prediction = r.predict([[koi_period, koi_time0bk, koi_duration, koi_depth, koi_prad, koi_snr, koi_steff, koi_srad, koi_kepmag]])
     ```
   - **Label Mapping:**
     ```python
     label_map = {1: "CONFIRMED", 0: "FALSE POSITIVE"}
     predicted_label = label_map[prediction[0]]
     ```
   - **Batch Candidate Inference:**
     Predictions are made via probability thresholding:
     ```python
     candidates['CONFIRMED_Prob'] = rf_model.predict_proba(X_cand)[:, 1]
     candidates['AI_Prediction'] = ['CONFIRMED' if p >= 0.51 else 'FALSE POSITIVE' for p in candidates['CONFIRMED_Prob']]
     ```
     *(Note: The notebook specifies a classification threshold of `0.51` for confirmed exoplanet candidate labeling).*

---

## 10. Prediction Probability Calculation

- **Method:**
  ```python
  probabilities = rf_model.predict_proba(X)
  confirmed_prob = probabilities[:, 1]
  ```
- **Mechanism:** `predict_proba` returns an array of shape `(n_samples, 2)` where column `0` is the probability of `FALSE POSITIVE` and column `1` is the probability of `CONFIRMED`.
- **Underlying Calculation:** In Random Forest, the probability is the fraction of the 300 individual decision trees voting for Class `1`.

---

## 11. Model Output Representation

- **Discrete Class:**
  - `1`: `CONFIRMED`
  - `0`: `FALSE POSITIVE`
- **Continuous Probability:**
  - `CONFIRMED_Prob` \(\in [0.0, 1.0]\)
  - Indicates the ensemble confidence that a Kepler signal represents a true exoplanet transit.

---

## 12. Recorded Model Performance Metrics

From the notebook's executed cell outputs:

- **20% Test Split Evaluation (`X_test`, 1,465 samples):**
  - **Accuracy:** `0.91` (91%)
  - **Class 0 (`FALSE POSITIVE`):** Precision `0.94`, Recall `0.92`, F1-score `0.93` (Support: 900)
  - **Class 1 (`CONFIRMED`):** Precision `0.87`, Recall `0.90`, F1-score `0.89` (Support: 565)

- **External NASA Cumulative Evaluation (`test_data`, 7,325 samples):**
  - **Accuracy:** `0.98` (98%)
  - **Confusion Matrix:**
    - True Negative (`FALSE POSITIVE` correct): `4507`
    - False Positive (Actual `FALSE POSITIVE`, predicted `CONFIRMED`): `74`
    - False Negative (Actual `CONFIRMED`, predicted `FALSE POSITIVE`): `57`
    - True Positive (`CONFIRMED` correct): `2687`

- **Unlabeled NASA Kepler Candidate Analysis (1,979 remaining candidates):**
  - **Predicted as CONFIRMED:** `490`
  - **Predicted as FALSE POSITIVE:** `1489`
  - **Mean Confidence (`CONFIRMED_Prob`):** `0.293`
