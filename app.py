from flask import Flask, render_template, request, jsonify
import pickle
import re
import os

app = Flask(__name__)

MODEL_PATH = "model/model.pkl"

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError("Model not found! Run: python model/train_model.py first")

with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)

    LABEL_CONFIG = {
    "hate_speech": {
        "display": "Hate Speech",
        "color": "#E24B4A",
        "description": "Content that attacks or demeans a person or group.",
        "severity": "high"
    },
    "threat": {
        "display": "Threat",
        "color": "#EF9F27",
        "description": "Content that contains threats of harm or violence.",
        "severity": "high"
    },
    "offensive": {
        "display": "Offensive",
        "color": "#D85A30",
        "description": "Insulting or derogatory language.",
        "severity": "medium"
    },
    "not_cyberbullying": {
        "display": "Safe",
        "color": "#1D9E75",
        "description": "No harmful content detected.",
        "severity": "none"
    }
}
    
    def preprocess(text):
     text = text.lower()
     text = re.sub(r"http\S+|www\S+", "", text)
     text = re.sub(r"@\w+", "", text)
     text = re.sub(r"[^a-z\s]", "", text)
     text = re.sub(r"\s+", " ", text).strip()
     return text

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    texts = data.get("texts", [])

    if not texts:
        return jsonify({"error": "No text provided"}), 400

    results = []
    for text in texts:
        if not text.strip():
            continue

        clean = preprocess(text)
        label = model.predict([clean])[0]
        proba = model.predict_proba([clean])[0]
        classes = model.classes_

        confidence_scores = {
            cls: round(float(prob) * 100, 1)
            for cls, prob in zip(classes, proba)
        }

        config = LABEL_CONFIG.get(label, LABEL_CONFIG["not_cyberbullying"])

        results.append({
            "text": text,
            "label": label,
            "display_label": config["display"],
            "color": config["color"],
            "description": config["description"],
            "severity": config["severity"],
            "confidence": round(float(max(proba)) * 100, 1),
            "all_scores": confidence_scores
        })

    summary = {
        "total": len(results),
        "harmful": sum(1 for r in results if r["label"] != "not_cyberbullying"),
        "safe": sum(1 for r in results if r["label"] == "not_cyberbullying"),
        "hate_speech": sum(1 for r in results if r["label"] == "hate_speech"),
        "threat": sum(1 for r in results if r["label"] == "threat"),
        "offensive": sum(1 for r in results if r["label"] == "offensive"),
    }

    return jsonify({"results": results, "summary": summary})

if __name__ == "__main__":
    print("\n Cyberbullying Detector running at http://localhost:5000\n")
    app.run(debug=True, port=5000)