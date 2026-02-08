from pathlib import Path
import json
from collections import defaultdict, Counter
import statistics
import matplotlib.pyplot as plt
import io

REVIEWS_FILE = Path("Reviews") / "reviews.jsonl"

NEGATIVE_THRESHOLD = 45      # score below this is concerning
LOW_POLARITY = -0.15         # negative sentiment
HIGH_VARIANCE = 200          # disagreement threshold


def _load_reviews():
    if not REVIEWS_FILE.exists():
        return []
    with open(REVIEWS_FILE, "r", encoding="utf-8") as f:
        return [json.loads(l) for l in f if l.strip()]


def analyze_reviews():
    """
    Core analytics function.
    Returns per-variant deep analysis for developer use.
    """
    reviews = _load_reviews()
    if not reviews:
        return {}

    grouped = defaultdict(list)

    for r in reviews:
        grouped[r["label"]].append(r)

    analysis = {}

    for label, items in grouped.items():
        scores = [i["score"] for i in items]
        polarities = [i["sentiment"]["polarity"] for i in items]
        subjectivities = [i["sentiment"]["subjectivity"] for i in items]

        keywords = []
        for i in items:
            keywords.extend(i["sentiment"]["keywords"])

        keyword_counts = Counter(keywords)

        avg_score = sum(scores) / len(scores)
        variance = statistics.variance(scores) if len(scores) > 1 else 0
        avg_polarity = sum(polarities) / len(polarities)
        avg_subjectivity = sum(subjectivities) / len(subjectivities)

        notes = []

        if avg_score < NEGATIVE_THRESHOLD:
            notes.append("Consistently low user satisfaction scores")

        if avg_polarity < LOW_POLARITY:
            notes.append("Overall negative sentiment in feedback")

        if variance > HIGH_VARIANCE:
            notes.append("High disagreement between users")

        if keyword_counts:
            common_negative = [
                k for k, c in keyword_counts.most_common(5)
                if k in ("yellow", "oversaturated", "bleeding", "artifact", "unnatural")
            ]
            if common_negative:
                notes.append(
                    f"Frequent complaint keywords: {', '.join(common_negative)}"
                )

        analysis[label] = {
            "reviews": len(items),
            "avg_score": round(avg_score, 2),
            "variance": round(variance, 2),
            "avg_polarity": round(avg_polarity, 3),
            "avg_subjectivity": round(avg_subjectivity, 3),
            "top_keywords": keyword_counts.most_common(6),
            "notes": notes
        }

    return analysis

def generate_dev_report_png() -> bytes:
    """
    Generates a developer-facing PNG report summarizing
    per-variant analytics and NLP insights.
    """
    data = analyze_reviews()
    if not data:
        raise RuntimeError("No review data available")

    fig_height = 2 + len(data) * 2.4
    fig, ax = plt.subplots(figsize=(10, fig_height))
    ax.axis("off")

    y = 0.95
    ax.text(0.5, y, "Developer Review Analytics Report",
            ha="center", va="top", fontsize=16, weight="bold")
    y -= 0.07

    for label, info in data.items():
        ax.text(0.02, y, f"Variant: {label}",
                fontsize=13, weight="bold")
        y -= 0.05

        ax.text(0.04, y,
                f"Avg Score: {info['avg_score']} | "
                f"Variance: {info['variance']} | "
                f"Polarity: {info['avg_polarity']} | "
                f"Subjectivity: {info['avg_subjectivity']}",
                fontsize=10)
        y -= 0.04

        if info["top_keywords"]:
            kw = ", ".join(k for k, _ in info["top_keywords"])
            ax.text(0.04, y, f"Top Keywords: {kw}", fontsize=9)
            y -= 0.035

        if info["notes"]:
            for n in info["notes"]:
                ax.text(0.06, y, f"- {n}", fontsize=9)
                y -= 0.03
        else:
            ax.text(0.06, y, "- No major issues detected", fontsize=9)
            y -= 0.03

        y -= 0.03  # spacing between variants

    buf = io.BytesIO()
    plt.tight_layout()
    plt.savefig(buf, format="png", dpi=140)
    plt.close(fig)
    buf.seek(0)

    return buf.read()
