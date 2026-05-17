"""
Shared Route Helpers — route_helpers.py
========================================
Single source of truth for all utility functions shared across route files.

Replaces:
    - _fmt_date     duplicated in 4 files
    - _get_profile  duplicated in 3 files
    - _build_token_map  duplicated in 3 files (goals.py, goals_languages_api, goals_charts_api)
    - _build_skill_payload / _skill_payload  duplicated in skills_api + skills_charts_api

Usage:
    from App.routes.helpers.route_helpers import fmt_date, get_profile, build_token_map, build_skill_payload

Author: HussamAlshawi-Dev
"""

from App.models.profile import Profile                             # Profile model — ownership anchor
from App.models.skills  import ProfileSkill                        # Skill scores for token map


# ─────────────────────────────────────────────────────────────────────────────
# HELPER  fmt_date
# Safely converts a datetime object to an ISO-format string.
# ─────────────────────────────────────────────────────────────────────────────
def fmt_date(dt):
    """
    Converts a datetime to an ISO 8601 string.
    Returns None if the value is missing or conversion fails.

    Args:
        dt (datetime | None): Any datetime object.

    Returns:
        str | None: ISO string e.g. '2023-06-15T00:00:00', or None.

    Example:
        fmt_date(edu.start_date)  # → '2021-09-01T00:00:00'
        fmt_date(None)            # → None
    """
    try:
        return dt.isoformat() if dt else None                      # Convert or return None safely
    except Exception:
        return None                                                # Guard: broken datetime object


# ─────────────────────────────────────────────────────────────────────────────
# HELPER  get_profile
# Fetches the first (active) portfolio Profile document.
# ─────────────────────────────────────────────────────────────────────────────
def get_profile():
    """
    Fetches the single active portfolio Profile from MongoDB.
    All portfolio data is anchored to this profile.

    Returns:
        Profile | None: The first Profile document, or None if not configured.

    Example:
        profile = get_profile()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404
    """
    return Profile.objects.first()                                 # Single portfolio profile pattern


# ─────────────────────────────────────────────────────────────────────────────
# HELPER  build_token_map
# Builds a {token: best_score} dict from all ProfileSkill documents.
# Used for skill-gap analysis and goal progress matching.
# ─────────────────────────────────────────────────────────────────────────────
def build_token_map(profile):
    """
    Builds a token-to-score map from all ProfileSkill documents for a given profile.

    Tokenization strategy:
        - Each ProfileSkill name is split into individual words (tokens).
        - e.g. "Linear Algebra" → {"linear": 68, "algebra": 68}
        - If the same token appears in multiple skills, the highest score wins.

    This map is then used in goal matching:
        - Required skill tokens are checked against the map.
        - First matching token wins — prevents double-counting.

    Args:
        profile (Profile): The active portfolio profile document.

    Returns:
        dict: {token_str (str): best_score (int)}

    Example:
        token_map = build_token_map(profile)
        score = token_map.get('python', 0)  # → 92
    """
    token_map = {}                                                 # {token: best_score}

    for ps in ProfileSkill.objects(profile=profile).select_related():
        if not ps.skill:
            continue                                               # Skip orphaned references

        tokens = ps.skill.skill_name.strip().lower().split()      # Tokenize the skill name

        for token in tokens:
            # Keep the highest score per token across all ProfileSkill docs
            if token not in token_map or ps.score > token_map[token]:
                token_map[token] = ps.score                        # Map token → best score

    return token_map                                               # Return completed map


# ─────────────────────────────────────────────────────────────────────────────
# HELPER  resolve_skill_score
# Resolves the best matching score for a required skill name from a token map.
# Used by goals and charts routes after build_token_map() is called.
# ─────────────────────────────────────────────────────────────────────────────
def resolve_skill_score(skill_name, token_map):
    """
    Looks up the best score for a required skill name using token matching.
    First matching token wins — no double-counting.

    Args:
        skill_name (str): Required skill name from a Goal (e.g. 'Linear Algebra').
        token_map  (dict): Pre-built {token: score} map from build_token_map().

    Returns:
        tuple: (score: int, matched: bool)
            - score   → the profile score for the matched skill, 0 if no match.
            - matched → True if any token from the skill name was found in map.

    Example:
        score, matched = resolve_skill_score('Linear Algebra', token_map)
        # → (68, True) if 'linear' is in token_map with score 68
        # → (0, False) if no token matched
    """
    req_tokens = skill_name.strip().lower().split()                # Tokenize the required skill

    for token in req_tokens:
        if token in token_map:
            return token_map[token], True                          # First match wins

    return 0, False                                                # No match found


