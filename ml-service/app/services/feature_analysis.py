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

    print("Merging datasets...")

    df = transactions.merge(
        identity,
        on="TransactionID",
        how="left"
    )

    target = "isFraud"

    # --------------------------------------------------
    # Candidate features
    # --------------------------------------------------

    candidates = [
        # Transaction
        "TransactionAmt",
        "ProductCD",
        "TransactionDT",

        # Card
        "card1",
        "card2",
        "card3",
        "card4",
        "card5",
        "card6",

        # Address / location
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

        # Identity / device
        "DeviceType",
        "DeviceInfo",
        "id_15",
        "id_30",
        "id_31",
        "id_33",
    ]

    candidates = [
        column
        for column in candidates
        if column in df.columns
    ]

    print(
        f"\nEvaluating {len(candidates)} candidate features..."
    )

    results = []

    fraud_rate = df[target].mean()

    for column in candidates:

        series = df[column]

        missing_pct = series.isna().mean() * 100
        unique_count = series.nunique(dropna=True)

        # --------------------------------------------------
        # Numeric features
        # --------------------------------------------------

        if pd.api.types.is_numeric_dtype(series):

            temp = pd.DataFrame({
                "feature": series,
                "target": df[target]
            }).dropna()

            if len(temp) > 0:

                correlation = temp["feature"].corr(
                    temp["target"]
                )

                fraud_mean = temp.loc[
                    temp["target"] == 1,
                    "feature"
                ].mean()

                normal_mean = temp.loc[
                    temp["target"] == 0,
                    "feature"
                ].mean()

            else:
                correlation = 0
                fraud_mean = 0
                normal_mean = 0

            results.append({
                "feature": column,
                "type": "numeric",
                "missing_pct": missing_pct,
                "unique_values": unique_count,
                "correlation": correlation,
                "fraud_rate": fraud_rate,
                "fraud_mean": fraud_mean,
                "normal_mean": normal_mean,
            })

        # --------------------------------------------------
        # Categorical features
        # --------------------------------------------------

        else:

            temp = pd.DataFrame({
                "feature": series.fillna("__MISSING__"),
                "target": df[target]
            })

            grouped = (
                temp.groupby("feature")["target"]
                .agg(["mean", "count"])
            )

            # Ignore extremely rare categories
            grouped = grouped[
                grouped["count"] >= 100
            ]

            if len(grouped) > 0:

                max_fraud_rate = grouped["mean"].max()
                min_fraud_rate = grouped["mean"].min()

                signal = (
                    max_fraud_rate -
                    min_fraud_rate
                )

            else:

                max_fraud_rate = 0
                min_fraud_rate = 0
                signal = 0

            results.append({
                "feature": column,
                "type": "categorical",
                "missing_pct": missing_pct,
                "unique_values": unique_count,
                "correlation": None,
                "fraud_rate": fraud_rate,
                "fraud_mean": max_fraud_rate,
                "normal_mean": min_fraud_rate,
                "signal": signal,
            })

    result_df = pd.DataFrame(results)

    # --------------------------------------------------
    # Save complete report
    # --------------------------------------------------

    output_dir = os.path.join(
        BASE_DIR,
        "data",
        "processed"
    )

    os.makedirs(
        output_dir,
        exist_ok=True
    )

    output_path = os.path.join(
        output_dir,
        "feature_evaluation.csv"
    )

    result_df.to_csv(
        output_path,
        index=False
    )

    # --------------------------------------------------
    # Display results
    # --------------------------------------------------

    print("\nFeature evaluation:")
    print(
        result_df.to_string(
            index=False
        )
    )

    print(
        f"\nSaved report to:\n{output_path}"
    )


if __name__ == "__main__":
    main()