"""
Portfolio Public API — courses_api.py
========================================
Endpoints:
    GET /api/portfolio/courses    — certifications and courses with optional filters

Extracted from:
    - education_courses_api.py (GET /portfolio/courses)
    Note: /portfolio/courses/stats moved to charts/learning_charts_api.py

Author: HussamAlshawi-Dev
"""

import logging                                                        # Error tracking
from flask import Blueprint, jsonify, request                         # Core Flask utilities
from App.models.course import Course                                  # Certifications model
from App.routes.helpers.route_helpers import get_profile, fmt_date   # Shared helpers — no duplication


# ── Blueprint registration ────────────────────────────────────────────────────
courses_public_bp = Blueprint('courses_public', __name__)             # Blueprint name for url_for()


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/portfolio/courses
# ─────────────────────────────────────────────────────────────────────────────
@courses_public_bp.route('/portfolio/courses', methods=['GET'])
def get_courses():
    """
    Returns all certification and course records.

    Query params (optional):
        category : Filter by category name (e.g., ?category=Python)
        limit    : Limit result count      (e.g., ?limit=9)

    Used by:
        - Courses / Certifications section with filter tabs
        - Certificate gallery
        - Skills-per-course breakdown chart

    Response shape:
    {
        "count"     : 18,
        "categories": ["Python", "DevOps", "AI/ML"],
        "courses"   : [
            {
                "id"             : "...",
                "course_name"    : "Python Masterclass",
                "organization"   : "Udemy",
                "category"       : "Python",
                "project_summary": "...",
                "credential_url" : "https://...",
                "start_date"     : "2022-01-01T00:00:00",
                "end_date"       : "2022-03-01T00:00:00",
                "acquired_skills": ["Python", "OOP"],
                "media"          : {
                    "certificate_image": "https://...",
                    "course_images"    : [],
                    "course_video"     : null
                }
            }
        ]
    }
    """
    try:
        profile = get_profile()                                        # Fetch active profile via shared helper

        if not profile:
            return jsonify({'error': 'Profile not found'}), 404        # Guard: no profile configured

        courses_qs  = Course.objects(profile=profile).order_by('-end_date')  # Newest first
        cat_filter  = request.args.get('category', '').strip()         # Optional category filter
        limit       = request.args.get('limit', type=int)              # Optional result limit

        result  = []                                                   # Courses to return
        cat_set = set()                                                # Collect unique category names

        for course in list(courses_qs):                                # Iterate all to collect categories
            # Resolve category name safely from linked reference
            cat_name = ''
            if course.category:
                try:
                    cat_name = course.category.name or ''              # Dereference Category document
                except Exception:
                    cat_name = ''                                      # Handle broken reference

            if cat_name:
                cat_set.add(cat_name)                                  # Track for filter tabs

            # Apply category filter if provided
            if cat_filter and cat_name.lower() != cat_filter.lower():
                continue                                               # Skip non-matching categories

            result.append({
                'id'             : str(course.id),                     # MongoDB ObjectId as string
                'course_name'    : course.course_name     or '',       # Course display name
                'organization'   : course.organization    or '',       # Provider / platform name
                'category'       : cat_name,                           # Resolved category name
                'project_summary': course.project_summary or '',       # Brief project summary
                'credential_url' : course.credential_url  or None,    # Certificate link
                'start_date'     : fmt_date(course.start_date),        # ISO string via shared helper
                'end_date'       : fmt_date(course.end_date),          # ISO string via shared helper
                'acquired_skills': list(course.acquired_skills or []), # Skills gained
                'media': {
                    'certificate_image': course.certificate_image or None,   # Certificate image URL
                    'course_images'    : list(course.course_images or []),   # Gallery URLs
                    'course_video'     : course.course_video or None,        # Video URL
                },
            })

        if limit and limit > 0:
            result = result[:limit]                                    # Apply limit after filtering

        return jsonify({
            'count'     : len(result),                                 # Total returned courses
            'categories': sorted(cat_set),                             # Alphabetical category list
            'courses'   : result,                                      # Filtered courses array
        }), 200

    except Exception as e:
        logging.error(f'[COURSES API] /portfolio/courses failed: {str(e)}')
        return jsonify({'error': str(e)}), 500                         # Return error with details