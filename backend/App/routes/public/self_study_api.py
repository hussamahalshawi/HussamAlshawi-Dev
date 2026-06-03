"""
Portfolio Public API — self_study_api.py
==========================================
Endpoints:
    GET /api/portfolio/self-study  — independent learning activities

Extracted from:
    - education_courses_api.py (GET /portfolio/self-study)

Author: HussamAlshawi-Dev
"""

import logging                                                        # Error tracking
from flask import Blueprint, jsonify, request                         # Core Flask utilities
from App import cache                                                 # Cache decorator
from App.models.self_study import SelfStudy                           # Self-learning model
from App.routes.helpers.route_helpers import get_profile, fmt_date   # Shared helpers — no duplication


# ── Blueprint registration ────────────────────────────────────────────────────
self_study_public_bp = Blueprint('self_study_public', __name__)       # Blueprint name for url_for()


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/portfolio/self-study
# ─────────────────────────────────────────────────────────────────────────────
@self_study_public_bp.route('/portfolio/self-study', methods=['GET'])
@cache.cached(timeout=300)
def get_self_study():
    """
    Returns all independent learning activities (books, articles, workshops).

    Query params (optional):
        type : Filter by learning_type (e.g., ?type=Book)

    Used by:
        - Self-study / Reading list section
        - Learning type distribution chart (donut)

    Response shape:
    {
        "count"     : 14,
        "types"     : ["Book", "Course", "Article", "Workshop"],
        "self_study": [
            {
                "id"            : "...",
                "title"         : "Clean Code",
                "platform_name" : "O'Reilly",
                "learning_type" : "Book",
                "track"         : "Software Engineering",
                "summary"       : "...",
                "source_url"    : "https://...",
                "cover_image"   : "https://...",
                "start_date"    : "2022-04-01T00:00:00",
                "end_date"      : "2022-05-15T00:00:00",
                "skills_learned": ["Clean Code", "Refactoring"]
            }
        ]
    }
    """
    try:
        profile = get_profile()                                        # Fetch active profile via shared helper

        if not profile:
            return jsonify({'error': 'Profile not found'}), 404        # Guard: no profile configured

        records     = SelfStudy.objects(profile=profile).order_by('-created_at').only(
    'title', 'platform_name', 'learning_type', 'track',
    'summary', 'source_url', 'cover_image',
    'start_date', 'end_date', 'skills_learned',
).select_related()
        type_filter = request.args.get('type', '').strip()             # Optional type filter

        result   = []                                                  # Items to return
        type_set = set()                                               # Collect unique learning types

        for item in records:
            if item.learning_type:
                type_set.add(item.learning_type)                       # Track for filter tabs

            # Apply type filter if provided
            if type_filter and (item.learning_type or '').lower() != type_filter.lower():
                continue                                               # Skip non-matching types

            # Resolve track/category name safely from linked reference
            track_name = ''
            if item.track:
                try:
                    track_name = item.track.name or ''                 # Dereference Category document
                except Exception:
                    track_name = ''                                    # Handle broken reference

            result.append({
                'id'            : str(item.id),                        # MongoDB ObjectId as string
                'title'         : item.title         or '',            # Book / article title
                'platform_name' : item.platform_name or '',            # Platform e.g. O'Reilly
                'learning_type' : item.learning_type or '',            # Book / Article / Workshop
                'track'         : track_name,                          # Resolved category/track name
                'summary'       : item.summary       or '',            # Brief summary
                'source_url'    : item.source_url    or None,          # Link to source
                'cover_image'   : item.cover_image   or None,          # Cover image URL
                'start_date'    : fmt_date(item.start_date),           # ISO string via shared helper
                'end_date'      : fmt_date(item.end_date),             # ISO string via shared helper
                'skills_learned': list(item.skills_learned or []),     # Skills gained
            })

        return jsonify({
            'count'     : len(result),                                 # Total returned items
            'types'     : sorted(type_set),                            # Alphabetical type list
            'self_study': result,                                      # Filtered items array
        }), 200

    except Exception as e:
        logging.error(f'[SELF-STUDY API] /portfolio/self-study failed: {str(e)}')
        return jsonify({'error': str(e)}), 500                         # Return error with details