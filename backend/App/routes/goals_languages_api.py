"""
Portfolio Public API — goals_languages_api.py
==============================================
Endpoints :
    GET /api/portfolio/goals                — career roadmap goals
    GET /api/portfolio/goals/stats          — goals analytics for charts
    GET /api/portfolio/languages            — language proficiency
Author    : HussamAlshawi-Dev
"""

import logging                                                # Error tracking
from flask import Blueprint, jsonify                          # Core Flask utilities
from App.models.profile import Profile                        # Profile model
from App.models.goal    import Goal                           # Career goal model
from App.models.skills  import ProfileSkill                   # Skill scores for goal progress
from App.models.language import Language                      # Language proficiency model


# ── Blueprint registration ────────────────────────────────────────────────────
goals_languages_public_bp = Blueprint('goals_languages_public', __name__)


# ─────────────────────────────────────────────────────────────────────────────
# HELPER  _fmt_date — safely format datetime to ISO string
# ─────────────────────────────────────────────────────────────────────────────
def _fmt_date(dt):
    """Returns ISO string from datetime, or None if missing."""
    try:
        return dt.isoformat() if dt else None
    except Exception:
        return None


# ── Status + Priority colour maps (reused across routes) ─────────────────────
STATUS_COLORS = {
    'Achieved'   : {'bg': '#E1F5EE', 'text': '#0F6E56', 'border': '#9FE1CB'},
    'In Progress': {'bg': '#E6F1FB', 'text': '#185FA5', 'border': '#B5D4F4'},
    'Planned'    : {'bg': '#FAEEDA', 'text': '#854F0B', 'border': '#FAC775'},
    'Paused'     : {'bg': '#F1EFE8', 'text': '#5F5E5A', 'border': '#D3D1C7'},
}

PRIORITY_COLORS = {
    'Critical': {'bg': '#FAECE7', 'text': '#993C1D', 'border': '#F5C4B3'},
    'High'    : {'bg': '#FAEEDA', 'text': '#854F0B', 'border': '#FAC775'},
    'Medium'  : {'bg': '#E6F1FB', 'text': '#185FA5', 'border': '#B5D4F4'},
    'Low'     : {'bg': '#F1EFE8', 'text': '#5F5E5A', 'border': '#D3D1C7'},
}

