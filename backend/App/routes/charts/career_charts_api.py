"""
Charts API — career_charts_api.py
============================================================
Dedicated analytics endpoints for Career/Professional charts.

Endpoints:
    GET /api/charts/career/gantt           — unified career + education Gantt timeline
    GET /api/charts/career/employment-mix  — employment type donut
    GET /api/charts/career/projects-treemap— projects by category treemap data
    GET /api/charts/career/projects-heatmap— project activity calendar heatmap
    GET /api/charts/career/stack-frequency — tech stack frequency bar chart
    GET /api/charts/career/achievements-timeline — achievements over time

Author: HussamAlshawi-Dev
"""

import logging                                                     # Error tracking
from datetime import datetime, timezone                            # Date utilities
from flask import Blueprint, jsonify, request                      # Core Flask utilities
from App import cache                                              # Cache decorator
from App.models.profile     import Profile                         # Profile model
from App.models.experience  import Experience                      # Work history model
from App.models.education   import Education                       # Academic records model
from App.models.project     import Project                         # Projects model
from App.models.achievement import Achievement                     # Achievements model
from App.routes.helpers.route_helpers import get_profile, fmt_date  # Shared helpers — no duplication

# ── Blueprint registration ────────────────────────────────────────────────────
career_charts_bp = Blueprint('career_charts', __name__)


