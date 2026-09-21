import os
import joblib
import pandas as pd

from lightgbm import LGBMClassifier
from sklearn.metrics import (
    roc_auc_score,
    average_precision_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
)


BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))
    )
)

DATA_DIR = os.path.join(BASE_DIR, "data", "raw")
MODEL_DIR = os.path.join(BASE_DIR, "app", "model")

TRANSACTION_PATH = os.path.join(
    DATA_DIR,
    "train_transaction.csv"
)

IDENTITY_PATH = os.path.join(
    DATA_DIR,
    "train_identity.csv"
)

MODEL_PATH = os.path.join(
    MODEL_DIR,
    "lightgbm_fraud_model.pkl"
)


FEATURES = [
    # Transaction
    "TransactionAmt",
    "TransactionDT",
    "ProductCD",

    # Card
    "card1",
    "card2",
    "card3",
    "card4",
    "card5",
    "card6",

    # Location
    "addr1",
    "addr2",
    "dist1",

    # Email
    "P_emaildomain",

    # Transaction behaviour
    "C1",
    "C2",
    "C3",
    "C4",
    "C5",
    "C6",
    "C7",
    "C8",
    "C9",
    "C10",
    "C11",
    "C12",
    "C13",
    "C14",

    # Time / historical behaviour
    "D1",
    "D2",
    "D3",
    "D4",
    "D5",
    "D10",
    "D11",
    "D15",
]


CATEGORICAL_FEATURES = [
    "ProductCD",
    "card4",
    "card6",
    "P_emaildomain",
]


def load_data():

    print("Loading transaction dataset...")

    transactions = pd.read_csv(
        TRANSACTION_PATH
    )

    print("Loading identity dataset...")

    identity = pd.read_csv(
        IDENTITY_PATH
    )

    print("Merging datasets...")

    df = transactions.merge(
        identity,
        on="TransactionID",
        how="left"
    )

    print(
        "Merged dataset shape:",
        df.shape
    )

    return df


def prepare_data(df):

    print("\nPreparing features...")

    X = df[FEATURES].copy()
    y = df["isFraud"]

    # Convert categorical columns to pandas category.
    for column in CATEGORICAL_FEATURES:
        X[column] = X[column].astype("category")

    # Sort chronologically.
    order = df["TransactionDT"].argsort()

    X = X.iloc[order].reset_index(drop=True)
    y = y.iloc[order].reset_index(drop=True)

    return X, y


def split_data(X, y):

    total = len(X)

    train_end = int(total * 0.70)
    validation_end = int(total * 0.85)

    X_train = X.iloc[:train_end]
    y_train = y.iloc[:train_end]

    X_validation = X.iloc[
        train_end:validation_end
    ]
    y_validation = y.iloc[
        train_end:validation_end
    ]

    X_test = X.iloc[
        validation_end:
    ]
    y_test = y.iloc[
        validation_end:
    ]

    print("\nDataset split:")
    print(
        "Training:",
        X_train.shape
    )
    print(
        "Validation:",
        X_validation.shape
    )
    print(
        "Test:",
        X_test.shape
    )

    print(
        "\nFraud rate:"
    )

    print(
        "Train:",
        f"{y_train.mean() * 100:.4f}%"
    )

    print(
        "Validation:",
        f"{y_validation.mean() * 100:.4f}%"
    )

    print(
        "Test:",
        f"{y_test.mean() * 100:.4f}%"
    )

    return (
        X_train,
        X_validation,
        X_test,
        y_train,
        y_validation,
        y_test,
    )


def train_model(
    X_train,
    y_train,
    X_validation,
    y_validation,
):

    print("\nTraining LightGBM...")

    model = LGBMClassifier(
        objective="binary",

        n_estimators=1000,

        learning_rate=0.03,

        num_leaves=31,

        max_depth=-1,

        subsample=0.8,

        colsample_bytree=0.8,

        reg_alpha=0.1,

        reg_lambda=0.1,

        random_state=42,

        n_jobs=-1,

        verbosity=-1,
    )

    model.fit(
        X_train,
        y_train,

        categorical_feature=CATEGORICAL_FEATURES,

        eval_set=[
            (X_validation, y_validation)
        ],

        callbacks=[],
    )

    print("Training complete.")

    return model


def evaluate_model(
    model,
    X_test,
    y_test,
):

    print("\nEvaluating model...")

    probabilities = model.predict_proba(
        X_test
    )[:, 1]

    predictions = (
        probabilities >= 0.5
    ).astype(int)

    roc_auc = roc_auc_score(
        y_test,
        probabilities
    )

    pr_auc = average_precision_score(
        y_test,
        probabilities
    )

    precision = precision_score(
        y_test,
        predictions,
        zero_division=0
    )

    recall = recall_score(
        y_test,
        predictions,
        zero_division=0
    )

    f1 = f1_score(
        y_test,
        predictions,
        zero_division=0
    )

    matrix = confusion_matrix(
        y_test,
        predictions
    )

    print("\n========== RESULTS ==========")

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

    print("\nConfusion Matrix:")

    print(matrix)

    print(
        "\n=============================="
    )

    return {
        "roc_auc": roc_auc,
        "pr_auc": pr_auc,
        "precision": precision,
        "recall": recall,
        "f1": f1,
    }


def save_model(model):

    os.makedirs(
        MODEL_DIR,
        exist_ok=True
    )

    joblib.dump(
        model,
        MODEL_PATH
    )

    print(
        f"\nModel saved to:\n{MODEL_PATH}"
    )


def show_feature_importance(model):

    importance = pd.DataFrame({
        "feature": FEATURES,
        "importance": model.feature_importances_,
    })

    importance = importance.sort_values(
        "importance",
        ascending=False
    )

    print("\n========== FEATURE IMPORTANCE ==========")

    print(
        importance.to_string(
            index=False
        )
    )

    print(
        "\n========================================="
    )


def main():

    df = load_data()

    X, y = prepare_data(df)

    (
        X_train,
        X_validation,
        X_test,
        y_train,
        y_validation,
        y_test,
    ) = split_data(X, y)

    model = train_model(
        X_train,
        y_train,
        X_validation,
        y_validation,
    )

    evaluate_model(
        model,
        X_test,
        y_test,
    )

    show_feature_importance(
        model
    )

    save_model(
        model
    )


if __name__ == "__main__":
    main()