"""
Portfolio Public API — goals_api.py
=====================================
Endpoints:
    GET /api/portfolio/goals        — career roadmap goals with skill match data
    GET /api/portfolio/goals/stats  — aggregated goals statistics for charts

Merged from:
    - goals.py              (original GET /goals — admin route)
    - goals_languages_api.py (GET /portfolio/goals and /portfolio/goals/stats)

Helpers imported from App.routes.helpers.route_helpers (no local duplication):
    - get_profile, build_token_map, resolve_skill_score, calc_progress_pct

Author: HussamAlshawi-Dev
"""

import logging                                                        # Error tracking
from flask import Blueprint, jsonify                                  # Core Flask utilities
from App import cache                                                 # Cache decorator
from App.models.goal    import Goal                                   # Career goal model
from App.routes.helpers.route_helpers import (                        # Shared helpers — no duplication
    get_profile,
    build_token_map,
    resolve_skill_score,
    calc_progress_pct,
)


# ── Blueprint registration ────────────────────────────────────────────────────
goals_public_bp = Blueprint('goals_public', __name__)                 # Blueprint name for url_for()


# ── Status + Priority colour maps ─────────────────────────────────────────────
STATUS_COLORS = {                                                      # Visual tokens per status value
    'Achieved'   : {'bg': '#E1F5EE', 'text': '#0F6E56', 'border': '#9FE1CB'},
    'In Progress': {'bg': '#E6F1FB', 'text': '#185FA5', 'border': '#B5D4F4'},
    'Planned'    : {'bg': '#FAEEDA', 'text': '#854F0B', 'border': '#FAC775'},
    'Paused'     : {'bg': '#F1EFE8', 'text': '#5F5E5A', 'border': '#D3D1C7'},
}

