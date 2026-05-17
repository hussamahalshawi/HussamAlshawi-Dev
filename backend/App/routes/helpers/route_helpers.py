"""
Shared Route Helpers — route_helpers.py
========================================
Central module for all helper functions shared across route files.
Eliminates duplication of:
    - fmt_date            → was _fmt_date / _fmt in 4 files
    - get_profile         → was _get_profile in 3 files
    - build_token_map     → was inline loop in 3 files
    - resolve_skill_score → was inline logic in goals_charts_api.py
    - build_skill_payload → was _build_skill_payload / _skill_payload in 2 files
    - calc_progress_pct   → was inline min(round(...)) in 4 goal routes

Import in any route file:
    from App.routes.helpers.route_helpers import (
        fmt_date,
        get_profile,
        build_token_map,
        resolve_skill_score,
        build_skill_payload,
        calc_progress_pct,
    )

Author: HussamAlshawi-Dev
"""

from App.models.profile import Profile                        # Profile model — ownership anchor
from App.models.skills  import ProfileSkill                   # Skill scores for token mapping


# ─────────────────────────────────────────────────────────────────────────────
# HELPER  fmt_date
# Replaces the 4 identical private _fmt_date / _fmt functions across:
#   goals_languages_api.py, career_charts_api.py,
#   education_courses_api.py, experience_projects_api.py
# ─────────────────────────────────────────────────────────────────────────────
def fmt_date(dt):
    """
    Converts a datetime object to an ISO-format string.
    Returns None if the value is missing or conversion fails.

    Args:
        dt (datetime | None): The datetime object to format.

    Returns:
        str | None: ISO string e.g. '2023-06-15T00:00:00', or None.
    """
    try:
        return dt.isoformat() if dt else None                 # Convert datetime to ISO string
    except Exception:
        return None                                           # Return None on any conversion error


# ─────────────────────────────────────────────────────────────────────────────
# HELPER  get_profile
# Replaces the 3 identical private _get_profile functions across:
#   skills_charts_api.py, career_charts_api.py, goals_charts_api.py
# ─────────────────────────────────────────────────────────────────────────────
def get_profile():
    """
    Fetches the first (and only) active portfolio Profile document.
    All portfolio data is anchored to a single Profile record.

    Returns:
        Profile | None: The active Profile document, or None if not found.
    """
    return Profile.objects.first()                            # Single portfolio profile document


# ─────────────────────────────────────────────────────────────────────────────
# HELPER  build_token_map
# Replaces the 3 identical inline token-map-building loops across:
#   goals.py, goals_languages_api.py, goals_charts_api.py
# ─────────────────────────────────────────────────────────────────────────────
def build_token_map(profile):
    """
    Builds a {token: best_score} map from all ProfileSkill documents
    linked to the given profile.

    Tokenization strategy:
        - Each ProfileSkill name is split into individual words (tokens).
        - e.g. 'Linear Algebra' -> {'linear': 68, 'algebra': 68}
        - If the same token appears in multiple skills -> keep highest score.

    Args:
        profile (Profile): The active Profile document.

    Returns:
        dict: {token_str: best_score} — lowercase token keys, int scores.
    """
    token_map = {}                                            # Accumulate {token: best_score}

    for ps in ProfileSkill.objects(profile=profile).select_related():
        if not ps.skill:
            continue                                          # Skip orphaned ProfileSkill references

        tokens = ps.skill.skill_name.strip().lower().split() # Tokenize skill name into words

        for token in tokens:
            # Keep the highest score per token across all ProfileSkill docs
            if token not in token_map or ps.score > token_map[token]:
                token_map[token] = ps.score                  # Map token -> best score

    return token_map                                          # Return completed token map


# ─────────────────────────────────────────────────────────────────────────────
# HELPER  resolve_skill_score
# Replaces the inline token-matching logic in goals_charts_api.py
# Used alongside build_token_map for per-skill gap analysis
# ─────────────────────────────────────────────────────────────────────────────
def resolve_skill_score(skill_name, token_map):
    """
    Resolves the best matching score for a required skill from the token map.
    First-token-match-wins strategy — identical to original RoadmapService logic.

    Args:
        skill_name (str): Required skill name from a Goal (e.g. 'Linear Algebra').
        token_map  (dict): Pre-built {token: score} map from build_token_map().

    Returns:
        tuple: (score: int, matched: bool)
    """
    req_tokens = skill_name.strip().lower().split()           # Tokenize the required skill name

    for token in req_tokens:
        if token in token_map:
            return token_map[token], True                     # First match wins — return score

    return 0, False                                           # No match found — return zero score


# ─────────────────────────────────────────────────────────────────────────────
# HELPER  build_skill_payload
# Replaces the 2 nearly-identical private helpers:
#   _build_skill_payload in skills_api.py
#   _skill_payload       in skills_charts_api.py
# ─────────────────────────────────────────────────────────────────────────────
def build_skill_payload(ps):
    """
    Converts a ProfileSkill document into a plain serialisable dict.
    Resolves icon, color, and category name from linked Skill and SkillType refs.

    Args:
        ps (ProfileSkill): A single ProfileSkill document (select_related() called).

    Returns:
        dict | None: Serialised skill payload, or None if skill reference is broken.

    Return shape:
        {
            'skill_name' : 'Python',
            'skill_type' : 'Backend Development',
            'score'      : 92,
            'icon'       : 'fab fa-python',
            'color'      : '#3776ab',
        }
    """
    if not ps.skill:                                          # Guard: skip orphaned references
        return None

    meta       = ps.skill.get_display_meta()                  # Resolve {icon, color} from Skill
    skill_type = ''                                           # Default: no category label

    if ps.skill.skill_type:                                   # Dereference SkillType safely
        try:
            skill_type = ps.skill.skill_type.name or ''       # Get category name string
        except Exception:
            skill_type = ''                                   # Handle broken reference silently

    return {
        'skill_name': ps.skill.skill_name or '',              # Official skill display name
        'skill_type': skill_type,                             # Parent category name
        'score'     : int(ps.score or 0),                    # Proficiency score 0-100
        'icon'      : meta.get('icon',  'fas fa-code'),      # FontAwesome icon class
        'color'     : meta.get('color', '#64748b'),           # Hex brand color string
    }


# ─────────────────────────────────────────────────────────────────────────────
# HELPER  calc_progress_pct
# Replaces the inline min(round((current/target)*100)) pattern in 4 goal routes
# ─────────────────────────────────────────────────────────────────────────────
def calc_progress_pct(current_score, target_score):
    """
    Calculates goal progress percentage clamped between 0 and 100.
    Avoids division by zero when target_score is 0 or None.

    Args:
        current_score (int | None): Current achieved score.
        target_score  (int | None): Target score to reach.

    Returns:
        float: Progress percentage rounded to 1 decimal, clamped 0-100.

    Example:
        calc_progress_pct(72, 95)  # -> 75.8
        calc_progress_pct(0, 0)    # -> 0.0
    """
    target  = target_score  or 100                            # Default target to avoid zero div
    current = current_score or 0                              # Default current to zero
    return min(round((current / target) * 100, 1), 100)       # Calculate and clamp at 100%