# ─────────────────────────────────────────────────────────────────────────────
# HELPER  build_skill_payload
# Converts a ProfileSkill document into a serialisable dict.
# Shared between skills_api.py and skills_charts_api.py.
# ─────────────────────────────────────────────────────────────────────────────
def build_skill_payload(ps):
    """
    Converts a ProfileSkill MongoEngine document into a plain serialisable dict.
    Resolves icon, color, and category name from linked references.

    Args:
        ps (ProfileSkill): A single ProfileSkill document (must have .skill populated).

    Returns:
        dict | None: Serialised skill payload, or None if skill reference is broken.

    Example:
        payload = build_skill_payload(ps)
        # → {'skill_name': 'Python', 'skill_type': 'Backend', 'score': 92, ...}
        # → None if ps.skill is missing or broken
    """
    if not ps.skill:                                               # Skip orphaned references
        return None

    meta       = ps.skill.get_display_meta()                       # Resolve {icon, color} from skill
    skill_type = ''                                                # Default: no category

    if ps.skill.skill_type:                                        # Dereference SkillType safely
        try:
            skill_type = ps.skill.skill_type.name or ''
        except Exception:
            skill_type = ''                                        # Handle broken reference silently

    return {
        'skill_name': ps.skill.skill_name or '',                   # Official skill name
        'skill_type': skill_type,                                  # Parent category label
        'score'     : int(ps.score or 0),                         # Proficiency score 0–100
        'icon'      : meta.get('icon',  'fas fa-code'),           # FontAwesome class string
        'color'     : meta.get('color', '#64748b'),                # Hex brand color
    }


# ─────────────────────────────────────────────────────────────────────────────
# HELPER  calc_months
# Calculates the duration in months between two datetime objects.
# Shared between career_charts_api.py and experience_projects_api.py.
# ─────────────────────────────────────────────────────────────────────────────
def calc_months(start, end=None):
    """
    Calculates the approximate number of months between start and end.
    Falls back to now if end is None (used for current roles).

    Args:
        start (datetime): Start date.
        end   (datetime | None): End date; defaults to now (UTC) if not provided.

    Returns:
        int: Duration in months, minimum 0.

    Example:
        calc_months(exp.start_date, exp.end_date)  # → 27
        calc_months(exp.start_date)                # → months until now (current role)
    """
    from datetime import datetime, timezone                        # Import here to keep module clean

    if not start:
        return 0                                                   # Guard: no start date

    now    = datetime.now(timezone.utc)                            # Current UTC time
    end_dt = end if end else now                                   # Default to now for current roles

    # Make both timezone-aware to allow subtraction
    if start.tzinfo  is None: start  = start.replace(tzinfo=timezone.utc)
    if end_dt.tzinfo is None: end_dt = end_dt.replace(tzinfo=timezone.utc)

    return max(0, round((end_dt - start).days / 30.44))            # Approximate months from days


# ─────────────────────────────────────────────────────────────────────────────
# HELPER  calc_progress_pct
# Calculates a clamped progress percentage from current/target values.
# Shared across goals, dashboard, and charts routes.
# ─────────────────────────────────────────────────────────────────────────────
def calc_progress_pct(current_score, target_score):
    """
    Calculates progress percentage toward a target, clamped at 100%.

    Args:
        current_score (int | float): Current achieved score.
        target_score  (int | float): Target/maximum score.

    Returns:
        int: Percentage 0–100 (never negative, never above 100).

    Example:
        calc_progress_pct(72, 95)   # → 76
        calc_progress_pct(100, 80)  # → 100  (clamped)
        calc_progress_pct(0, 0)     # → 0    (safe division by zero)
    """
    target  = target_score  or 100                                 # Avoid division by zero
    current = current_score or 0                                   # Default to 0

    return min(round((current / target) * 100), 100)               # Calculate and clamp