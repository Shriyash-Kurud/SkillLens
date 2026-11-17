"""Weighted resume score. To change the scoring, edit WEIGHTS (the weights must add up to 1.0)."""

# category key -> (label shown to the user, weight)
CATEGORIES = {
    "content_completeness": ("Content and completeness", 0.25),
    "skills_presentation": ("Skills presentation", 0.20),
    "projects_achievements": ("Projects and achievements", 0.20),
    "education_experience": ("Education and experience", 0.15),
    "structure_organization": ("Structure and organization", 0.10),
    "clarity_readability": ("Clarity and readability", 0.10),
}

assert abs(sum(weight for _, weight in CATEGORIES.values()) - 1.0) < 1e-9, "Weights must add up to 1.0"


def _clamp(score):
    return max(0, min(100, score))


def calculate_overall_score(category_scores):
    """Overall = sum(category score x weight), kept between 0 and 100."""
    total = sum(_clamp(category_scores[key]) * weight for key, (_, weight) in CATEGORIES.items())
    return int(round(_clamp(total)))


def build_breakdown(category_scores):
    """Per-category rows for the frontend, in display order."""
    return [
        {
            "key": key,
            "label": label,
            "weight": int(round(weight * 100)),
            "score": int(round(_clamp(category_scores[key]))),
        }
        for key, (label, weight) in CATEGORIES.items()
    ]


def score_label(score):
    if score >= 85:
        return "STRONG FOUNDATION"
    if score >= 70:
        return "GOOD FOUNDATION"
    if score >= 55:
        return "PROMISING START"
    return "NEEDS MORE DETAIL"
