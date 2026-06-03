"""
Charts API — skills_charts_api.py
============================================================
Dedicated analytics endpoints for Skills charts.

Endpoints:
    GET /api/charts/skills/radar           — radar chart by category
    GET /api/charts/skills/distribution    — score band distribution (donut)
    GET /api/charts/skills/top-bars        — top N skills horizontal bar
    GET /api/charts/skills/heatmap         — skill score heatmap grid
    GET /api/charts/skills/timeline        — skill score evolution over time

Author: HussamAlshawi-Dev
"""

import logging                                                     # Error tracking
from flask import Blueprint, jsonify, request                      # Core Flask utilities
from App import cache                                              # Cache decorator
from App.models.profile     import Profile                         # Profile model
from App.models.skills      import ProfileSkill, Skill, SkillType  # Skill models
from App.models.course      import Course                          # For skill source tracking
from App.models.project     import Project                         # For skill source tracking
from App.models.experience  import Experience                      # For skill source tracking
from App.models.self_study  import SelfStudy                       # For skill source tracking
from App.models.achievement import Achievement                     # For skill source tracking
from App.models.education   import Education                       # For skill source tracking
from App.routes.helpers.route_helpers import get_profile, build_skill_payload  # Shared helpers — no duplication

# ── Blueprint registration ────────────────────────────────────────────────────
skills_charts_bp = Blueprint('skills_charts', __name__)