# ─────────────────────────────────────────────────────────────────────────────
# HELPER — calculate duration in months between two datetimes
# ─────────────────────────────────────────────────────────────────────────────
def _months(start, end=None):
    """
    Calculates the number of months between start and end.
    Falls back to now if end is None (current role).

    Args:
        start (datetime): Start date.
        end   (datetime | None): End date, defaults to now.

    Returns:
        int: Duration in months (minimum 0).
    """
    if not start:
        return 0

    now    = datetime.now(timezone.utc)
    end_dt = end if end else now

    # Ensure both are timezone-aware for subtraction
    if start.tzinfo  is None: start  = start.replace(tzinfo=timezone.utc)
    if end_dt.tzinfo is None: end_dt = end_dt.replace(tzinfo=timezone.utc)

    return max(0, round((end_dt - start).days / 30.44))            # Approximate months


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE 1 — GET /api/charts/career/gantt
# Unified Gantt timeline: Education + Experience merged and sorted
# ─────────────────────────────────────────────────────────────────────────────
@career_charts_bp.route('/charts/career/gantt', methods=['GET'])
@cache.cached(timeout=300)
def career_gantt():
    """
    Returns a merged, sorted timeline of Education and Experience entries.
    Each entry contains start_year, end_year, duration, type, and colors.
    Powers the Gantt / Horizontal Timeline chart.

    Response shape:
    {
        "min_year": 2015,
        "max_year": 2026,
        "items": [
            {
                "id"        : "...",
                "type"      : "education",
                "label"     : "BSc Computer Science",
                "sub_label" : "Jordan University",
                "start_year": 2017,
                "end_year"  : 2021,
                "start_date": "2017-09-01T00:00:00",
                "end_date"  : "2021-06-01T00:00:00",
                "duration_months": 45,
                "is_current": false,
                "color"     : "#7F77DD",
                "bg"        : "#EEEDFE"
            }
        ]
    }
    """
    try:
        profile = get_profile()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        items = []

        # ── Education entries ───────────────────────────────────────────────
        for edu in Education.objects(profile=profile).order_by('start_date').only(
            'degree', 'major', 'institution', 'start_date', 'end_date',
        ):
            items.append({
                'id'             : str(edu.id),
                'type'           : 'education',                    # Type marker for chart
                'label'          : f"{edu.degree or ''} — {edu.major or ''}".strip(' —'),
                'sub_label'      : edu.institution or '',
                'start_year'     : edu.start_date.year if edu.start_date else None,
                'end_year'       : edu.end_date.year   if edu.end_date   else None,
                'start_date'     : fmt_date(edu.start_date),
                'end_date'       : fmt_date(edu.end_date),
                'duration_months': _months(edu.start_date, edu.end_date),
                'is_current'     : False,
                'color'          : '#7F77DD',                      # Purple for education
                'bg'             : '#EEEDFE',
            })

        # ── Experience entries ──────────────────────────────────────────────
        for exp in Experience.objects(profile=profile).order_by('start_date').only(
            'job_title', 'company_name', 'employment_type', 'location',
            'start_date', 'end_date', 'is_current',
        ):
            items.append({
                'id'             : str(exp.id),
                'type'           : 'experience',                   # Type marker for chart
                'label'          : exp.job_title    or '',
                'sub_label'      : exp.company_name or '',
                'employment_type': exp.employment_type or '',
                'location'       : exp.location or '',
                'start_year'     : exp.start_date.year if exp.start_date else None,
                'end_year'       : exp.end_date.year   if exp.end_date   else None,
                'start_date'     : fmt_date(exp.start_date),
                'end_date'       : fmt_date(exp.end_date),
                'duration_months': _months(exp.start_date, exp.end_date),
                'is_current'     : bool(exp.is_current),
                'color'          : '#1D9E75',                      # Teal for experience
                'bg'             : '#E1F5EE',
            })

        # Sort merged list by start_year ascending (None values go last)
        items.sort(key=lambda x: (x['start_year'] or 9999))

        # Calculate chart bounds for axis rendering
        valid_years = [i['start_year'] for i in items if i['start_year']] + \
                      [i['end_year']   for i in items if i['end_year']]

        min_year = min(valid_years) - 1 if valid_years else datetime.now(timezone.utc).year - 10
        max_year = max(valid_years) + 1 if valid_years else datetime.now(timezone.utc).year + 1

        return jsonify({
            'min_year': min_year,                                  # Chart axis left bound
            'max_year': max_year,                                  # Chart axis right bound
            'count'   : len(items),
            'items'   : items,
        }), 200

    except Exception as e:
        logging.error(f'[CHARTS] /charts/career/gantt failed: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE 2 — GET /api/charts/career/employment-mix
# Donut: distribution of employment types and durations
# ─────────────────────────────────────────────────────────────────────────────
@career_charts_bp.route('/charts/career/employment-mix', methods=['GET'])
@cache.cached(timeout=300)
def employment_mix():
    """
    Returns employment type breakdown by count and total months.
    Powers the Employment Mix Donut / Pie chart.

    Response shape:
    {
        "labels"  : ["Full-time", "Freelance", "Part-time", "Contract"],
        "counts"  : [3, 2, 1, 0],
        "months"  : [36, 18, 6, 0],
        "colors"  : ["#1D9E75", "#378ADD", "#BA7517", "#D85A30"],
        "series"  : [
            { "type": "Full-time", "count": 3, "months": 36, "color": "#1D9E75", "pct_months": 66.7 }
        ]
    }
    """
    try:
        profile = get_profile()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        TYPE_COLORS = {
            'Full-time' : '#1D9E75',
            'Freelance' : '#378ADD',
            'Part-time' : '#BA7517',
            'Contract'  : '#D85A30',
        }

        # Accumulate count + months per employment type
        type_map = {}
        for exp in Experience.objects(profile=profile).only('employment_type', 'start_date', 'end_date'):
            etype  = exp.employment_type or 'Unknown'
            months = _months(exp.start_date, exp.end_date)

            if etype not in type_map:
                type_map[etype] = {'count': 0, 'months': 0}

            type_map[etype]['count']  += 1
            type_map[etype]['months'] += months

        total_months = sum(v['months'] for v in type_map.values()) or 1  # Avoid division by 0

        series = sorted(
            [
                {
                    'type'      : etype,
                    'count'     : data['count'],
                    'months'    : data['months'],
                    'color'     : TYPE_COLORS.get(etype, '#888780'),
                    'pct_months': round(data['months'] / total_months * 100, 1),
                }
                for etype, data in type_map.items()
            ],
            key=lambda x: -x['months']                            # Most time first
        )

        return jsonify({
            'labels': [s['type']   for s in series],
            'counts': [s['count']  for s in series],
            'months': [s['months'] for s in series],
            'colors': [s['color']  for s in series],
            'series': series,
        }), 200

    except Exception as e:
        logging.error(f'[CHARTS] /charts/career/employment-mix failed: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE 3 — GET /api/charts/career/projects-treemap
# Treemap: project count per category (area = count)
# ─────────────────────────────────────────────────────────────────────────────
@career_charts_bp.route('/charts/career/projects-treemap', methods=['GET'])
@cache.cached(timeout=300)
def projects_treemap():
    """
    Returns project count grouped by category and type.
    Powers the Projects Treemap chart (rectangle area = count).

    Response shape:
    {
        "total": 14,
        "by_category": [
            { "category": "Web Development", "count": 6, "pct": 42.9, "color": "#378ADD",
              "projects": [ { "name": "...", "type": "Web App" } ] }
        ],
        "by_type": [
            { "type": "Web App", "count": 8, "pct": 57.1, "color": "#..." }
        ]
    }
    """
    try:
        profile = get_profile()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        TYPE_COLORS = {
            'Web App'    : '#378ADD',
            'Mobile App' : '#1D9E75',
            'API'        : '#BA7517',
            'CLI Tool'   : '#D85A30',
            'Library'    : '#7F77DD',
            'Desktop'    : '#D4537E',
        }

        cat_map  = {}                                              # {category: {count, projects}}
        type_map = {}                                              # {type: count}

        for proj in Project.objects(profile=profile).only(
            'category', 'project_type', 'project_name',
        ).select_related():
            # Resolve category name safely
            cat = 'Uncategorized'
            if proj.category:
                try:
                    cat = proj.category.name or 'Uncategorized'
                except Exception:
                    cat = 'Uncategorized'

            ptype = proj.project_type or 'Other'

            # Accumulate by category
            if cat not in cat_map:
                cat_map[cat] = {'count': 0, 'projects': []}

            cat_map[cat]['count'] += 1
            cat_map[cat]['projects'].append({
                'name': proj.project_name or '',
                'type': ptype,
                'id'  : str(proj.id),
            })

            # Accumulate by type
            type_map[ptype] = type_map.get(ptype, 0) + 1

        total = sum(v['count'] for v in cat_map.values()) or 1

        # Palette for categories (cycle through available colors)
        CAT_PALETTE = [
            '#378ADD', '#1D9E75', '#BA7517', '#D85A30',
            '#7F77DD', '#D4537E', '#639922', '#888780',
        ]

        by_category = sorted(
            [
                {
                    'category': cat,
                    'count'   : data['count'],
                    'pct'     : round(data['count'] / total * 100, 1),
                    'color'   : CAT_PALETTE[i % len(CAT_PALETTE)],
                    'projects': data['projects'],
                }
                for i, (cat, data) in enumerate(cat_map.items())
            ],
            key=lambda x: -x['count']                             # Largest category first
        )

        by_type = sorted(
            [
                {
                    'type' : ptype,
                    'count': count,
                    'pct'  : round(count / total * 100, 1),
                    'color': TYPE_COLORS.get(ptype, '#888780'),
                }
                for ptype, count in type_map.items()
            ],
            key=lambda x: -x['count']
        )

        return jsonify({
            'total'      : total,
            'by_category': by_category,
            'by_type'    : by_type,
        }), 200

    except Exception as e:
        logging.error(f'[CHARTS] /charts/career/projects-treemap failed: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE 4 — GET /api/charts/career/projects-heatmap
# Calendar heatmap: project activity density by month/year
# ─────────────────────────────────────────────────────────────────────────────
@career_charts_bp.route('/charts/career/projects-heatmap', methods=['GET'])
@cache.cached(timeout=300)
def projects_heatmap():
    """
    Returns monthly project activity data (start + last_updated) for a calendar heatmap.
    Powers the GitHub-style Project Activity Heatmap.

    Response shape:
    {
        "min_date"  : "2020-01",
        "max_date"  : "2026-05",
        "by_month"  : [
            { "month": "2023-04", "count": 3, "level": 2 }
        ],
        "by_year"   : [
            { "year": 2023, "count": 7 }
        ]
    }
    """
    try:
        profile = get_profile()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        month_map = {}                                             # {"YYYY-MM": count}

        for proj in Project.objects(profile=profile).only('start_date', 'last_updated'):
            # Count both start_date and last_updated as activity signals
            for dt in [proj.start_date, proj.last_updated]:
                if not dt:
                    continue
                key            = dt.strftime('%Y-%m')             # Format as "YYYY-MM"
                month_map[key] = month_map.get(key, 0) + 1

        if not month_map:
            return jsonify({'min_date': None, 'max_date': None, 'by_month': [], 'by_year': []}), 200

        # Calculate intensity level 0-4 (like GitHub heatmap)
        max_count = max(month_map.values()) or 1

        def intensity_level(count):
            """Maps count to a 0-4 intensity level for color encoding."""
            if count == 0: return 0
            ratio = count / max_count
            if ratio > 0.75: return 4
            if ratio > 0.50: return 3
            if ratio > 0.25: return 2
            return 1

        by_month = sorted(
            [
                {
                    'month': month,
                    'count': count,
                    'level': intensity_level(count),               # 0=empty, 4=highest
                }
                for month, count in month_map.items()
            ],
            key=lambda x: x['month']                              # Chronological order
        )

        # Aggregate by year for summary bar
        year_map = {}
        for entry in by_month:
            year = entry['month'][:4]
            year_map[year] = year_map.get(year, 0) + entry['count']

        by_year = sorted(
            [{'year': int(yr), 'count': cnt} for yr, cnt in year_map.items()],
            key=lambda x: x['year']
        )

        return jsonify({
            'min_date': by_month[0]['month']  if by_month else None,
            'max_date': by_month[-1]['month'] if by_month else None,
            'by_month': by_month,
            'by_year' : by_year,
        }), 200

    except Exception as e:
        logging.error(f'[CHARTS] /charts/career/projects-heatmap failed: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE 5 — GET /api/charts/career/stack-frequency
# Horizontal bar: tech stack frequency across all experience + projects
# ─────────────────────────────────────────────────────────────────────────────
@career_charts_bp.route('/charts/career/stack-frequency', methods=['GET'])
@cache.cached(timeout=300)
def stack_frequency():
    """
    Aggregates tech stack frequency across Experience (skills_acquired)
    and Projects (skills_used) only — the "hands-on" sources.
    Powers the Tech Stack Frequency horizontal bar chart.

    Query params:
        limit (int): Number of technologies to return. Default 15, max 30.

    Response shape:
    {
        "labels"    : ["Python", "React", "Docker"],
        "counts"    : [12, 9, 7],
        "exp_counts": [5, 0, 3],
        "proj_counts": [7, 9, 4],
        "series"    : [
            { "tech": "Python", "total": 12, "experience": 5, "projects": 7 }
        ]
    }
    """
    try:
        profile = get_profile()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        limit = min(max(int(request.args.get('limit', 15)), 1), 30)

        tech_map = {}                                              # {tech: {experience, projects}}

        # Count from Experience records
        for exp in Experience.objects(profile=profile).only('skills_acquired'):
            for raw in (exp.skills_acquired or []):
                tech = (raw or '').strip().title()
                if not tech: continue
                if tech not in tech_map: tech_map[tech] = {'experience': 0, 'projects': 0}
                tech_map[tech]['experience'] += 1

        # Count from Project records
        for proj in Project.objects(profile=profile).only('skills_used'):
            for raw in (proj.skills_used or []):
                tech = (raw or '').strip().title()
                if not tech: continue
                if tech not in tech_map: tech_map[tech] = {'experience': 0, 'projects': 0}
                tech_map[tech]['projects'] += 1

        # Build sorted series
        series = sorted(
            [
                {
                    'tech'      : tech,
                    'total'     : data['experience'] + data['projects'],
                    'experience': data['experience'],
                    'projects'  : data['projects'],
                }
                for tech, data in tech_map.items()
            ],
            key=lambda x: -x['total']
        )[:limit]

        return jsonify({
            'labels'     : [s['tech']       for s in series],
            'counts'     : [s['total']      for s in series],
            'exp_counts' : [s['experience'] for s in series],
            'proj_counts': [s['projects']   for s in series],
            'series'     : series,
        }), 200

    except Exception as e:
        logging.error(f'[CHARTS] /charts/career/stack-frequency failed: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE 6 — GET /api/charts/career/achievements-timeline
# Timeline: achievements clustered by year with skill tags
# ─────────────────────────────────────────────────────────────────────────────
@career_charts_bp.route('/charts/career/achievements-timeline', methods=['GET'])
@cache.cached(timeout=300)
def achievements_timeline():
    """
    Returns achievements grouped by year for a vertical timeline chart.
    Powers the Achievements Calendar Heatmap / Vertical Timeline.

    Response shape:
    {
        "total": 8,
        "by_year": [
            {
                "year"        : 2023,
                "count"       : 3,
                "achievements": [
                    {
                        "id"                  : "...",
                        "title"               : "Best Developer Award",
                        "issuing_organization": "TechConf",
                        "date_obtained"       : "2023-11-01T00:00:00",
                        "skills_demonstrated" : ["Python", "Leadership"]
                    }
                ]
            }
        ]
    }
    """
    try:
        profile = get_profile()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        year_map = {}                                              # {year: [achievements]}

        for ach in Achievement.objects(profile=profile).order_by('-date_obtained').only(
            'title', 'issuing_organization', 'date_obtained',
            'skills_demonstrated', 'certificate_image',
        ):
            year = ach.date_obtained.year if ach.date_obtained else 0

            if year not in year_map:
                year_map[year] = []

            year_map[year].append({
                'id'                  : str(ach.id),
                'title'               : ach.title or '',
                'issuing_organization': ach.issuing_organization or '',
                'date_obtained'       : fmt_date(ach.date_obtained),
                'skills_demonstrated' : list(ach.skills_demonstrated or []),
                'certificate_image'   : ach.certificate_image or None,
            })

        by_year = sorted(
            [
                {
                    'year'        : yr,
                    'count'       : len(achs),
                    'achievements': achs,
                }
                for yr, achs in year_map.items() if yr
            ],
            key=lambda x: -x['year']                              # Most recent first
        )

        return jsonify({
            'total'  : sum(y['count'] for y in by_year),
            'by_year': by_year,
        }), 200

    except Exception as e:
        logging.error(f'[CHARTS] /charts/career/achievements-timeline failed: {str(e)}')
        return jsonify({'error': str(e)}), 500