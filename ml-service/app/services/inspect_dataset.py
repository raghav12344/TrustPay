import os
import pandas as pd


BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))
    )
)

DATA_DIR = os.path.join(BASE_DIR, "data", "raw")


transaction_path = os.path.join(
    DATA_DIR,
    "train_transaction.csv"
)

identity_path = os.path.join(
    DATA_DIR,
    "train_identity.csv"
)


print("Loading transaction dataset...")
transactions = pd.read_csv(transaction_path)

print("Loading identity dataset...")
identity = pd.read_csv(identity_path)


print("\n==============================")
print("TRANSACTION DATASET")
print("==============================")

print("Shape:", transactions.shape)

print("\nColumns:")
print(transactions.columns.tolist())


print("\n==============================")
print("IDENTITY DATASET")
print("==============================")

print("Shape:", identity.shape)

print("\nColumns:")
print(identity.columns.tolist())


print("\n==============================")
print("FRAUD DISTRIBUTION")
print("==============================")

print(
    transactions["isFraud"].value_counts()
)

print("\nFraud percentage:")

fraud_percentage = (
    transactions["isFraud"].mean() * 100
)

print(f"{fraud_percentage:.4f}%")


print("\n==============================")
print("MISSING VALUES")
print("==============================")

missing = (
    transactions.isnull()
    .mean()
    .sort_values(ascending=False)
)

print(
    missing.head(20)
)


print("\n==============================")
print("SAMPLE TRANSACTIONS")
print("==============================")

print(
    transactions.head()
)