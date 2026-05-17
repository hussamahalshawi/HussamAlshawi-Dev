"""
Portfolio Public API — projects_api.py
========================================
Endpoints:
    GET /api/portfolio/projects        — all projects with optional filters
    GET /api/portfolio/projects/<id>   — single project detail

Extracted from:
    - experience_projects_api.py

Author: HussamAlshawi-Dev
"""

import logging                                                        # Error tracking
from flask import Blueprint, jsonify, request                         # Core Flask utilities
from App.models.project import Project                                # Project model
from App import cache                                                 # Shared RAM cache instance
from App.routes.helpers.route_helpers import get_profile, fmt_date   # Shared helpers — no duplication


# ── Blueprint registration ────────────────────────────────────────────────────
projects_public_bp = Blueprint('projects_public', __name__)           # Blueprint name for url_for()


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/portfolio/projects
# ─────────────────────────────────────────────────────────────────────────────
@projects_public_bp.route('/portfolio/projects', methods=['GET'])
@cache.cached(timeout=300, key_prefix='public_projects')              # Cache 5 min in RAM
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

    Response shape:
    {
        "count"   : 12,
        "types"   : ["Web App", "API", "CLI Tool"],
        "projects": [
            {
                "id"           : "...",
                "project_name" : "HussamDev Portfolio",
                "project_type" : "Web App",
                "description"  : "...",
                "my_role"      : "Lead Backend Developer",
                "category"     : "Full Stack",
                "github_url"   : "https://github.com/...",
                "live_url"     : "https://...",
                "start_date"   : "2023-01-01T00:00:00",
                "end_date"     : "2024-02-01T00:00:00",
                "skills_used"  : ["Python", "React", "MongoDB"],
                "media"        : {
                    "project_images": ["https://..."],
                    "project_video" : null
                }
            }
        ]
    }
    """
    try:
        profile = get_profile()                                        # Fetch active profile via shared helper

        if not profile:
            return jsonify({'error': 'Profile not found'}), 404        # Guard: no profile configured

        # Build base query — optionally filter by project_type
        query               = {'profile': profile}                     # Always scope to active profile
        project_type_filter = request.args.get('type', '').strip()    # Optional type filter
        limit               = request.args.get('limit', type=int)     # Optional result limit

        if project_type_filter:
            query['project_type'] = project_type_filter               # Add type filter to query

        projects_qs = Project.objects(**query).order_by('-end_date', '-last_updated')  # Newest first

        if limit and limit > 0:
            projects_qs = projects_qs.limit(limit)                    # Apply limit if provided

        result   = []                                                  # Projects to return
        type_set = set()                                               # Collect unique project types

        for proj in projects_qs:
            if proj.project_type:
                type_set.add(proj.project_type)                        # Track for filter tabs

            # Resolve category name safely from linked reference
            category_name = ''
            if proj.category:
                try:
                    category_name = proj.category.name or ''           # Dereference Category document
                except Exception:
                    category_name = ''                                 # Handle broken reference

            result.append({
                'id'           : str(proj.id),                         # MongoDB ObjectId as string
                'project_name' : proj.project_name  or '',             # Project display name
                'project_type' : proj.project_type  or '',             # Type e.g. Web App / API
                'description'  : proj.description   or '',             # Project description
                'my_role'      : proj.my_role        or '',             # Developer's role
                'category'     : category_name,                        # Resolved category name
                'github_url'   : proj.github_url     or None,          # GitHub repo URL
                'live_url'     : proj.live_url        or None,         # Live demo URL
                'start_date'   : fmt_date(proj.start_date),            # ISO string via shared helper
                'end_date'     : fmt_date(proj.end_date),              # ISO string via shared helper
                'skills_used'  : list(proj.skills_used or []),         # Technologies used
                'media': {
                    'project_images': list(proj.project_images or []), # Gallery URLs
                    'project_video' : proj.project_video or None,      # Demo video URL
                },
            })

        return jsonify({
            'count'   : len(result),                                   # Total returned projects
            'types'   : sorted(type_set),                              # Alphabetical type list
            'projects': result,                                        # Filtered projects array
        }), 200

    except Exception as e:
        logging.error(f'[PROJECTS API] /portfolio/projects failed: {str(e)}')
        return jsonify({'error': str(e)}), 500                         # Return error with details


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/portfolio/projects/<project_id>
# ─────────────────────────────────────────────────────────────────────────────
@projects_public_bp.route('/portfolio/projects/<project_id>', methods=['GET'])
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
        proj = Project.objects.get(id=project_id)                      # Fetch by ID or raise DoesNotExist

        # Resolve category name safely
        category_name = ''
        if proj.category:
            try:
                category_name = proj.category.name or ''               # Dereference Category document
            except Exception:
                category_name = ''                                     # Handle broken reference

        return jsonify({
            'id'           : str(proj.id),                             # MongoDB ObjectId as string
            'project_name' : proj.project_name  or '',                 # Project display name
            'project_type' : proj.project_type  or '',                 # Project type
            'description'  : proj.description   or '',                 # Project description
            'my_role'      : proj.my_role        or '',                 # Developer's role
            'category'     : category_name,                            # Resolved category name
            'github_url'   : proj.github_url     or None,              # GitHub repo URL
            'live_url'     : proj.live_url        or None,             # Live demo URL
            'start_date'   : fmt_date(proj.start_date),                # ISO string via shared helper
            'end_date'     : fmt_date(proj.end_date),                  # ISO string via shared helper
            'skills_used'  : list(proj.skills_used or []),             # Technologies used
            'media': {
                'project_images': list(proj.project_images or []),     # Gallery URLs
                'project_video' : proj.project_video or None,          # Demo video URL
            },
        }), 200

    except Project.DoesNotExist:
        return jsonify({'error': 'Project not found'}), 404            # Guard: invalid ID

    except Exception as e:
        logging.error(f'[PROJECTS API] /portfolio/projects/{project_id} failed: {str(e)}')
        return jsonify({'error': str(e)}), 500                         # Return error with details