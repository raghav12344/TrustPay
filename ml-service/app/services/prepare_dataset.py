import os
import pandas as pd


BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))
    )
)

DATA_DIR = os.path.join(BASE_DIR, "data", "raw")


TRANSACTION_PATH = os.path.join(
    DATA_DIR,
    "train_transaction.csv"
)

IDENTITY_PATH = os.path.join(
    DATA_DIR,
    "train_identity.csv"
)


def main():

    print("Loading datasets...")

    transactions = pd.read_csv(TRANSACTION_PATH)
    identity = pd.read_csv(IDENTITY_PATH)

    print("Transaction shape:", transactions.shape)
    print("Identity shape:", identity.shape)

    df = transactions.merge(
        identity,
        on="TransactionID",
        how="left"
    )

    print("Merged shape:", df.shape)

    # -----------------------------------------
    # Fraud distribution
    # -----------------------------------------

    print("\nFraud distribution:")
    print(df["isFraud"].value_counts())

    print(
        f"\nFraud percentage: "
        f"{df['isFraud'].mean() * 100:.4f}%"
    )

    # -----------------------------------------
    # Missing value analysis
    # -----------------------------------------

    missing_percentage = (
    df.isnull()
    .mean()
    .sort_values(ascending=False)
    * 100
)

    print("\nTop 40 columns by missing percentage:")

    print(
        missing_percentage.head(40)
    )

    # -----------------------------------------
    # Data types
    # -----------------------------------------

    print("\nData type distribution:")

    print(
        df.dtypes.value_counts()
    )

    # -----------------------------------------
    # Numeric / categorical
    # -----------------------------------------

    numeric_columns = df.select_dtypes(
        include=["number"]
    ).columns.tolist()

    categorical_columns = df.select_dtypes(
    exclude=["number"]
).columns.tolist()
    print(
        "\nNumeric columns:",
        len(numeric_columns)
    )

    print(
        "Categorical columns:",
        len(categorical_columns)
    )

    print("\nCategorical columns:")

    for column in categorical_columns:
        print(
            f"{column}: "
            f"{df[column].nunique(dropna=True)} unique"
        )

    # -----------------------------------------
    # Save analysis
    # -----------------------------------------

    report_path = os.path.join(
        BASE_DIR,
        "data",
        "processed",
        "feature_analysis.txt"
    )

    os.makedirs(
        os.path.dirname(report_path),
        exist_ok=True
    )

    with open(
        report_path,
        "w",
        encoding="utf-8"
    ) as file:

        file.write(
            f"Dataset shape: {df.shape}\n"
        )

        file.write(
            f"Fraud percentage: "
            f"{df['isFraud'].mean() * 100:.4f}%\n\n"
        )

        file.write(
            "Missing percentages:\n"
        )

        file.write(
            missing_percentage.to_string()
        )

        file.write(
            "\n\nCategorical columns:\n"
        )

        for column in categorical_columns:
            file.write(
                f"{column}: "
                f"{df[column].nunique(dropna=True)} unique\n"
            )

    print(
        f"\nAnalysis saved to:\n{report_path}"
    )


if __name__ == "__main__":
    main()