# ─────────────────────────────────────────────────────────────────────────────
# ROUTE 1 — GET /api/charts/skills/radar
# Radar chart: average score per skill category
# ─────────────────────────────────────────────────────────────────────────────
@skills_charts_bp.route('/charts/skills/radar', methods=['GET'])
@cache.cached(timeout=300)
def skills_radar():
    """
    Returns average skill score per SkillType category.
    Powers the Spider/Radar chart in the Skills section.

    Response shape:
    {
        "labels"  : ["Backend", "Frontend", "DevOps"],
        "scores"  : [85.4, 72.1, 60.0],
        "counts"  : [8, 5, 4],
        "colors"  : ["#...", ...],
        "series"  : [
            { "category": "Backend", "avg_score": 85.4, "count": 8, "color": "#..." }
        ]
    }
    """
    try:
        profile = get_profile()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        raw = ProfileSkill.objects(profile=profile).only('skill', 'score').select_related()

        # Build category → scores map
        cat_map = {}
        for ps in raw:
            payload = build_skill_payload(ps)
            if not payload:
                continue

            cat   = payload['skill_type'] or 'Other'              # Group by category
            color = payload['color']

            if cat not in cat_map:
                cat_map[cat] = {'scores': [], 'color': color}

            cat_map[cat]['scores'].append(payload['score'])        # Accumulate scores

        # Build series sorted by avg score descending
        series = []
        for cat, data in cat_map.items():
            scores   = data['scores']
            avg      = round(sum(scores) / len(scores), 1) if scores else 0.0
            series.append({
                'category' : cat,
                'avg_score': avg,
                'count'    : len(scores),
                'color'    : data['color'],
            })

        series.sort(key=lambda x: -x['avg_score'])                # Highest avg first

        return jsonify({
            'labels': [s['category']  for s in series],           # Chart label array
            'scores': [s['avg_score'] for s in series],           # Numeric score array
            'counts': [s['count']     for s in series],           # Skill count per category
            'colors': [s['color']     for s in series],           # Color per category
            'series': series,                                      # Full objects for tooltip
        }), 200

    except Exception as e:
        logging.error(f'[CHARTS] /charts/skills/radar failed: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE 2 — GET /api/charts/skills/distribution
# Donut chart: skills spread across score bands
# ─────────────────────────────────────────────────────────────────────────────
@skills_charts_bp.route('/charts/skills/distribution', methods=['GET'])
@cache.cached(timeout=300)
def skills_distribution():
    """
    Returns the count of skills in each proficiency band.
    Powers the Score Distribution Donut chart.

    Bands:
        Expert       80 – 100
        Advanced     60 – 79
        Intermediate 40 – 59
        Beginner      0 – 39

    Response shape:
    {
        "labels" : ["Expert", "Advanced", "Intermediate", "Beginner"],
        "counts" : [4, 7, 8, 5],
        "colors" : ["#1D9E75", "#378ADD", "#BA7517", "#D85A30"],
        "total"  : 24,
        "series" : [
            { "band": "Expert", "count": 4, "pct": 16.7, "range": "80-100", "color": "#..." }
        ]
    }
    """
    try:
        profile = get_profile()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        scores = [
            int(ps.score or 0)
            for ps in ProfileSkill.objects(profile=profile).only('score', 'skill')
            if ps.skill
        ]

        # Define bands with visual metadata
        BANDS = [
            {'band': 'Expert',       'range': '80-100', 'min': 80, 'max': 100, 'color': '#1D9E75'},
            {'band': 'Advanced',     'range': '60-79',  'min': 60, 'max': 79,  'color': '#378ADD'},
            {'band': 'Intermediate', 'range': '40-59',  'min': 40, 'max': 59,  'color': '#BA7517'},
            {'band': 'Beginner',     'range': '0-39',   'min': 0,  'max': 39,  'color': '#D85A30'},
        ]

        total  = len(scores)

        series = []
        for band in BANDS:
            count = sum(1 for s in scores if band['min'] <= s <= band['max'])
            pct   = round(count / total * 100, 1) if total else 0.0
            series.append({
                'band' : band['band'],
                'range': band['range'],
                'count': count,
                'pct'  : pct,
                'color': band['color'],
            })

        return jsonify({
            'labels': [s['band']  for s in series],                # Chart labels
            'counts': [s['count'] for s in series],                # Raw counts
            'colors': [s['color'] for s in series],                # Band colors
            'total' : total,                                       # Total skill count
            'series': series,                                      # Full objects
        }), 200

    except Exception as e:
        logging.error(f'[CHARTS] /charts/skills/distribution failed: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE 3 — GET /api/charts/skills/top-bars
# Horizontal bar chart: top N skills by score
# Query param: limit (default 12)
# ─────────────────────────────────────────────────────────────────────────────
@skills_charts_bp.route('/charts/skills/top-bars', methods=['GET'])
@cache.cached(timeout=300)
def skills_top_bars():
    """
    Returns the top N skills sorted by proficiency score descending.
    Powers the Horizontal Bar chart in the Skills section.

    Query params:
        limit (int): Number of skills to return. Default 12, max 30.

    Response shape:
    {
        "labels": ["Python", "Flask", "Docker"],
        "scores": [92, 88, 75],
        "colors": ["#3776ab", ...],
        "icons" : ["fab fa-python", ...],
        "series": [
            { "skill_name": "Python", "score": 92, "skill_type": "Backend",
              "icon": "fab fa-python", "color": "#3776ab" }
        ]
    }
    """
    try:
        profile = get_profile()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        # Clamp limit between 1 and 30
        limit = min(max(int(request.args.get('limit', 12)), 1), 30)

        raw     = ProfileSkill.objects(profile=profile).only('skill', 'score').select_related()
        skills  = [p for p in (build_skill_payload(ps) for ps in raw) if p]
        skills.sort(key=lambda x: -x['score'])                     # Highest score first
        top     = skills[:limit]

        return jsonify({
            'labels': [s['skill_name'] for s in top],              # Y-axis labels
            'scores': [s['score']      for s in top],              # X-axis values
            'colors': [s['color']      for s in top],              # Bar colors
            'icons' : [s['icon']       for s in top],              # Tooltip icons
            'series': top,                                         # Full objects
        }), 200

    except Exception as e:
        logging.error(f'[CHARTS] /charts/skills/top-bars failed: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE 4 — GET /api/charts/skills/heatmap
# Skills heatmap grid: category (row) × score band (column)
# ─────────────────────────────────────────────────────────────────────────────
@skills_charts_bp.route('/charts/skills/heatmap', methods=['GET'])
@cache.cached(timeout=300)
def skills_heatmap():
    """
    Returns a 2D grid of skill counts: rows = categories, columns = score bands.
    Powers the Skills Heatmap (category × proficiency matrix).

    Response shape:
    {
        "categories" : ["Backend", "Frontend"],
        "bands"      : ["Expert", "Advanced", "Intermediate", "Beginner"],
        "matrix"     : [
            { "category": "Backend", "values": [3, 4, 1, 0] },
            { "category": "Frontend", "values": [1, 2, 2, 0] }
        ],
        "band_ranges": { "Expert": "80-100", "Advanced": "60-79", ... }
    }
    """
    try:
        profile = get_profile()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        raw    = ProfileSkill.objects(profile=profile).only('skill', 'score').select_related()
        skills = [p for p in (build_skill_payload(ps) for ps in raw) if p]

        # Score band definitions
        BANDS      = ['Expert', 'Advanced', 'Intermediate', 'Beginner']
        BAND_RANGES = {
            'Expert'      : '80-100',
            'Advanced'    : '60-79',
            'Intermediate': '40-59',
            'Beginner'    : '0-39',
        }

        def score_to_band(score):
            """Maps a numeric score to its band label."""
            if score >= 80: return 'Expert'
            if score >= 60: return 'Advanced'
            if score >= 40: return 'Intermediate'
            return 'Beginner'

        # Build category → band counts map
        cat_band_map = {}
        for s in skills:
            cat  = s['skill_type'] or 'Other'
            band = score_to_band(s['score'])
            if cat not in cat_band_map:
                cat_band_map[cat] = {b: 0 for b in BANDS}          # Init all bands to 0
            cat_band_map[cat][band] += 1                            # Increment count

        # Sort categories by total skill count descending
        categories = sorted(cat_band_map.keys(), key=lambda c: -sum(cat_band_map[c].values()))

        matrix = [
            {
                'category': cat,
                'values'  : [cat_band_map[cat][b] for b in BANDS], # Ordered band counts
            }
            for cat in categories
        ]

        return jsonify({
            'categories' : categories,
            'bands'      : BANDS,
            'matrix'     : matrix,
            'band_ranges': BAND_RANGES,
        }), 200

    except Exception as e:
        logging.error(f'[CHARTS] /charts/skills/heatmap failed: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE 5 — GET /api/charts/skills/sources
# Stacked bar: how many skills came from each source model
# ─────────────────────────────────────────────────────────────────────────────
@skills_charts_bp.route('/charts/skills/sources', methods=['GET'])
@cache.cached(timeout=300)
def skills_sources():
    """
    Returns the frequency of each skill across all source records,
    showing which model contributed the most skill development.
    Powers the "Skill Sources" stacked bar chart.

    Response shape:
    {
        "sources"    : ["Experience", "Projects", "Courses", "Self Study", "Education", "Achievements"],
        "counts"     : [42, 35, 28, 15, 10, 8],
        "colors"     : ["#...", ...],
        "skill_counts": {
            "Python": { "Experience": 2, "Projects": 3, "Courses": 1 }
        },
        "top_skills" : [
            { "skill": "Python", "total": 12, "sources": { "Experience": 2, ... } }
        ]
    }
    """
    try:
        profile = get_profile()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        # Source configuration — model, field, label, color
        SOURCE_CONFIG = [
            (Experience,  'skills_acquired',    'Experience',   '#1D9E75'),
            (Project,     'skills_used',         'Projects',     '#378ADD'),
            (Course,      'acquired_skills',     'Courses',      '#BA7517'),
            (SelfStudy,   'skills_learned',      'Self Study',   '#7F77DD'),
            (Education,   'skills_learned',      'Education',    '#D85A30'),
            (Achievement, 'skills_demonstrated', 'Achievements', '#D4537E'),
        ]

        source_totals = {}                                         # {source_label: total_count}
        skill_counts  = {}                                         # {skill_name: {source: count}}
        colors        = {}                                         # {source_label: color}

        for model_class, field_name, label, color in SOURCE_CONFIG:
            source_totals[label] = 0
            colors[label]        = color

            for record in model_class.objects(profile=profile).only(field_name):
                raw_skills = getattr(record, field_name, []) or []
                for raw in raw_skills:
                    normalized = (raw or '').strip().title()       # Normalize to Title Case
                    if not normalized:
                        continue

                    source_totals[label] += 1                      # Increment source total

                    if normalized not in skill_counts:
                        skill_counts[normalized] = {}

                    skill_counts[normalized][label] = (
                        skill_counts[normalized].get(label, 0) + 1
                    )

        # Build top skills by total cross-source frequency (top 15)
        top_skills = sorted(
            [
                {
                    'skill'  : skill,
                    'total'  : sum(sc.values()),
                    'sources': sc,
                }
                for skill, sc in skill_counts.items()
            ],
            key=lambda x: -x['total']
        )[:15]

        source_labels = [cfg[2] for cfg in SOURCE_CONFIG]          # Preserve order

        return jsonify({
            'sources'     : source_labels,
            'counts'      : [source_totals[l] for l in source_labels],
            'colors'      : [colors[l]        for l in source_labels],
            'top_skills'  : top_skills,
        }), 200

    except Exception as e:
        logging.error(f'[CHARTS] /charts/skills/sources failed: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE 6 — GET /api/charts/skills/domain-coverage
# Multi-series radar: per-source scores across all skill categories
# ─────────────────────────────────────────────────────────────────────────────
@skills_charts_bp.route('/charts/skills/domain-coverage', methods=['GET'])
@cache.cached(timeout=300)
def skills_domain_coverage():
    """
    Returns per-source, per-category skill scores for the multi-series radar.
    Each source model (Experience, Projects, Courses, etc.) gets a 0-100 score
    per category. 'Combined' is the weighted average using signal weights.

    Response shape:
    {
        "labels": ["Backend", "Frontend", "DevOps", ...],
        "series": [
            { "name": "Combined",    "color": "#4FC3F7", "values": [...], "dash": "solid" },
            { "name": "Experience",  "color": "#1D9E75", "values": [...], "dash": "dash"  },
            ...
        ]
    }
    """
    try:
        profile = get_profile()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        # Step 1: Build skill_name → category lookup from all Skill docs
        all_skills = Skill.objects().only('skill_name', 'skill_type', 'skill_icon').select_related()
        skill_to_cat = {}
        for skill in all_skills:
            if skill.skill_name and skill.skill_type:
                try:
                    skill_to_cat[skill.skill_name.strip().lower()] = skill.skill_type.name
                except Exception:
                    pass

        # Step 2: Source configuration — model, field, label, color
        SOURCE_CONFIG = [
            (Experience,  'skills_acquired',    'Experience',   '#1D9E75'),
            (Project,     'skills_used',         'Projects',     '#378ADD'),
            (Course,      'acquired_skills',     'Courses',      '#BA7517'),
            (SelfStudy,   'skills_learned',      'Self Study',   '#7F77DD'),
            (Education,   'skills_learned',      'Education',    '#D85A30'),
            (Achievement, 'skills_demonstrated', 'Achievements', '#D4537E'),
        ]

        # Signal weights for Combined calculation
        WEIGHTS = {
            'Experience':   25,
            'Projects':     20,
            'Courses':      15,
            'Achievements': 12,
            'Self Study':   10,
            'Education':     8,
        }
        TOTAL_WEIGHT = sum(WEIGHTS.values())  # 90

        # Step 3: Count occurrences per (source_label, category)
        source_cat_counts = {}  # {source_label: {category: count}}
        all_categories = set()

        for model_class, field_name, label, color in SOURCE_CONFIG:
            cat_counts = {}
            for record in model_class.objects(profile=profile):
                raw_skills = getattr(record, field_name, []) or []
                for raw in raw_skills:
                    normalized = (raw or '').strip().lower()
                    if not normalized:
                        continue
                    cat = skill_to_cat.get(normalized, 'Other')
                    cat_counts[cat] = cat_counts.get(cat, 0) + 1
                    all_categories.add(cat)
            source_cat_counts[label] = cat_counts

        # Step 4: Sort categories alphabetically
        sorted_categories = sorted(all_categories) if all_categories else ['Other']
        if not all_categories:
            sorted_categories = ['Other']

        # Step 5: Normalize counts to 0-100 per source
        def normalize_counts(counts_dict):
            """Convert raw counts to 0-100 scale."""
            cats = counts_dict
            if not cats:
                return {cat: 0 for cat in sorted_categories}
            max_val = max(cats.values())
            if max_val == 0:
                return {cat: 0 for cat in sorted_categories}
            return {cat: round((cats.get(cat, 0) / max_val) * 100) for cat in sorted_categories}

        normalized_scores = {}
        for _, _, label, _ in SOURCE_CONFIG:
            normalized_scores[label] = normalize_counts(source_cat_counts.get(label, {}))

        # Step 6: Compute Combined — weighted average of all sources
        combined_scores = {}
        for cat in sorted_categories:
            weighted_sum = 0
            for _, _, label, _ in SOURCE_CONFIG:
                score = normalized_scores[label].get(cat, 0)
                weighted_sum += score * WEIGHTS.get(label, 1)
            combined_scores[cat] = round(weighted_sum / TOTAL_WEIGHT)

        # Step 7: Build response series
        SERIES_DEF = [
            ('Combined',    '#4FC3F7', 'solid', 3),
            ('Experience',  '#1D9E75', 'dash',  1.5),
            ('Projects',    '#378ADD', 'dash',  1.5),
            ('Courses',     '#BA7517', 'dot',   1.5),
            ('Achievements','#D4537E', 'dot',   1.5),
            ('Self Study',  '#7F77DD', 'dash',  1.5),
            ('Education',   '#D85A30', 'dot',   1.5),
        ]

        series = []
        for name, color, dash, width in SERIES_DEF:
            if name == 'Combined':
                values = [combined_scores.get(cat, 0) for cat in sorted_categories]
            else:
                values = [normalized_scores[name].get(cat, 0) for cat in sorted_categories]
            series.append({
                'name': name,
                'color': color,
                'values': values,
                'dash': dash,
                'width': width,
            })

        return jsonify({
            'labels': sorted_categories,
            'series': series,
        }), 200

    except Exception as e:
        logging.error(f'[CHARTS] /charts/skills/domain-coverage failed: {str(e)}', exc_info=True)
        return jsonify({'error': str(e)}), 500