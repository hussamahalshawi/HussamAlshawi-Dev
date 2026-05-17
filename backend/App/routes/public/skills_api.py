"""
Portfolio Public API — skills_api.py
========================================
Endpoints :
    GET /api/portfolio/skills              — all skill scores grouped by category
    GET /api/portfolio/skills/summary      — top skills + category distribution (for charts)
Purpose   : Feeds the Skills section, radar chart, bar chart, and skill cloud
Author    : HussamAlshawi-Dev
"""

import logging                                                # Error tracking
from flask import Blueprint, jsonify                          # Core Flask utilities
from App.models.profile import Profile                        # Profile model
from App.models.skills  import ProfileSkill, SkillType        # Skill models
from App import cache                            # Import shared cache instance
from App.routes.helpers.route_helpers import build_skill_payload  # Shared helper — replaces local _build_skill_payload
# ── Blueprint registration ────────────────────────────────────────────────────
skills_public_bp = Blueprint('skills_public', __name__)



# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/portfolio/skills
# Full skill list, sorted by score descending, grouped by category
# ─────────────────────────────────────────────────────────────────────────────
@skills_public_bp.route('/portfolio/skills', methods=['GET'])
@cache.cached(timeout=300, key_prefix='public_skills')
def get_public_skills():
    """
    Returns all ProfileSkill scores for the active portfolio profile.
    Results are sorted by score (highest first) and grouped by skill_type.

    Used by:
        - Skills section (full grid of skill cards)
        - Horizontal bar chart (top N skills)
        - Radar chart (average per category)
        - Skill cloud / tag cloud widget

    Response shape:
    {
        "count": 24,
        "skills": [
            {
                "skill_name" : "Python",
                "skill_type" : "Backend Development",
                "score"      : 92,
                "icon"       : "fab fa-python",
                "color"      : "#3776ab"
            },
            ...
        ],
        "grouped": {
            "Backend Development": [ {...}, {...} ],
            "Frontend"           : [ {...} ],
            ...
        },
        "categories": ["Backend Development", "Frontend", "DevOps", ...]
    }
    """
    try:
        profile = Profile.objects.first()                     # Fetch the single portfolio profile

        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        # Fetch all ProfileSkill docs with related Skill and SkillType in one query
        raw_skills = ProfileSkill.objects(profile=profile).select_related()

        # Build serialisable list, dropping broken references
        skills_list = [p for p in (build_skill_payload(ps) for ps in raw_skills) if p]

        # Sort: highest score first
        skills_list.sort(key=lambda x: x['score'], reverse=True)

        # Group by skill_type for easy frontend rendering
        grouped = {}
        for skill in skills_list:
            cat = skill['skill_type'] or 'Other'
            grouped.setdefault(cat, []).append(skill)

        return jsonify({
            'count'     : len(skills_list),
            'skills'    : skills_list,
            'grouped'   : grouped,
            'categories': list(grouped.keys()),
        }), 200

    except Exception as e:
        logging.error(f'[SKILLS API] /portfolio/skills failed: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/portfolio/skills/summary
# Lightweight summary for overview widgets and charts
# ─────────────────────────────────────────────────────────────────────────────
@skills_public_bp.route('/portfolio/skills/summary', methods=['GET'])
@cache.cached(timeout=300, key_prefix='public_skills_summary')
def get_skills_summary():
    """
    Returns a compact summary designed for dashboard-style widgets.

    Includes:
        - top_skills      : Top 10 skills by score (for bar / progress charts)
        - category_averages: Average score per skill category (for radar chart)
        - distribution    : Count of skills in each proficiency band (for donut)
        - total_skills    : Overall count

    Response shape:
    {
        "total_skills"       : 24,
        "top_skills"         : [ { "skill_name": "Python", "score": 92, "icon": "...", "color": "..." }, ... ],
        "category_averages"  : [ { "category": "Backend", "avg_score": 85, "count": 6 }, ... ],
        "distribution"       : {
            "expert"     : 4,   // 80-100
            "advanced"   : 7,   // 60-79
            "intermediate": 8,  // 40-59
            "beginner"   : 5    // 0-39
        }
    }
    """
    try:
        profile = Profile.objects.first()

        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        raw_skills  = ProfileSkill.objects(profile=profile).select_related()
        skills_list = [p for p in (build_skill_payload(ps) for ps in raw_skills) if p]
        skills_list.sort(key=lambda x: x['score'], reverse=True)

        # ── Top 10 skills ─────────────────────────────────────────────────────
        top_skills = [
            {
                'skill_name': s['skill_name'],
                'score'     : s['score'],
                'icon'      : s['icon'],
                'color'     : s['color'],
                'skill_type': s['skill_type'],
            }
            for s in skills_list[:10]
        ]

        # ── Category averages (for radar chart) ────────────────────────────
        cat_map = {}
        for s in skills_list:
            cat = s['skill_type'] or 'Other'
            cat_map.setdefault(cat, []).append(s['score'])

        category_averages = [
            {
                'category' : cat,
                'avg_score': round(sum(scores) / len(scores), 1),
                'count'    : len(scores),
            }
            for cat, scores in sorted(cat_map.items(), key=lambda x: -sum(x[1]) / len(x[1]))
        ]

        # ── Score distribution bands ────────────────────────────────────────
        distribution = {
            'expert'      : sum(1 for s in skills_list if s['score'] >= 80),   # 80-100
            'advanced'    : sum(1 for s in skills_list if 60 <= s['score'] < 80),  # 60-79
            'intermediate': sum(1 for s in skills_list if 40 <= s['score'] < 60),  # 40-59
            'beginner'    : sum(1 for s in skills_list if s['score'] < 40),    # 0-39
        }

        return jsonify({
            'total_skills'      : len(skills_list),
            'top_skills'        : top_skills,
            'category_averages' : category_averages,
            'distribution'      : distribution,
        }), 200

    except Exception as e:
        logging.error(f'[SKILLS API] /portfolio/skills/summary failed: {str(e)}')
        return jsonify({'error': str(e)}), 500