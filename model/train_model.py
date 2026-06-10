import pandas as pd
import numpy as np
import re
import pickle
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression # type: ignore
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sklearn.pipeline import Pipeline

df = pd.read_csv("model/cyberbullying_tweets.csv")
df.columns = df.columns.str.strip()

# Use first column as text, second as label
df = df.iloc[:, [0, 1]]
df.columns = ["text", "label"]
df = df.dropna()

# Print what labels exist
print("All labels found:", df["label"].unique())

# Remap whatever labels exist to our 4 categories
label_map = {
    "not_cyberbullying": "not_cyberbullying",
    "religion":          "hate_speech",
    "age":               "hate_speech",
    "ethnicity":         "hate_speech",
    "gender":            "offensive",
    "other_cyberbullying": "offensive",
}

df["label"] = df["label"].map(label_map)
df = df.dropna(subset=["label"])  # drop any unmapped rows

print(f"\nDataset loaded: {len(df)} rows")
print(df["label"].value_counts())
def preprocess(text):
    text = text.lower()
    text = re.sub(r"http\S+|www\S+", "", text)
    text = re.sub(r"@\w+", "", text)
    text = re.sub(r"[^a-z\s]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

df["clean_text"] = df["text"].apply(preprocess)

X_train, X_test, y_train, y_test = train_test_split(
    df["clean_text"], df["label"], test_size=0.2, random_state=42, stratify=df["label"]
)

pipeline = Pipeline([
    ("tfidf", TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=5000,
        sublinear_tf=True
    )),
    ("clf", LogisticRegression(
        max_iter=1000,
        C=1.0,
        class_weight="balanced"
    ))
])

pipeline.fit(X_train, y_train)

y_pred = pipeline.predict(X_test)
acc = accuracy_score(y_test, y_pred)

print(f"\n{'='*50}")
print(f"  Model Accuracy: {acc*100:.1f}%")
print(f"{'='*50}")
print(classification_report(y_test, y_pred))

os.makedirs("model", exist_ok=True)
with open("model/model.pkl", "wb") as f:
    pickle.dump(pipeline, f)

print("Model saved to model/model.pkl")
print("Now run: python app.py")