PROFICIENCY_META = {
    'Native'      : {'score': 100, 'color': '#1D9E75', 'bg': '#E1F5EE', 'icon': '🌍'},
    'Fluent'      : {'score': 85,  'color': '#185FA5', 'bg': '#E6F1FB', 'icon': '💬'},
    'Advanced'    : {'score': 70,  'color': '#534AB7', 'bg': '#EEEDFE', 'icon': '📚'},
    'Intermediate': {'score': 50,  'color': '#854F0B', 'bg': '#FAEEDA', 'icon': '🗣️'},
    'Beginner'    : {'score': 25,  'color': '#5F5E5A', 'bg': '#F1EFE8', 'icon': '🌱'},
}


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/portfolio/goals
# Full career roadmap with required skills and match data
# ─────────────────────────────────────────────────────────────────────────────
@goals_languages_public_bp.route('/portfolio/goals', methods=['GET'])
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
                "progress_pct"   : 76,
                "required_skills": [
                    {
                        "skill_name"   : "Python",
                        "profile_score": 92,
                        "matched"      : true
                    }
                ]
            }
        ]
    }
    """
    try:
        profile = Profile.objects.first()

        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        # Pre-build token score map identical to admin roadmap service
        token_score_map = {}
        for ps in ProfileSkill.objects(profile=profile).select_related():
            if not ps.skill:
                continue
            tokens = ps.skill.skill_name.strip().lower().split()
            for token in tokens:
                if token not in token_score_map or ps.score > token_score_map[token]:
                    token_score_map[token] = ps.score

        goals = Goal.objects(profile=profile).order_by('target_year', '-priority')

        result = []
        for goal in goals:
            target  = goal.target_score  or 100
            current = goal.current_score or 0
            pct     = min(round((current / target) * 100), 100)

            # Build per-skill match list
            skills_data = []
            for skill_name in (goal.required_skills or []):
                if not skill_name:
                    continue
                req_tokens = skill_name.strip().lower().split()
                best_score = 0
                matched    = False
                for token in req_tokens:
                    if token in token_score_map:
                        best_score = token_score_map[token]
                        matched    = True
                        break
                skills_data.append({
                    'skill_name'   : skill_name,
                    'profile_score': best_score,
                    'matched'      : matched,
                })

            # Sort skills: matched first, then by score desc
            skills_data.sort(key=lambda x: (-x['profile_score'], x['skill_name']))

            result.append({
                'id'             : str(goal.id),
                'goal_name'      : goal.goal_name or '',
                'sub_title'      : goal.sub_title  or '',
                'status'         : goal.status     or 'Planned',
                'status_style'   : STATUS_COLORS.get(goal.status or 'Planned',   STATUS_COLORS['Planned']),
                'priority'       : goal.priority   or 'Medium',
                'priority_style' : PRIORITY_COLORS.get(goal.priority or 'Medium', PRIORITY_COLORS['Medium']),
                'target_year'    : goal.target_year,
                'target_score'   : int(target),
                'current_score'  : int(current),
                'progress_pct'   : pct,
                'required_skills': skills_data,
            })

        return jsonify({'count': len(result), 'goals': result}), 200

    except Exception as e:
        logging.error(f'[GOALS API] /portfolio/goals failed: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/portfolio/goals/stats
# Aggregated statistics for roadmap analytics charts
# ─────────────────────────────────────────────────────────────────────────────
@goals_languages_public_bp.route('/portfolio/goals/stats', methods=['GET'])
def get_goals_stats():
    """
    Returns compact statistics about the career roadmap.

    Includes:
        - by_status       : count per status value
        - by_priority     : count per priority value
        - by_year         : average progress per target year
        - avg_progress    : overall average progress %
        - achieved_count  : total achieved goals

    Used by:
        - Roadmap analytics section
        - Status distribution donut chart
        - Year-based bar chart
    """
    try:
        profile = Profile.objects.first()

        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        goals = list(Goal.objects(profile=profile))

        by_status   = {}
        by_priority = {}
        by_year     = {}

        total_pct = 0

        for goal in goals:
            status   = goal.status   or 'Planned'
            priority = goal.priority or 'Medium'
            year     = str(goal.target_year) if goal.target_year else 'Unknown'
            target   = goal.target_score  or 100
            current  = goal.current_score or 0
            pct      = min(round((current / target) * 100), 100)

            by_status[status]     = by_status.get(status, 0)     + 1
            by_priority[priority] = by_priority.get(priority, 0) + 1
            by_year.setdefault(year, []).append(pct)
            total_pct += pct

        # Average progress per year
        year_averages = [
            {
                'year'        : yr,
                'avg_progress': round(sum(vals) / len(vals), 1),
                'count'       : len(vals),
            }
            for yr, vals in sorted(by_year.items())
        ]

        return jsonify({
            'total_goals'   : len(goals),
            'achieved_count': by_status.get('Achieved', 0),
            'avg_progress'  : round(total_pct / len(goals), 1) if goals else 0,
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
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/portfolio/languages
# Language proficiency list with visual tokens
# ─────────────────────────────────────────────────────────────────────────────
@goals_languages_public_bp.route('/portfolio/languages', methods=['GET'])
def get_public_languages():
    """
    Returns all language proficiency records with visual metadata.

    Used by:
        - Languages widget in About / Skills sections
        - Proficiency progress bars
        - Language cards with emoji + color tokens

    Response shape:
    {
        "count": 3,
        "languages": [
            {
                "language_name" : "Arabic",
                "proficiency"   : "Native",
                "level_score"   : 100,
                "color"         : "#1D9E75",
                "bg"            : "#E1F5EE",
                "icon"          : "🌍"
            }
        ]
    }
    """
    try:
        profile = Profile.objects.first()

        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        records = Language.objects(profile=profile).order_by('language_name')

        result = []
        for lang in records:
            meta = PROFICIENCY_META.get(lang.proficiency or '', PROFICIENCY_META['Intermediate'])
            result.append({
                'language_name': lang.language_name or '',
                'proficiency'  : lang.proficiency   or '',
                'level_score'  : meta['score'],
                'color'        : meta['color'],
                'bg'           : meta['bg'],
                'icon'         : meta['icon'],
            })

        return jsonify({'count': len(result), 'languages': result}), 200

    except Exception as e:
        logging.error(f'[LANGUAGES API] /portfolio/languages failed: {str(e)}')
        return jsonify({'error': str(e)}), 500