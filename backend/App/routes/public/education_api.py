"""
Portfolio Public API — education_api.py
=========================================
Endpoints:
    GET /api/portfolio/education   — academic history sorted by start_date desc

Extracted from:
    - education_courses_api.py (GET /portfolio/education)

Author: HussamAlshawi-Dev
"""

import logging                                                        # Error tracking
from flask import Blueprint, jsonify                                  # Core Flask utilities
from App import cache                                                 # Cache decorator
from App.models.education import Education                            # Academic records model
from App.routes.helpers.route_helpers import get_profile, fmt_date   # Shared helpers — no duplication


# ── Blueprint registration ────────────────────────────────────────────────────
education_public_bp = Blueprint('education_public', __name__)         # Blueprint name for url_for()


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/portfolio/education
# ─────────────────────────────────────────────────────────────────────────────
@education_public_bp.route('/portfolio/education', methods=['GET'])
@cache.cached(timeout=300)
def get_education():
    """
    Returns all academic records sorted by start_date descending.

    Used by:
        - Education section / academic timeline
        - Degree badges in the About section
        - GPA / grade display

    Response shape:
    {
        "count": 2,
        "education": [
            {
                "id"             : "...",
                "institution"    : "Jordan University",
                "degree"         : "Bachelor's",
                "major"          : "Computer Science",
                "grade"          : "Excellent — GPA 3.9",
                "description"    : "...",
                "start_date"     : "2017-09-01T00:00:00",
                "end_date"       : "2021-06-01T00:00:00",
                "skills_learned" : ["Python", "Algorithms"],
                "media"          : {
                    "certificate_image" : "https://...",
                    "education_photos"  : ["https://..."],
                    "education_video"   : null
                }
            }
        ]
    }
    """
    try:
        profile = get_profile()                                        # Fetch active profile via shared helper

        if not profile:
            return jsonify({'error': 'Profile not found'}), 404        # Guard: no profile configured

        records = Education.objects(profile=profile).order_by('-start_date').only(
    'institution', 'degree', 'major', 'grade', 'description',
    'start_date', 'end_date', 'skills_learned',
    'certificate_image', 'education_photos', 'education_video',
)

        result = []
        for edu in records:
            result.append({
                'id'            : str(edu.id),                         # MongoDB ObjectId as string
                'institution'   : edu.institution or '',               # University / school name
                'degree'        : edu.degree      or '',               # Degree type
                'major'         : edu.major        or '',              # Field of study
                'grade'         : edu.grade        or '',              # GPA / grade label
                'description'   : edu.description  or '',              # Free-text description
                'start_date'    : fmt_date(edu.start_date),            # ISO string via shared helper
                'end_date'      : fmt_date(edu.end_date),              # ISO string via shared helper
                'skills_learned': list(edu.skills_learned or []),      # Skills learned list
                'media': {
                    'certificate_image': edu.certificate_image or None,    # Certificate URL
                    'education_photos' : list(edu.education_photos or []), # Gallery URLs
                    'education_video'  : edu.education_video or None,      # Video URL
                },
            })

        return jsonify({'count': len(result), 'education': result}), 200  # Return education payload

    except Exception as e:
        logging.error(f'[EDUCATION API] /portfolio/education failed: {str(e)}')
        return jsonify({'error': str(e)}), 500                         # Return error with details