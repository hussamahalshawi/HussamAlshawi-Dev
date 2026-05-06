"""
Portfolio Public API — education_courses_api.py
================================================
Endpoints :
    GET /api/portfolio/education            — academic history
    GET /api/portfolio/courses              — certifications & courses
    GET /api/portfolio/courses/stats        — course statistics for charts
    GET /api/portfolio/achievements         — awards & recognitions
    GET /api/portfolio/self-study           — independent learning activities
Author    : HussamAlshawi-Dev
"""

import logging                                                # Error tracking
from flask import Blueprint, jsonify                          # Core Flask utilities
from App.models.profile     import Profile                    # Profile model
from App.models.education   import Education                  # Academic records
from App.models.course      import Course                     # Certifications model
from App.models.achievement import Achievement                # Awards model
from App.models.self_study  import SelfStudy                  # Self-learning model


# ── Blueprint registration ────────────────────────────────────────────────────
education_courses_bp = Blueprint('education_courses', __name__)


# ─────────────────────────────────────────────────────────────────────────────
# HELPER  _fmt_date — safely format datetime to ISO string
# ─────────────────────────────────────────────────────────────────────────────
def _fmt_date(dt):
    """Returns ISO string from datetime, or None if missing."""
    try:
        return dt.isoformat() if dt else None
    except Exception:
        return None


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/portfolio/education
# ─────────────────────────────────────────────────────────────────────────────
@education_courses_bp.route('/portfolio/education', methods=['GET'])
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
                "id"               : "...",
                "institution"      : "Jordan University",
                "degree"           : "Bachelor's",
                "major"            : "Computer Science",
                "grade"            : "Excellent — GPA 3.9",
                "description"      : "...",
                "start_date"       : "2017-09-01T00:00:00",
                "end_date"         : "2021-06-01T00:00:00",
                "skills_learned"   : ["Python", "Algorithms"],
                "media"            : {
                    "certificate_image" : "https://...",
                    "education_photos"  : ["https://..."],
                    "education_video"   : null
                }
            }
        ]
    }
    """
    try:
        profile = Profile.objects.first()

        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        records = Education.objects(profile=profile).order_by('-start_date')

        result = []
        for edu in records:
            result.append({
                'id'            : str(edu.id),
                'institution'   : edu.institution or '',
                'degree'        : edu.degree      or '',
                'major'         : edu.major        or '',
                'grade'         : edu.grade        or '',
                'description'   : edu.description  or '',
                'start_date'    : _fmt_date(edu.start_date),
                'end_date'      : _fmt_date(edu.end_date),
                'skills_learned': list(edu.skills_learned or []),
                'media': {
                    'certificate_image': edu.certificate_image or None,
                    'education_photos' : list(edu.education_photos or []),
                    'education_video'  : edu.education_video or None,
                },
            })

        return jsonify({'count': len(result), 'education': result}), 200

    except Exception as e:
        logging.error(f'[EDUCATION API] /portfolio/education failed: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/portfolio/courses
# ─────────────────────────────────────────────────────────────────────────────
@education_courses_bp.route('/portfolio/courses', methods=['GET'])
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
        "count": 18,
        "categories": ["Python", "DevOps", "AI/ML"],
        "courses": [
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
        from flask import request as flask_request

        profile = Profile.objects.first()

        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        # Base queryset
        courses_qs = Course.objects(profile=profile).order_by('-end_date')

        # Optional category filter
        cat_filter = flask_request.args.get('category', '').strip()
        limit      = flask_request.args.get('limit', type=int)

        result      = []
        cat_set     = set()                                   # Collect unique category names

        # We need to fetch all to collect categories, then filter
        all_courses = list(courses_qs)

        for course in all_courses:
            # Resolve category name safely
            cat_name = ''
            if course.category:
                try:
                    cat_name = course.category.name or ''
                except Exception:
                    cat_name = ''

            if cat_name:
                cat_set.add(cat_name)                         # Track for filter tabs

            # Apply category filter
            if cat_filter and cat_name.lower() != cat_filter.lower():
                continue

            result.append({
                'id'             : str(course.id),
                'course_name'    : course.course_name     or '',
                'organization'   : course.organization    or '',
                'category'       : cat_name,
                'project_summary': course.project_summary or '',
                'credential_url' : course.credential_url  or None,
                'start_date'     : _fmt_date(course.start_date),
                'end_date'       : _fmt_date(course.end_date),
                'acquired_skills': list(course.acquired_skills or []),
                'media': {
                    'certificate_image': course.certificate_image or None,
                    'course_images'    : list(course.course_images or []),
                    'course_video'     : course.course_video or None,
                },
            })

        # Apply limit after filtering
        if limit and limit > 0:
            result = result[:limit]

        return jsonify({
            'count'     : len(result),
            'categories': sorted(cat_set),
            'courses'   : result,
        }), 200

    except Exception as e:
        logging.error(f'[COURSES API] /portfolio/courses failed: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/portfolio/courses/stats
# Lightweight stats for analytics charts
# ─────────────────────────────────────────────────────────────────────────────
@education_courses_bp.route('/portfolio/courses/stats', methods=['GET'])
def get_courses_stats():
    """
    Returns aggregated statistics about courses for use in charts.

    Includes:
        - total_courses       : overall count
        - by_category         : count per category
        - by_year             : count per completion year
        - top_skill_sources   : skills most frequently learned across courses
        - providers           : list of unique organisations

    Used by:
        - Courses analytics widget
        - Learning trajectory chart (by year)
        - Provider distribution chart
    """
    try:
        profile = Profile.objects.first()

        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        courses = list(Course.objects(profile=profile))

        # ── By category ───────────────────────────────────────────────────────
        by_category = {}
        providers   = set()
        by_year     = {}
        skill_freq  = {}

        for course in courses:
            # Category count
            cat = ''
            if course.category:
                try:
                    cat = course.category.name or ''
                except Exception:
                    cat = ''
            if cat:
                by_category[cat] = by_category.get(cat, 0) + 1

            # Provider set
            if course.organization:
                providers.add(course.organization)

            # Year count
            if course.end_date:
                yr = str(course.end_date.year)
                by_year[yr] = by_year.get(yr, 0) + 1

            # Skill frequency
            for skill in (course.acquired_skills or []):
                if skill:
                    skill_freq[skill] = skill_freq.get(skill, 0) + 1

        # Top 10 skills by frequency across all courses
        top_skill_sources = sorted(
            [{'skill': k, 'count': v} for k, v in skill_freq.items()],
            key=lambda x: -x['count']
        )[:10]

        return jsonify({
            'total_courses'    : len(courses),
            'by_category'      : [{'category': k, 'count': v} for k, v in sorted(by_category.items())],
            'by_year'          : [{'year': k, 'count': v} for k, v in sorted(by_year.items())],
            'top_skill_sources': top_skill_sources,
            'providers'        : sorted(providers),
        }), 200

    except Exception as e:
        logging.error(f'[COURSES API] /portfolio/courses/stats failed: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/portfolio/achievements
# ─────────────────────────────────────────────────────────────────────────────
@education_courses_bp.route('/portfolio/achievements', methods=['GET'])
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
        profile = Profile.objects.first()

        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        records = Achievement.objects(profile=profile).order_by('-date_obtained')

        result = []
        for ach in records:
            result.append({
                'id'                   : str(ach.id),
                'title'                : ach.title                or '',
                'issuing_organization' : ach.issuing_organization or '',
                'description'          : ach.description          or '',
                'evidence_url'         : ach.evidence_url         or None,
                'date_obtained'        : _fmt_date(ach.date_obtained),
                'skills_demonstrated'  : list(ach.skills_demonstrated or []),
                'media': {
                    'certificate_image': ach.certificate_image or None,
                    'evidence_photos'  : list(ach.evidence_photos or []),
                    'evidence_video'   : ach.evidence_video or None,
                },
            })

        return jsonify({'count': len(result), 'achievements': result}), 200

    except Exception as e:
        logging.error(f'[ACHIEVEMENTS API] /portfolio/achievements failed: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/portfolio/self-study
# ─────────────────────────────────────────────────────────────────────────────
@education_courses_bp.route('/portfolio/self-study', methods=['GET'])
def get_self_study():
    """
    Returns all independent learning activities (books, articles, workshops).

    Query params (optional):
        type  : Filter by learning_type (e.g., ?type=Book)

    Used by:
        - Self-study / Reading list section
        - Learning type distribution chart (donut)

    Response shape:
    {
        "count": 14,
        "types": ["Book", "Course", "Article", "Workshop"],
        "self_study": [
            {
                "id"           : "...",
                "title"        : "Clean Code",
                "platform_name": "O'Reilly",
                "learning_type": "Book",
                "track"        : "Software Engineering",
                "summary"      : "...",
                "source_url"   : "https://...",
                "cover_image"  : "https://...",
                "start_date"   : "2022-04-01T00:00:00",
                "end_date"     : "2022-05-15T00:00:00",
                "skills_learned": ["Clean Code", "Refactoring"]
            }
        ]
    }
    """
    try:
        from flask import request as flask_request

        profile = Profile.objects.first()

        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        records     = SelfStudy.objects(profile=profile).order_by('-created_at')
        type_filter = flask_request.args.get('type', '').strip()

        result   = []
        type_set = set()

        for item in records:
            if item.learning_type:
                type_set.add(item.learning_type)

            # Apply type filter
            if type_filter and (item.learning_type or '').lower() != type_filter.lower():
                continue

            # Resolve track name safely
            track_name = ''
            if item.track:
                try:
                    track_name = item.track.name or ''
                except Exception:
                    track_name = ''

            result.append({
                'id'            : str(item.id),
                'title'         : item.title         or '',
                'platform_name' : item.platform_name or '',
                'learning_type' : item.learning_type or '',
                'track'         : track_name,
                'summary'       : item.summary       or '',
                'source_url'    : item.source_url    or None,
                'cover_image'   : item.cover_image   or None,
                'start_date'    : _fmt_date(item.start_date),
                'end_date'      : _fmt_date(item.end_date),
                'skills_learned': list(item.skills_learned or []),
            })

        return jsonify({
            'count'     : len(result),
            'types'     : sorted(type_set),
            'self_study': result,
        }), 200

    except Exception as e:
        logging.error(f'[SELF-STUDY API] /portfolio/self-study failed: {str(e)}')
        return jsonify({'error': str(e)}), 500