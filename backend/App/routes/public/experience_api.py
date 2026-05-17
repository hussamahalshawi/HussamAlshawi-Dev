"""
Portfolio Public API — experience_api.py
==========================================
Endpoints:
    GET /api/portfolio/experience           — full work history
    GET /api/portfolio/experience/timeline  — compact timeline format

Extracted from:
    - experience_projects_api.py

Author: HussamAlshawi-Dev
"""

import logging                                                        # Error tracking
from datetime import datetime, timezone                               # Date utilities for duration calc
from flask import Blueprint, jsonify                                  # Core Flask utilities
from App.models.experience import Experience                          # Work history model
from App import cache                                                 # Shared RAM cache instance
from App.routes.helpers.route_helpers import get_profile, fmt_date   # Shared helpers — no duplication


# ── Blueprint registration ────────────────────────────────────────────────────
experience_public_bp = Blueprint('experience_public', __name__)       # Blueprint name for url_for()


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/portfolio/experience
# ─────────────────────────────────────────────────────────────────────────────
@experience_public_bp.route('/portfolio/experience', methods=['GET'])
@cache.cached(timeout=300, key_prefix='public_experience')            # Cache 5 min in RAM
def get_experience():
    """
    Returns all professional experience records for the active portfolio.
    Sorted by is_current descending then start_date descending.

    Used by:
        - Experience / Career section
        - Timeline chart (horizontal or vertical)
        - Skills-used breakdown per role

    Response shape:
    {
        "count": 4,
        "experience": [
            {
                "id"             : "...",
                "job_title"      : "Senior Python Developer",
                "company_name"   : "Acme Corp",
                "employment_type": "Full-time",
                "location"       : "Remote",
                "company_url"    : "https://...",
                "description"    : "...",
                "is_current"     : false,
                "start_date"     : "2021-03-01T00:00:00",
                "end_date"       : "2023-06-01T00:00:00",
                "duration_months": 27,
                "skills_acquired": ["Python", "Flask", "Docker"],
                "media"          : {
                    "certificate_image" : "https://...",
                    "experience_images" : ["https://..."],
                    "experience_video"  : null
                }
            }
        ]
    }
    """
    try:
        profile = get_profile()                                        # Fetch active profile via shared helper

        if not profile:
            return jsonify({'error': 'Profile not found'}), 404        # Guard: no profile configured

        records = Experience.objects(profile=profile).order_by('-is_current', '-start_date')  # Current roles first

        result = []
        for exp in records:
            # Calculate duration in months safely
            duration = 0
            if exp.start_date:
                end   = exp.end_date if exp.end_date else datetime.now(timezone.utc)  # Use now for current roles
                start = exp.start_date

                # Make both datetimes timezone-aware before subtraction
                if start.tzinfo is None:
                    start = start.replace(tzinfo=timezone.utc)         # Attach UTC timezone to naive datetime
                if end.tzinfo is None:
                    end = end.replace(tzinfo=timezone.utc)             # Attach UTC timezone to naive datetime

                duration = max(0, round((end - start).days / 30.44))  # Approximate months from days

            result.append({
                'id'             : str(exp.id),                        # MongoDB ObjectId as string
                'job_title'      : exp.job_title      or '',           # Role title
                'company_name'   : exp.company_name   or '',           # Employer name
                'employment_type': exp.employment_type or '',          # Full-time / Freelance / etc.
                'location'       : exp.location        or '',          # City or Remote
                'company_url'    : exp.company_url     or None,        # Company website URL
                'description'    : exp.description     or '',          # Role description
                'is_current'     : bool(exp.is_current),               # True if still in this role
                'start_date'     : fmt_date(exp.start_date),           # ISO string via shared helper
                'end_date'       : fmt_date(exp.end_date),             # ISO string via shared helper
                'duration_months': duration,                           # Calculated duration in months
                'skills_acquired': list(exp.skills_acquired or []),    # Technologies used
                'media': {
                    'certificate_image' : exp.certificate_image or None,     # Certificate URL
                    'experience_images' : list(exp.experience_images or []), # Gallery URLs
                    'experience_video'  : exp.experience_video or None,      # Video URL
                },
            })

        return jsonify({'count': len(result), 'experience': result}), 200  # Return experience payload

    except Exception as e:
        logging.error(f'[EXPERIENCE API] /portfolio/experience failed: {str(e)}')
        return jsonify({'error': str(e)}), 500                         # Return error with details


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/portfolio/experience/timeline
# Compact timeline format for visual timeline components
# ─────────────────────────────────────────────────────────────────────────────
@experience_public_bp.route('/portfolio/experience/timeline', methods=['GET'])
def get_experience_timeline():
    """
    Returns a compact timeline-oriented payload ideal for animated
    vertical/horizontal timeline components on the portfolio frontend.

    Response shape:
    {
        "timeline": [
            {
                "id"        : "...",
                "label"     : "Senior Dev @ Acme",
                "year_start": 2021,
                "year_end"  : 2023,
                "is_current": false,
                "skills"    : ["Python", "Docker"]
            }
        ]
    }
    """
    try:
        profile = get_profile()                                        # Fetch active profile via shared helper

        if not profile:
            return jsonify({'error': 'Profile not found'}), 404        # Guard: no profile configured

        records  = Experience.objects(profile=profile).order_by('-is_current', '-start_date')

        timeline = []
        for exp in records:
            timeline.append({
                'id'        : str(exp.id),                             # MongoDB ObjectId as string
                'label'     : f"{exp.job_title or ''} @ {exp.company_name or ''}".strip(' @'),
                'job_title' : exp.job_title    or '',                  # Role title
                'company'   : exp.company_name or '',                  # Employer name
                'location'  : exp.location     or '',                  # City or Remote
                'year_start': exp.start_date.year if exp.start_date else None,  # Start year integer
                'year_end'  : exp.end_date.year   if exp.end_date   else None,  # End year integer
                'is_current': bool(exp.is_current),                    # True if still in this role
                'skills'    : list(exp.skills_acquired or []),         # Technologies used
            })

        return jsonify({'timeline': timeline}), 200                    # Return compact timeline

    except Exception as e:
        logging.error(f'[EXPERIENCE API] /portfolio/experience/timeline failed: {str(e)}')
        return jsonify({'error': str(e)}), 500                         # Return error with details