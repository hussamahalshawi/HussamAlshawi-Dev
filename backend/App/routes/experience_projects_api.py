"""
Portfolio Public API — experience_projects_api.py
====================================================
Endpoints :
    GET /api/portfolio/experience           — all work history entries
    GET /api/portfolio/experience/timeline  — timeline-formatted for visual chart
    GET /api/portfolio/projects             — all portfolio projects
    GET /api/portfolio/projects/<id>        — single project detail
Author    : HussamAlshawi-Dev
"""

import logging                                                # Error tracking
from flask import Blueprint, jsonify                          # Core Flask utilities
from App.models.profile    import Profile                     # Profile model
from App.models.experience import Experience                  # Work history model
from App.models.project    import Project                     # Project model
from App import cache                            # Import shared cache instance

# ── Blueprint registration ────────────────────────────────────────────────────
experience_projects_bp = Blueprint('experience_projects', __name__)


# ─────────────────────────────────────────────────────────────────────────────
# HELPER  _fmt_date  — safely format a datetime to ISO string or None
# ─────────────────────────────────────────────────────────────────────────────
def _fmt_date(dt):
    """
    Converts a datetime object to an ISO-format string.
    Returns None if the value is missing or conversion fails.

    Args:
        dt: datetime | None

    Returns:
        str | None
    """
    try:
        return dt.isoformat() if dt else None
    except Exception:
        return None


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/portfolio/experience
# Full work history, sorted by is_current then start_date descending
# ─────────────────────────────────────────────────────────────────────────────
@experience_projects_bp.route('/portfolio/experience', methods=['GET'])
@cache.cached(timeout=300, key_prefix='public_experience')
def get_experience():
    """
    Returns all professional experience records for the active portfolio.

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
        profile = Profile.objects.first()

        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        # Fetch all experience records — ordering handled by model meta
        records = Experience.objects(profile=profile).order_by('-is_current', '-start_date')

        result = []
        for exp in records:
            # Calculate duration in months safely
            duration = 0
            if exp.start_date:
                from datetime import datetime, timezone
                end    = exp.end_date if exp.end_date else datetime.now(timezone.utc)
                start  = exp.start_date
                # Make both timezone-aware for subtraction
                if start.tzinfo is None:
                    start = start.replace(tzinfo=timezone.utc)
                if end.tzinfo is None:
                    end = end.replace(tzinfo=timezone.utc)
                duration = max(0, round((end - start).days / 30.44))  # Approximate months

            result.append({
                'id'             : str(exp.id),
                'job_title'      : exp.job_title      or '',
                'company_name'   : exp.company_name   or '',
                'employment_type': exp.employment_type or '',
                'location'       : exp.location        or '',
                'company_url'    : exp.company_url     or None,
                'description'    : exp.description     or '',
                'is_current'     : bool(exp.is_current),
                'start_date'     : _fmt_date(exp.start_date),
                'end_date'       : _fmt_date(exp.end_date),
                'duration_months': duration,
                'skills_acquired': list(exp.skills_acquired or []),
                'media': {
                    'certificate_image' : exp.certificate_image or None,
                    'experience_images' : list(exp.experience_images or []),
                    'experience_video'  : exp.experience_video or None,
                },
            })

        return jsonify({'count': len(result), 'experience': result}), 200

    except Exception as e:
        logging.error(f'[EXPERIENCE API] /portfolio/experience failed: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/portfolio/experience/timeline
# Compact timeline format for visual timeline components
# ─────────────────────────────────────────────────────────────────────────────
@experience_projects_bp.route('/portfolio/experience/timeline', methods=['GET'])
def get_experience_timeline():
    """
    Returns a compact timeline-oriented payload ideal for animated
    vertical/horizontal timeline components on the portfolio frontend.

    Adds:
        - year_start  : integer year for grouping
        - label       : short label combining title + company
        - is_current  : flag to render a special "NOW" marker

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
        profile = Profile.objects.first()

        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        records = Experience.objects(profile=profile).order_by('-is_current', '-start_date')

        timeline = []
        for exp in records:
            year_start = exp.start_date.year if exp.start_date else None
            year_end   = exp.end_date.year   if exp.end_date   else None

            timeline.append({
                'id'        : str(exp.id),
                'label'     : f"{exp.job_title or ''} @ {exp.company_name or ''}".strip(' @'),
                'job_title' : exp.job_title   or '',
                'company'   : exp.company_name or '',
                'location'  : exp.location     or '',
                'year_start': year_start,
                'year_end'  : year_end,
                'is_current': bool(exp.is_current),
                'skills'    : list(exp.skills_acquired or []),
            })

        return jsonify({'timeline': timeline}), 200

    except Exception as e:
        logging.error(f'[EXPERIENCE API] /portfolio/experience/timeline failed: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/portfolio/projects
# Full project list with filters support via query params
# ─────────────────────────────────────────────────────────────────────────────
@experience_projects_bp.route('/portfolio/projects', methods=['GET'])
@cache.cached(timeout=300, key_prefix='public_projects')
def get_projects():
    """
    Returns all portfolio projects, sorted by end_date descending.

    Query params (all optional):
        type  : Filter by project_type  (e.g., ?type=Web+App)
        limit : Limit result count      (e.g., ?limit=6)

    Used by:
        - Projects section grid / masonry
        - Filter tabs (Web App, API, CLI, etc.)
        - Featured projects carousel
        - Tech stack frequency chart

    Response shape:
    {
        "count": 12,
        "types": ["Web App", "API", "CLI Tool"],
        "projects": [
            {
                "id"            : "...",
                "project_name"  : "HussamDev Portfolio",
                "project_type"  : "Web App",
                "description"   : "...",
                "my_role"       : "Lead Backend Developer",
                "category"      : "Full Stack",
                "github_url"    : "https://github.com/...",
                "live_url"      : "https://...",
                "start_date"    : "2023-01-01T00:00:00",
                "end_date"      : "2024-02-01T00:00:00",
                "skills_used"   : ["Python", "React", "MongoDB"],
                "media"         : {
                    "project_images": ["https://..."],
                    "project_video" : null
                }
            }
        ]
    }
    """
    try:
        from flask import request as flask_request            # Import inside route to avoid circular refs

        profile = Profile.objects.first()

        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        # Build query with optional type filter
        query = {'profile': profile}
        project_type_filter = flask_request.args.get('type', '').strip()
        if project_type_filter:
            query['project_type'] = project_type_filter      # Filter by project type

        # Fetch and order
        projects_qs = Project.objects(**query).order_by('-end_date', '-last_updated')

        # Optional limit param
        limit = flask_request.args.get('limit', type=int)
        if limit and limit > 0:
            projects_qs = projects_qs.limit(limit)            # Apply limit if provided

        result     = []
        type_set   = set()                                    # Collect all unique project types

        for proj in projects_qs:
            if proj.project_type:
                type_set.add(proj.project_type)               # Track unique types for filter tabs

            # Resolve category name safely
            category_name = ''
            if proj.category:
                try:
                    category_name = proj.category.name or ''
                except Exception:
                    category_name = ''

            result.append({
                'id'           : str(proj.id),
                'project_name' : proj.project_name  or '',
                'project_type' : proj.project_type  or '',
                'description'  : proj.description   or '',
                'my_role'      : proj.my_role        or '',
                'category'     : category_name,
                'github_url'   : proj.github_url     or None,
                'live_url'     : proj.live_url        or None,
                'start_date'   : _fmt_date(proj.start_date),
                'end_date'     : _fmt_date(proj.end_date),
                'skills_used'  : list(proj.skills_used or []),
                'media': {
                    'project_images': list(proj.project_images or []),
                    'project_video' : proj.project_video or None,
                },
            })

        return jsonify({
            'count'   : len(result),
            'types'   : sorted(type_set),
            'projects': result,
        }), 200

    except Exception as e:
        logging.error(f'[PROJECTS API] /portfolio/projects failed: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/portfolio/projects/<project_id>
# Single project detail page payload
# ─────────────────────────────────────────────────────────────────────────────
@experience_projects_bp.route('/portfolio/projects/<project_id>', methods=['GET'])
def get_project_detail(project_id):
    """
    Returns the full detail payload for a single project.

    Used by:
        - Project detail page / modal
        - SEO meta tags (title, description)

    Args:
        project_id (str): MongoDB ObjectId from the URL path.
    """
    try:
        proj = Project.objects.get(id=project_id)             # Fetch by ID or raise DoesNotExist

        category_name = ''
        if proj.category:
            try:
                category_name = proj.category.name or ''
            except Exception:
                category_name = ''

        return jsonify({
            'id'           : str(proj.id),
            'project_name' : proj.project_name  or '',
            'project_type' : proj.project_type  or '',
            'description'  : proj.description   or '',
            'my_role'      : proj.my_role        or '',
            'category'     : category_name,
            'github_url'   : proj.github_url     or None,
            'live_url'     : proj.live_url        or None,
            'start_date'   : _fmt_date(proj.start_date),
            'end_date'     : _fmt_date(proj.end_date),
            'skills_used'  : list(proj.skills_used or []),
            'media': {
                'project_images': list(proj.project_images or []),
                'project_video' : proj.project_video or None,
            },
        }), 200

    except Project.DoesNotExist:
        return jsonify({'error': 'Project not found'}), 404

    except Exception as e:
        logging.error(f'[PROJECTS API] /portfolio/projects/{project_id} failed: {str(e)}')
        return jsonify({'error': str(e)}), 500