PRIORITY_COLORS = {                                                    # Visual tokens per priority value
    'Critical': {'bg': '#FAECE7', 'text': '#993C1D', 'border': '#F5C4B3'},
    'High'    : {'bg': '#FAEEDA', 'text': '#854F0B', 'border': '#FAC775'},
    'Medium'  : {'bg': '#E6F1FB', 'text': '#185FA5', 'border': '#B5D4F4'},
    'Low'     : {'bg': '#F1EFE8', 'text': '#5F5E5A', 'border': '#D3D1C7'},
}


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/portfolio/goals
# Full career roadmap with required skills and match data
# ─────────────────────────────────────────────────────────────────────────────
@goals_public_bp.route('/portfolio/goals', methods=['GET'])
@cache.cached(timeout=300)
def get_public_goals():
    """
    Returns all career roadmap goals with per-skill match data and
    visual colour tokens for rendering status/priority badges.

    Used by:
        - Career Roadmap section (timeline / card grid)
        - Roadmap progress chart
        - Goal detail modal

    Response shape:
    {
        "count": 8,
        "goals": [
            {
                "id"             : "...",
                "goal_name"      : "Senior Python Developer",
                "sub_title"      : "Mastering Scalable Systems",
                "status"         : "In Progress",
                "status_style"   : { "bg": "#E6F1FB", "text": "#185FA5", "border": "#B5D4F4" },
                "priority"       : "Critical",
                "priority_style" : { "bg": "#FAECE7", "text": "#993C1D", "border": "#F5C4B3" },
                "target_year"    : 2025,
                "target_score"   : 95,
                "current_score"  : 72,
                "progress_pct"   : 75.8,
                "required_skills": [
                    { "skill_name": "Python", "profile_score": 92, "matched": true }
                ]
            }
        ]
    }
    """
    try:
        profile = get_profile()                                        # Fetch active profile via shared helper

        if not profile:
            return jsonify({'error': 'Profile not found'}), 404        # Guard: no profile configured

        token_map = build_token_map(profile)                           # Build token score map via shared helper

        goals = Goal.objects(profile=profile).order_by('target_year', '-priority').only(
    'goal_name', 'sub_title', 'status', 'priority',
    'target_year', 'target_score', 'current_score', 'required_skills',
)

        result = []
        for goal in goals:
            pct = calc_progress_pct(goal.current_score, goal.target_score)  # Progress % via shared helper

            # Build per-skill match list for this goal
            skills_data = []
            for skill_name in (goal.required_skills or []):
                if not skill_name:
                    continue                                            # Skip empty entries

                best_score, matched = resolve_skill_score(skill_name, token_map)  # Match via shared helper

                skills_data.append({
                    'skill_name'   : skill_name,                       # Original name from goal
                    'profile_score': best_score,                       # 0 if no match found
                    'matched'      : matched,                          # True if any token matched
                })

            # Sort skills: highest score first, then alphabetically
            skills_data.sort(key=lambda x: (-x['profile_score'], x['skill_name']))

            result.append({
                'id'             : str(goal.id),                       # MongoDB ObjectId as string
                'goal_name'      : goal.goal_name or '',               # Goal display name
                'sub_title'      : goal.sub_title  or '',              # Optional subtitle
                'status'         : goal.status     or 'Planned',       # Status enum value
                'status_style'   : STATUS_COLORS.get(goal.status or 'Planned', STATUS_COLORS['Planned']),
                'priority'       : goal.priority   or 'Medium',        # Priority enum value
                'priority_style' : PRIORITY_COLORS.get(goal.priority or 'Medium', PRIORITY_COLORS['Medium']),
                'target_year'    : goal.target_year,                   # Target achievement year
                'target_score'   : int(goal.target_score  or 100),     # Target proficiency score
                'current_score'  : int(goal.current_score or 0),       # Current calculated score
                'progress_pct'   : pct,                                # Percentage toward target
                'required_skills': skills_data,                        # Skills with match results
            })

        return jsonify({'count': len(result), 'goals': result}), 200   # Return goals payload

    except Exception as e:
        logging.error(f'[GOALS API] /portfolio/goals failed: {str(e)}')
        return jsonify({'error': str(e)}), 500                         # Return error with details


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/portfolio/goals/stats
# Aggregated statistics for roadmap analytics charts
# ─────────────────────────────────────────────────────────────────────────────
@goals_public_bp.route('/portfolio/goals/stats', methods=['GET'])
@cache.cached(timeout=300)
def get_goals_stats():
    """
    Returns compact statistics about the career roadmap.

    Includes:
        - by_status       : count per status value
        - by_priority     : count per priority value
        - by_year         : average progress per target year
        - avg_progress    : overall average progress percentage
        - achieved_count  : total number of achieved goals

    Used by:
        - Roadmap analytics section
        - Status distribution donut chart
        - Year-based progress bar chart

    Response shape:
    {
        "total_goals"   : 8,
        "achieved_count": 3,
        "avg_progress"  : 65.2,
        "by_status"     : [ { "status": "Achieved", "count": 3, "style": {...} } ],
        "by_priority"   : [ { "priority": "Critical", "count": 2, "style": {...} } ],
        "by_year"       : [ { "year": "2025", "avg_progress": 72.1, "count": 4 } ]
    }
    """
    try:
        profile = get_profile()                                        # Fetch active profile via shared helper

        if not profile:
            return jsonify({'error': 'Profile not found'}), 404        # Guard: no profile configured

        goals = list(Goal.objects(profile=profile).only(
            'status', 'priority', 'target_year', 'target_score', 'current_score',
        ))

        by_status   = {}                                               # Accumulate count per status
        by_priority = {}                                               # Accumulate count per priority
        by_year     = {}                                               # Accumulate progress per year
        total_pct   = 0                                                # Sum for overall average

        for goal in goals:
            status   = goal.status   or 'Planned'                      # Default to Planned if missing
            priority = goal.priority or 'Medium'                       # Default to Medium if missing
            year     = str(goal.target_year) if goal.target_year else 'Unknown'  # Year as string key
            pct      = calc_progress_pct(goal.current_score, goal.target_score)  # Progress %

            by_status[status]     = by_status.get(status, 0)     + 1  # Increment status count
            by_priority[priority] = by_priority.get(priority, 0) + 1  # Increment priority count
            by_year.setdefault(year, []).append(pct)                   # Append pct to year bucket
            total_pct += pct                                           # Add to overall total

        # Average progress per year — sorted chronologically
        year_averages = [
            {
                'year'        : yr,
                'avg_progress': round(sum(vals) / len(vals), 1),       # Mean progress for the year
                'count'       : len(vals),                             # Number of goals in this year
            }
            for yr, vals in sorted(by_year.items())
        ]

        return jsonify({
            'total_goals'   : len(goals),
            'achieved_count': by_status.get('Achieved', 0),            # Count of achieved goals
            'avg_progress'  : round(total_pct / len(goals), 1) if goals else 0,  # Overall average
            'by_status'     : [
                {'status': k, 'count': v, 'style': STATUS_COLORS.get(k, {})}
                for k, v in by_status.items()
            ],
            'by_priority'   : [
                {'priority': k, 'count': v, 'style': PRIORITY_COLORS.get(k, {})}
                for k, v in by_priority.items()
            ],
            'by_year'       : year_averages,
        }), 200

    except Exception as e:
        logging.error(f'[GOALS API] /portfolio/goals/stats failed: {str(e)}')
        return jsonify({'error': str(e)}), 500                         # Return error with details