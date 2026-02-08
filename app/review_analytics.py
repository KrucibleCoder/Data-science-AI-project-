from pathlib import Path
import json
import matplotlib.pyplot as plt
import io
from collections import defaultdict
import random

# =============================================================================
# Configuration
# =============================================================================

REVIEWS_FILE = Path("Reviews") / "reviews.jsonl"
VARIANTS = ["Natural", "Vivid", "Warm"]

# Muted, UI-friendly colors (blue, orange, green)
PIE_COLORS = ["#4C78A8", "#F58518", "#54A24B"]

TEXT_COLOR = "#EAEAF1"
TITLE_COLOR = "#EAEAF1"


# =============================================================================
# Helpers
# =============================================================================

def _load_reviews():
    if not REVIEWS_FILE.exists():
        return []

    with open(REVIEWS_FILE, "r", encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def _demo_scores():
    """
    Generates synthetic demo data when no real reviews exist.
    This keeps the UI alive and visually consistent.
    """
    return {
        "Natural": [random.randint(70, 85) for _ in range(10)],
        "Vivid": [random.randint(55, 75) for _ in range(10)],
        "Warm": [random.randint(80, 92) for _ in range(10)],
    }


# =============================================================================
# Main analytics function
# =============================================================================

def generate_satisfaction_pie() -> bytes:
    """
    Generates a dark-themed, transparent PNG pie chart representing
    average User Prefrence per variant.

    - Uses demo data if no reviews exist
    - Designed to visually integrate with dark/glass UI
    - Returns raw PNG bytes (no filesystem writes)
    """
    reviews = _load_reviews()
    demo = False

    scores_by_label = defaultdict(list)

    # ---------------------------------------------------------
    # Load real data or fallback to demo
    # ---------------------------------------------------------
    if not reviews:
        demo = True
        scores_by_label = _demo_scores()
    else:
        for r in reviews:
            label = r.get("label")
            score = r.get("score")
            if label and isinstance(score, (int, float)):
                scores_by_label[label].append(score)

    labels = []
    averages = []

    for label, scores in scores_by_label.items():
        if scores:
            labels.append(label)
            averages.append(sum(scores) / len(scores))

    # Absolute fallback (should never happen, but safe)
    if not averages:
        labels = VARIANTS
        averages = [33, 33, 34]
        demo = True

    # ---------------------------------------------------------
    # Plot (dark / transparent theme)
    # ---------------------------------------------------------
    fig, ax = plt.subplots(
        figsize=(6, 6),
        facecolor="none"
    )
    ax.set_facecolor("none")

    wedges, texts, autotexts = ax.pie(
        averages,
        labels=labels,
        colors=PIE_COLORS[: len(labels)],
        autopct="%1.1f%%",
        startangle=140,
        textprops={
            "color": TEXT_COLOR,
            "fontsize": 11
        },
    )

    # Improve percentage label contrast
    for t in autotexts:
        t.set_color("#FFFFFF")
        t.set_fontsize(11)

    # Subtle separators between slices
    for w in wedges:
        w.set_edgecolor((1, 1, 1, 0.08))  # RGBA, very soft white

    ax.axis("equal")

    title = "User Preference (Demo Data)" if demo else ""
    ax.set_title(
        title,
        color=TITLE_COLOR,
        fontsize=14,
        pad=12
    )

    # ---------------------------------------------------------
    # Export to PNG (transparent)
    # ---------------------------------------------------------
    buf = io.BytesIO()
    plt.tight_layout()
    plt.savefig(
        buf,
        format="png",
        transparent=True
    )
    plt.close(fig)
    buf.seek(0)

    return buf.read()
