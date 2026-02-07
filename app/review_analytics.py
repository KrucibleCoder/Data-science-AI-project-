from pathlib import Path
import json
from collections import Counter
import matplotlib.pyplot as plt
import io
import random

REVIEWS_FILE = Path("Reviews") / "reviews.jsonl"


def _load_reviews():
    if not REVIEWS_FILE.exists():
        return []

    with open(REVIEWS_FILE, "r", encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def _demo_data():
    return [
        {"sentiment": {"polarity": random.uniform(0.2, 0.8)}} for _ in range(20)
    ]


def generate_satisfaction_graph() -> bytes:
    """
    Returns a PNG image (bytes).
    Uses demo data if no real reviews exist.
    """
    reviews = _load_reviews()
    demo = False

    if not reviews:
        reviews = _demo_data()
        demo = True

    polarities = [r["sentiment"]["polarity"] for r in reviews]

    positive = sum(1 for p in polarities if p > 0.1)
    neutral = sum(1 for p in polarities if -0.1 <= p <= 0.1)
    negative = sum(1 for p in polarities if p < -0.1)

    labels = ["Positive", "Neutral", "Negative"]
    sizes = [positive, neutral, negative]

    fig, ax = plt.subplots(figsize=(6, 6))
    ax.pie(
        sizes,
        labels=labels,
        autopct="%1.1f%%",
        startangle=140
    )
    ax.axis("equal")

    title = "User Satisfaction (Demo Data)" if demo else "User Satisfaction"
    ax.set_title(title)

    buf = io.BytesIO()
    plt.tight_layout()
    plt.savefig(buf, format="png")
    plt.close(fig)
    buf.seek(0)

    return buf.read()
