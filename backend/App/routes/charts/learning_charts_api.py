"""
Charts API — learning_charts_api.py
============================================================
Dedicated analytics endpoints for Learning & Development charts.

Endpoints:
    GET /api/charts/learning/courses-by-year      — courses completion per year (area chart)
    GET /api/charts/learning/providers             — top course providers horizontal bar
    GET /api/charts/learning/skills-word-cloud     — skills frequency word cloud data
    GET /api/charts/learning/self-study-types      — self-study type donut
    GET /api/charts/learning/self-study-tracks     — self-study by track vertical bar
    GET /api/charts/learning/learning-vs-output    — learning input vs project output grouped bar

Author: HussamAlshawi-Dev
"""

import logging                                                     # Error tracking
from collections import defaultdict                                # Grouped accumulation
from flask import Blueprint, jsonify, request                      # Core Flask utilities
from App.models.profile    import Profile                          # Profile model
from App.models.course     import Course                           # Certifications model
from App.models.self_study import SelfStudy                        # Self-learning model
from App.models.education  import Education                        # Academic records model
from App.models.project    import Project                          # Projects model (for comparison)


# ── Blueprint registration ────────────────────────────────────────────────────
learning_charts_bp = Blueprint('learning_charts', __name__)


# ─────────────────────────────────────────────────────────────────────────────
# HELPER — fetch active profile
# ─────────────────────────────────────────────────────────────────────────────
def _get_profile():
    """Fetches the first active portfolio Profile document."""
    return Profile.objects.first()


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE 1 — GET /api/charts/learning/courses-by-year
# Area chart: courses and certifications completed per year/month
# ─────────────────────────────────────────────────────────────────────────────
@learning_charts_bp.route('/charts/learning/courses-by-year', methods=['GET'])
def courses_by_year():
    """
    Returns course completion counts per year and per month.
    Powers the Course Completion Rate Area Chart.

    Query params:
        granularity: "year" (default) or "month"

    Response shape — year:
    {
        "granularity": "year",
        "labels"     : ["2020", "2021", "2022", "2023"],
        "counts"     : [2, 5, 8, 6],
        "series"     : [
            { "period": "2022", "count": 8, "courses": ["Python Masterclass", ...] }
        ]
    }
    """
    try:
        profile = _get_profile()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        granularity = request.args.get('granularity', 'year')     # year or month
        period_map  = defaultdict(list)                            # {period: [course_names]}

        for course in Course.objects(profile=profile).order_by('end_date'):
            if not course.end_date:
                continue

            # Build the period key based on granularity
            period = (
                str(course.end_date.year)             if granularity == 'year'
                else course.end_date.strftime('%Y-%m')             # YYYY-MM for monthly
            )

            period_map[period].append(course.course_name or 'Untitled')

        # Build sorted series
        series = sorted(
            [
                {
                    'period' : period,
                    'count'  : len(names),
                    'courses': names,
                }
                for period, names in period_map.items()
            ],
            key=lambda x: x['period']                             # Chronological
        )

        return jsonify({
            'granularity': granularity,
            'labels'     : [s['period'] for s in series],         # X-axis labels
            'counts'     : [s['count']  for s in series],         # Y-axis values
            'series'     : series,
        }), 200

    except Exception as e:
        logging.error(f'[CHARTS] /charts/learning/courses-by-year failed: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE 2 — GET /api/charts/learning/providers
# Horizontal bar: top course providers ranked by course count
# ─────────────────────────────────────────────────────────────────────────────
@learning_charts_bp.route('/charts/learning/providers', methods=['GET'])
def top_providers():
    """
    Returns the most-used learning platforms/providers sorted by course count.
    Powers the Top Knowledge Providers Horizontal Bar chart.

    Query params:
        limit (int): Number of providers to return. Default 10, max 20.

    Response shape:
    {
        "labels"  : ["Coursera", "Udemy", "Udacity"],
        "counts"  : [12, 8, 5],
        "series"  : [
            { "provider": "Coursera", "count": 12, "pct": 48.0,
              "courses": ["ML Specialization", ...] }
        ]
    }
    """
    try:
        profile = _get_profile()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        limit       = min(max(int(request.args.get('limit', 10)), 1), 20)
        provider_map = defaultdict(list)                           # {provider: [course_names]}

        for course in Course.objects(profile=profile):
            org = (course.organization or 'Unknown').strip()
            provider_map[org].append(course.course_name or 'Untitled')

        total = sum(len(v) for v in provider_map.values()) or 1

        series = sorted(
            [
                {
                    'provider': org,
                    'count'   : len(names),
                    'pct'     : round(len(names) / total * 100, 1),
                    'courses' : names,
                }
                for org, names in provider_map.items()
            ],
            key=lambda x: -x['count']                             # Most courses first
        )[:limit]

        return jsonify({
            'labels': [s['provider'] for s in series],
            'counts': [s['count']    for s in series],
            'series': series,
        }), 200

    except Exception as e:
        logging.error(f'[CHARTS] /charts/learning/providers failed: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE 3 — GET /api/charts/learning/skills-word-cloud
# Word cloud data: skills frequency across all learning records
# ─────────────────────────────────────────────────────────────────────────────
@learning_charts_bp.route('/charts/learning/skills-word-cloud', methods=['GET'])
def skills_word_cloud():
    """
    Returns skill name + frequency across Courses, Self-Study, and Education.
    Powers the Skills Word Cloud widget.
    Font size in the cloud = frequency rank.

    Query params:
        limit (int): Maximum number of words. Default 40, max 80.
        source: Filter by source ("courses", "self_study", "education", or "all"). Default "all".

    Response shape:
    {
        "words": [
            { "text": "Python", "count": 12, "weight": 100, "source_breakdown": {...} }
        ],
        "max_count": 12,
        "total_unique": 45
    }
    """
    try:
        profile = _get_profile()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        limit  = min(max(int(request.args.get('limit', 40)), 1), 80)
        source = request.args.get('source', 'all').lower()         # Filter by source

        word_map = defaultdict(lambda: defaultdict(int))           # {skill: {source: count}}

        # Courses source
        if source in ('all', 'courses'):
            for course in Course.objects(profile=profile):
                for raw in (course.acquired_skills or []):
                    skill = (raw or '').strip().title()
                    if skill: word_map[skill]['Courses'] += 1

        # Self-Study source
        if source in ('all', 'self_study'):
            for item in SelfStudy.objects(profile=profile):
                for raw in (item.skills_learned or []):
                    skill = (raw or '').strip().title()
                    if skill: word_map[skill]['Self Study'] += 1

        # Education source
        if source in ('all', 'education'):
            for edu in Education.objects(profile=profile):
                for raw in (edu.skills_learned or []):
                    skill = (raw or '').strip().title()
                    if skill: word_map[skill]['Education'] += 1

        if not word_map:
            return jsonify({'words': [], 'max_count': 0, 'total_unique': 0}), 200

        # Calculate totals per skill
        skill_totals = {
            skill: sum(counts.values())
            for skill, counts in word_map.items()
        }

        max_count = max(skill_totals.values()) or 1

        # Sort by frequency and limit
        sorted_skills = sorted(skill_totals.items(), key=lambda x: -x[1])[:limit]

        words = [
            {
                'text'            : skill,
                'count'           : count,
                'weight'          : round(count / max_count * 100),   # 0-100 relative weight
                'source_breakdown': dict(word_map[skill]),             # Per-source counts
            }
            for skill, count in sorted_skills
        ]

        return jsonify({
            'words'       : words,
            'max_count'   : max_count,
            'total_unique': len(word_map),
        }), 200

    except Exception as e:
        logging.error(f'[CHARTS] /charts/learning/skills-word-cloud failed: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE 4 — GET /api/charts/learning/self-study-types
# Donut: self-study activities split by learning type
# ─────────────────────────────────────────────────────────────────────────────
@learning_charts_bp.route('/charts/learning/self-study-types', methods=['GET'])
def self_study_types():
    """
    Returns the count of self-study activities per learning_type.
    Powers the Self-Study Types Donut chart.

    Response shape:
    {
        "labels" : ["Book", "Article", "Course", "Workshop", "Other"],
        "counts" : [8, 5, 4, 2, 1],
        "colors" : ["#7F77DD", "#378ADD", "#1D9E75", "#BA7517", "#888780"],
        "series" : [
            { "type": "Book", "count": 8, "pct": 40.0, "color": "#7F77DD",
              "titles": ["Clean Code", ...] }
        ]
    }
    """
    try:
        profile = _get_profile()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        TYPE_COLORS = {
            'Book'    : '#7F77DD',
            'Article' : '#378ADD',
            'Course'  : '#1D9E75',
            'Workshop': '#BA7517',
            'Other'   : '#888780',
        }

        type_map = defaultdict(list)                               # {type: [titles]}

        for item in SelfStudy.objects(profile=profile):
            ltype = item.learning_type or 'Other'
            type_map[ltype].append(item.title or 'Untitled')

        total = sum(len(v) for v in type_map.values()) or 1

        series = sorted(
            [
                {
                    'type'  : ltype,
                    'count' : len(titles),
                    'pct'   : round(len(titles) / total * 100, 1),
                    'color' : TYPE_COLORS.get(ltype, '#888780'),
                    'titles': titles[:5],                          # Preview of first 5 titles
                }
                for ltype, titles in type_map.items()
            ],
            key=lambda x: -x['count']
        )

        return jsonify({
            'labels': [s['type']  for s in series],
            'counts': [s['count'] for s in series],
            'colors': [s['color'] for s in series],
            'total' : total,
            'series': series,
        }), 200

    except Exception as e:
        logging.error(f'[CHARTS] /charts/learning/self-study-types failed: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE 5 — GET /api/charts/learning/self-study-tracks
# Vertical bar: self-study count per learning track (Category)
# ─────────────────────────────────────────────────────────────────────────────
@learning_charts_bp.route('/charts/learning/self-study-tracks', methods=['GET'])
def self_study_tracks():
    """
    Returns self-study activity count per Category track.
    Powers the Self-Study Tracks Vertical Bar chart.

    Response shape:
    {
        "labels": ["Python", "AI/ML", "DevOps"],
        "counts": [8, 5, 4],
        "series": [
            { "track": "Python", "count": 8, "items": [{"title": "...", "type": "Book"}] }
        ]
    }
    """
    try:
        profile = _get_profile()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        track_map = defaultdict(list)                              # {track_name: [items]}

        for item in SelfStudy.objects(profile=profile).select_related():
            # Resolve category/track name safely
            track = 'Uncategorized'
            if item.track:
                try:
                    track = item.track.name or 'Uncategorized'
                except Exception:
                    track = 'Uncategorized'

            track_map[track].append({
                'title': item.title or 'Untitled',
                'type' : item.learning_type or 'Other',
            })

        series = sorted(
            [
                {
                    'track': track,
                    'count': len(items),
                    'items': items[:5],                            # Preview of first 5
                }
                for track, items in track_map.items()
            ],
            key=lambda x: -x['count']
        )

        return jsonify({
            'labels': [s['track'] for s in series],
            'counts': [s['count'] for s in series],
            'series': series,
        }), 200

    except Exception as e:
        logging.error(f'[CHARTS] /charts/learning/self-study-tracks failed: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE 6 — GET /api/charts/learning/learning-vs-output
# Grouped bar: learning activities vs projects output per category
# ─────────────────────────────────────────────────────────────────────────────
@learning_charts_bp.route('/charts/learning/learning-vs-output', methods=['GET'])
def learning_vs_output():
    """
    Compares learning inputs (Courses + Self-Study) against project outputs
    grouped by Category, showing the ROI of education.
    Powers the Learning vs. Output Grouped Bar chart.

    Response shape:
    {
        "categories"    : ["Web Dev", "AI/ML", "DevOps"],
        "learning_counts": [8, 5, 3],
        "project_counts" : [6, 2, 1],
        "ratios"         : [0.75, 0.40, 0.33],
        "series"         : [
            {
                "category"      : "Web Dev",
                "learning_count": 8,
                "project_count" : 6,
                "ratio"         : 0.75
            }
        ]
    }
    """
    try:
        profile = _get_profile()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        # Accumulate learning counts per category (from Courses)
        learning_map = defaultdict(int)                            # {cat: learning_count}

        for course in Course.objects(profile=profile).select_related():
            cat = 'Uncategorized'
            if course.category:
                try:
                    cat = course.category.name or 'Uncategorized'
                except Exception:
                    pass
            learning_map[cat] += 1

        for item in SelfStudy.objects(profile=profile).select_related():
            cat = 'Uncategorized'
            if item.track:
                try:
                    cat = item.track.name or 'Uncategorized'
                except Exception:
                    pass
            learning_map[cat] += 1

        # Accumulate project counts per category
        project_map = defaultdict(int)                             # {cat: project_count}

        for proj in Project.objects(profile=profile).select_related():
            cat = 'Uncategorized'
            if proj.category:
                try:
                    cat = proj.category.name or 'Uncategorized'
                except Exception:
                    pass
            project_map[cat] += 1

        # Merge all categories from both maps
        all_categories = set(learning_map.keys()) | set(project_map.keys())

        series = sorted(
            [
                {
                    'category'      : cat,
                    'learning_count': learning_map.get(cat, 0),
                    'project_count' : project_map.get(cat, 0),
                    # Ratio: projects per learning item (conversion rate)
                    'ratio'         : round(
                        project_map.get(cat, 0) / learning_map.get(cat, 1), 2
                    ),
                }
                for cat in all_categories
            ],
            key=lambda x: -(x['learning_count'] + x['project_count'])  # Most active first
        )

        return jsonify({
            'categories'     : [s['category']       for s in series],
            'learning_counts': [s['learning_count'] for s in series],
            'project_counts' : [s['project_count']  for s in series],
            'ratios'         : [s['ratio']           for s in series],
            'series'         : series,
        }), 200

    except Exception as e:
        logging.error(f'[CHARTS] /charts/learning/learning-vs-output failed: {str(e)}')
        return jsonify({'error': str(e)}), 500