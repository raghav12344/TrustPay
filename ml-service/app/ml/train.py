import os

import joblib
import lightgbm as lgb
import pandas as pd

from sklearn.metrics import (
    average_precision_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split


FEATURE_COLUMNS = [
    "amount",
    "transaction_hour",
    "is_night",
    "is_weekend",
    "transaction_count",
    "historical_amount_mean",
    "historical_amount_std",
    "historical_amount_min",
    "historical_amount_max",
    "amount_to_historical_mean",
    "amount_zscore",
    "transactions_last_1h",
    "transactions_last_24h",
    "transactions_last_7d",
    "amount_last_24h",
    "amount_last_7d",
    "new_device",
    "location_changed",
    "is_unusual_amount",
    "is_unusual_time",
]


DATA_PATH = (
    "data/processed/"
    "training_features.csv"
)

MODEL_PATH = (
    "app/model/fraud_model.joblib"
)


def train_model():

    # ---------------------------------------------------------
    # Load data
    # ---------------------------------------------------------

    df = pd.read_csv(DATA_PATH)

    df = df.sort_index()

    X = df[FEATURE_COLUMNS]
    y = df["is_fraud"]

    print(
        f"Dataset size: {len(df)}"
    )

    print(
        f"Fraud transactions: {y.sum()}"
    )

    print(
        f"Fraud rate: {y.mean():.4%}"
    )

    # ---------------------------------------------------------
    # Chronological split
    # ---------------------------------------------------------

    split_index = int(
        len(df) * 0.80
    )

    X_train = X.iloc[:split_index]
    X_test = X.iloc[split_index:]

    y_train = y.iloc[:split_index]
    y_test = y.iloc[split_index:]

    print(
        f"\nTraining rows: {len(X_train)}"
    )

    print(
        f"Testing rows: {len(X_test)}"
    )

    # ---------------------------------------------------------
    # Class imbalance
    # ---------------------------------------------------------

    negative_count = (
        y_train == 0
    ).sum()

    positive_count = (
        y_train == 1
    ).sum()

    scale_pos_weight = (
        negative_count
        / positive_count
    )

    print(
        f"\nScale pos weight: "
        f"{scale_pos_weight:.2f}"
    )

    # ---------------------------------------------------------
    # LightGBM model
    # ---------------------------------------------------------

    model = lgb.LGBMClassifier(
        objective="binary",

        n_estimators=500,

        learning_rate=0.05,

        num_leaves=31,

        max_depth=-1,

        subsample=0.8,

        colsample_bytree=0.8,

        scale_pos_weight=scale_pos_weight,

        random_state=42,

        n_jobs=-1,
    )

    # ---------------------------------------------------------
    # Train
    # ---------------------------------------------------------

    print(
        "\nTraining LightGBM..."
    )

    model.fit(
        X_train,
        y_train,
    )

    print(
        "Training complete."
    )

    # ---------------------------------------------------------
    # Predictions
    # ---------------------------------------------------------

    probabilities = model.predict_proba(
        X_test
    )[:, 1]

    # Default threshold for initial evaluation
    predictions = (
        probabilities >= 0.50
    ).astype(int)

    # ---------------------------------------------------------
    # Metrics
    # ---------------------------------------------------------

    roc_auc = roc_auc_score(
        y_test,
        probabilities,
    )

    pr_auc = average_precision_score(
        y_test,
        probabilities,
    )

    precision = precision_score(
        y_test,
        predictions,
        zero_division=0,
    )

    recall = recall_score(
        y_test,
        predictions,
        zero_division=0,
    )

    f1 = f1_score(
        y_test,
        predictions,
        zero_division=0,
    )

    print(
        "\n=============================="
    )

    print(
        "MODEL PERFORMANCE"
    )

    print(
        "=============================="
    )

    print(
        f"ROC-AUC : {roc_auc:.4f}"
    )

    print(
        f"PR-AUC  : {pr_auc:.4f}"
    )

    print(
        f"Precision: {precision:.4f}"
    )

    print(
        f"Recall   : {recall:.4f}"
    )

    print(
        f"F1 Score : {f1:.4f}"
    )

    # ---------------------------------------------------------
    # Confusion matrix
    # ---------------------------------------------------------

    print(
        "\nConfusion Matrix:"
    )

    print(
        confusion_matrix(
            y_test,
            predictions,
        )
    )

    # ---------------------------------------------------------
    # Classification report
    # ---------------------------------------------------------

    print(
        "\nClassification Report:"
    )

    print(
        classification_report(
            y_test,
            predictions,
            zero_division=0,
        )
    )

    # ---------------------------------------------------------
    # Feature importance
    # ---------------------------------------------------------

    importance = pd.DataFrame(
        {
            "feature": FEATURE_COLUMNS,
            "importance": model.feature_importances_,
        }
    ).sort_values(
        "importance",
        ascending=False,
    )

    print(
        "\nFeature Importance:"
    )

    print(
        importance.to_string(
            index=False
        )
    )

    # ---------------------------------------------------------
    # Save model
    # ---------------------------------------------------------

    os.makedirs(
        os.path.dirname(MODEL_PATH),
        exist_ok=True,
    )

    joblib.dump(
        model,
        MODEL_PATH,
    )

    print(
        f"\nModel saved to:"
        f" {MODEL_PATH}"
    )


if __name__ == "__main__":
    train_model()