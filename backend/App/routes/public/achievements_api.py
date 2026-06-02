"""
Portfolio Public API — achievements_api.py
===========================================
Endpoints:
    GET /api/portfolio/achievements  — awards and professional recognitions

Extracted from:
    - education_courses_api.py (GET /portfolio/achievements)

Author: HussamAlshawi-Dev
"""

import logging                                                        # Error tracking
from flask import Blueprint, jsonify                                  # Core Flask utilities
from App import cache                                                 # Cache decorator
from App.models.achievement import Achievement                        # Awards model
from App.routes.helpers.route_helpers import get_profile, fmt_date   # Shared helpers — no duplication


# ── Blueprint registration ────────────────────────────────────────────────────
achievements_public_bp = Blueprint('achievements_public', __name__)   # Blueprint name for url_for()


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/portfolio/achievements
# ─────────────────────────────────────────────────────────────────────────────
@achievements_public_bp.route('/portfolio/achievements', methods=['GET'])
@cache.cached(timeout=300)
def get_achievements():
    """
    Returns all awards and professional recognitions.

    Used by:
        - Achievements section (cards / timeline)
        - Award badges in the hero/about section

    Response shape:
    {
        "count": 5,
        "achievements": [
            {
                "id"                   : "...",
                "title"                : "Best Developer Award 2023",
                "issuing_organization" : "TechConf",
                "description"          : "...",
                "evidence_url"         : "https://...",
                "date_obtained"        : "2023-11-01T00:00:00",
                "skills_demonstrated"  : ["Python", "Leadership"],
                "media"                : {
                    "certificate_image": "https://...",
                    "evidence_photos"  : [],
                    "evidence_video"   : null
                }
            }
        ]
    }
    """
    try:
        profile = get_profile()                                        # Fetch active profile via shared helper

        if not profile:
            return jsonify({'error': 'Profile not found'}), 404        # Guard: no profile configured

        records = Achievement.objects(profile=profile).order_by('-date_obtained').only(
    'title', 'issuing_organization', 'description', 'evidence_url',
    'date_obtained', 'skills_demonstrated',
    'certificate_image', 'evidence_photos', 'evidence_video',
)

        result = []
        for ach in records:
            result.append({
                'id'                   : str(ach.id),                  # MongoDB ObjectId as string
                'title'                : ach.title                or '',  # Achievement title
                'issuing_organization' : ach.issuing_organization or '',  # Issuer name
                'description'          : ach.description          or '',  # Free-text description
                'evidence_url'         : ach.evidence_url         or None,  # Evidence link
                'date_obtained'        : fmt_date(ach.date_obtained),    # ISO string via shared helper
                'skills_demonstrated'  : list(ach.skills_demonstrated or []),  # Skills shown
                'media': {
                    'certificate_image': ach.certificate_image or None,   # Certificate image URL
                    'evidence_photos'  : list(ach.evidence_photos or []), # Gallery URLs
                    'evidence_video'   : ach.evidence_video or None,      # Video URL
                },
            })

        return jsonify({'count': len(result), 'achievements': result}), 200  # Return achievements

    except Exception as e:
        logging.error(f'[ACHIEVEMENTS API] /portfolio/achievements failed: {str(e)}')
        return jsonify({'error': str(e)}), 500                         # Return error with details