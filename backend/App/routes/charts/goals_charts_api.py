"""
Charts API — goals_charts_api.py
============================================================
Dedicated analytics endpoints for Goals & Roadmap charts.

Endpoints:
    GET /api/charts/goals/gauge            — overall goals completion gauge
    GET /api/charts/goals/status-donut     — goals by status donut
    GET /api/charts/goals/priority-donut   — goals by priority donut
    GET /api/charts/goals/year-progress    — avg progress per target year bar
    GET /api/charts/goals/skill-gap        — skills gap analysis for each goal
    GET /api/charts/goals/roadmap-timeline — goals plotted on a year timeline

Author: HussamAlshawi-Dev
"""

import logging                                                     # Error tracking
from flask import Blueprint, jsonify                               # Core Flask utilities
from App.models.profile import Profile                             # Profile model
from App.models.goal    import Goal                                # Career goals model
from App.models.skills  import ProfileSkill                        # Skill scores for gap analysis
from App.routes.helpers.route_helpers import (  # Shared helpers — no duplication
    get_profile,
    build_token_map,
    resolve_skill_score,
    calc_progress_pct,
)

# ── Blueprint registration ────────────────────────────────────────────────────
goals_charts_bp = Blueprint('goals_charts', __name__)


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE 1 — GET /api/charts/goals/gauge
# Gauge chart: overall portfolio completion across all goals
# ─────────────────────────────────────────────────────────────────────────────
@goals_charts_bp.route('/charts/goals/gauge', methods=['GET'])
def goals_gauge():
    """
    Returns aggregate goal progress metrics for a Gauge chart.
    Powers the Overall Goals Completion Gauge / Radial Bar.

    Response shape:
    {
        "overall_pct"     : 68.4,
        "achieved_count"  : 3,
        "in_progress_count": 4,
        "total"           : 8,
        "avg_score"       : 64.7,
        "avg_target"      : 94.5,
        "status_breakdown": {
            "Achieved": 3, "In Progress": 4, "Planned": 1, "Paused": 0
        }
    }
    """
    try:
        profile = get_profile()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        goals = list(Goal.objects(profile=profile))

        if not goals:
            return jsonify({
                'overall_pct'      : 0,
                'achieved_count'   : 0,
                'in_progress_count': 0,
                'total'            : 0,
                'avg_score'        : 0,
                'avg_target'       : 0,
                'status_breakdown' : {},
            }), 200

        total = len(goals)

        # Accumulate progress percentages
        pct_values = []
        status_counts = {}

        for goal in goals:
            target  = goal.target_score  or 100
            current = goal.current_score or 0
            pct     = calc_progress_pct(current, target)
            pct_values.append(pct)

            status = goal.status or 'Planned'
            status_counts[status] = status_counts.get(status, 0) + 1

        overall_pct = round(sum(pct_values) / total, 1) if pct_values else 0.0
        avg_score   = round(sum(g.current_score or 0 for g in goals) / total, 1)
        avg_target  = round(sum(g.target_score  or 0 for g in goals) / total, 1)

        return jsonify({
            'overall_pct'      : overall_pct,
            'achieved_count'   : status_counts.get('Achieved', 0),
            'in_progress_count': status_counts.get('In Progress', 0),
            'total'            : total,
            'avg_score'        : avg_score,
            'avg_target'       : avg_target,
            'status_breakdown' : status_counts,
        }), 200

    except Exception as e:
        logging.error(f'[CHARTS] /charts/goals/gauge failed: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE 2 — GET /api/charts/goals/status-donut
# Donut: goals split by current status with visual tokens
# ─────────────────────────────────────────────────────────────────────────────
@goals_charts_bp.route('/charts/goals/status-donut', methods=['GET'])
def goals_status_donut():
    """
    Returns goal counts per status value for a Donut chart.
    Powers the Goal Status Distribution Donut.

    Response shape:
    {
        "labels": ["Achieved", "In Progress", "Planned", "Paused"],
        "counts": [3, 4, 1, 0],
        "colors": ["#1D9E75", "#378ADD", "#BA7517", "#888780"],
        "total" : 8,
        "series": [
            { "status": "Achieved", "count": 3, "pct": 37.5, "color": "#1D9E75",
              "bg": "#E1F5EE" }
        ]
    }
    """
    try:
        profile = get_profile()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        STATUS_META = {
            'Achieved'   : {'color': '#1D9E75', 'bg': '#E1F5EE'},
            'In Progress': {'color': '#378ADD', 'bg': '#E6F1FB'},
            'Planned'    : {'color': '#BA7517', 'bg': '#FAEEDA'},
            'Paused'     : {'color': '#888780', 'bg': '#F1EFE8'},
        }

        status_counts = {s: 0 for s in STATUS_META}               # Pre-seed all statuses

        for goal in Goal.objects(profile=profile):
            status = goal.status or 'Planned'
            if status in status_counts:
                status_counts[status] += 1
            else:
                status_counts[status] = 1                          # Handle unexpected values

        total = sum(status_counts.values()) or 1

        series = [
            {
                'status': status,
                'count' : count,
                'pct'   : round(count / total * 100, 1),
                'color' : STATUS_META.get(status, {}).get('color', '#888780'),
                'bg'    : STATUS_META.get(status, {}).get('bg',    '#F1EFE8'),
            }
            for status, count in status_counts.items()
        ]

        return jsonify({
            'labels': [s['status'] for s in series],
            'counts': [s['count']  for s in series],
            'colors': [s['color']  for s in series],
            'total' : total,
            'series': series,
        }), 200

    except Exception as e:
        logging.error(f'[CHARTS] /charts/goals/status-donut failed: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE 3 — GET /api/charts/goals/priority-donut
# Donut: goals split by priority level
# ─────────────────────────────────────────────────────────────────────────────
@goals_charts_bp.route('/charts/goals/priority-donut', methods=['GET'])
def goals_priority_donut():
    """
    Returns goal counts per priority level for a Donut chart.
    Powers the Goal Priority Distribution Donut.

    Response shape:
    {
        "labels": ["Critical", "High", "Medium", "Low"],
        "counts": [2, 3, 2, 1],
        "colors": ["#D85A30", "#BA7517", "#378ADD", "#888780"],
        "series": [
            { "priority": "Critical", "count": 2, "pct": 25.0, "color": "#D85A30" }
        ]
    }
    """
    try:
        profile = get_profile()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        PRIORITY_META = {
            'Critical': '#D85A30',
            'High'    : '#BA7517',
            'Medium'  : '#378ADD',
            'Low'     : '#888780',
        }

        priority_counts = {p: 0 for p in PRIORITY_META}           # Pre-seed all priorities

        for goal in Goal.objects(profile=profile):
            pri = goal.priority or 'Medium'
            if pri in priority_counts:
                priority_counts[pri] += 1
            else:
                priority_counts[pri] = 1

        total = sum(priority_counts.values()) or 1

        series = [
            {
                'priority': pri,
                'count'   : count,
                'pct'     : round(count / total * 100, 1),
                'color'   : PRIORITY_META.get(pri, '#888780'),
            }
            for pri, count in priority_counts.items()
        ]

        return jsonify({
            'labels': [s['priority'] for s in series],
            'counts': [s['count']    for s in series],
            'colors': [s['color']    for s in series],
            'total' : total,
            'series': series,
        }), 200

    except Exception as e:
        logging.error(f'[CHARTS] /charts/goals/priority-donut failed: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE 4 — GET /api/charts/goals/year-progress
# Grouped bar: goals per target year with avg progress
# ─────────────────────────────────────────────────────────────────────────────
@goals_charts_bp.route('/charts/goals/year-progress', methods=['GET'])
def goals_year_progress():
    """
    Returns goal count and average progress percentage per target year.
    Powers the Goal Progress by Year Grouped Bar chart.

    Response shape:
    {
        "years"       : ["2024", "2025", "2026"],
        "counts"      : [3, 4, 1],
        "avg_progress": [45.3, 72.1, 10.0],
        "series"      : [
            {
                "year"        : "2025",
                "count"       : 4,
                "avg_progress": 72.1,
                "goals"       : [
                    { "name": "Senior Python Dev", "status": "In Progress", "progress_pct": 80 }
                ]
            }
        ]
    }
    """
    try:
        profile = get_profile()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        year_map = {}                                              # {year_str: {goals: [], pcts: []}}

        for goal in Goal.objects(profile=profile):
            year   = str(goal.target_year) if goal.target_year else 'Unknown'
            target = goal.target_score  or 100
            current= goal.current_score or 0
            pct    = calc_progress_pct(current, target)

            if year not in year_map:
                year_map[year] = {'pcts': [], 'goals': []}

            year_map[year]['pcts'].append(pct)
            year_map[year]['goals'].append({
                'name'        : goal.goal_name or '',
                'status'      : goal.status   or 'Planned',
                'priority'    : goal.priority or 'Medium',
                'progress_pct': pct,
            })

        series = sorted(
            [
                {
                    'year'        : yr,
                    'count'       : len(data['pcts']),
                    'avg_progress': round(sum(data['pcts']) / len(data['pcts']), 1) if data['pcts'] else 0.0,
                    'goals'       : data['goals'],
                }
                for yr, data in year_map.items()
            ],
            key=lambda x: x['year']                               # Chronological order
        )

        return jsonify({
            'years'       : [s['year']         for s in series],
            'counts'      : [s['count']         for s in series],
            'avg_progress': [s['avg_progress']  for s in series],
            'series'      : series,
        }), 200

    except Exception as e:
        logging.error(f'[CHARTS] /charts/goals/year-progress failed: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE 5 — GET /api/charts/goals/skill-gap
# Radar/Bar: skill gap analysis — current vs required per goal
# ─────────────────────────────────────────────────────────────────────────────
@goals_charts_bp.route('/charts/goals/skill-gap', methods=['GET'])
def goals_skill_gap():
    """
    Returns per-goal skill gap analysis: current skill scores vs required skills.
    Powers the Skill Gap Radar / Bullet chart for each goal.

    Response shape:
    {
        "goals": [
            {
                "id"        : "...",
                "goal_name" : "Senior Python Developer",
                "target_score": 95,
                "current_score": 72,
                "progress_pct": 75,
                "skill_gaps": [
                    {
                        "skill_name"   : "Linear Algebra",
                        "current_score": 45,
                        "required_score": 95,
                        "gap"          : 50,
                        "matched"      : true,
                        "pct_of_target": 47.4
                    }
                ],
                "matched_count"  : 5,
                "unmatched_count": 2,
                "avg_gap"        : 28.3
            }
        ]
    }
    """
    try:
        profile = get_profile()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        # Build token map once — reused for all goals
        token_map = build_token_map(profile)

        goals = Goal.objects(profile=profile).order_by('target_year', '-priority')
        result = []

        for goal in goals:
            target  = goal.target_score  or 100
            current = goal.current_score or 0
            pct     = calc_progress_pct(current, target)

            skill_gaps      = []
            matched_count   = 0
            unmatched_count = 0
            total_gap       = 0.0

            for skill_name in (goal.required_skills or []):
                if not skill_name:
                    continue

                skill_score, matched = resolve_skill_score(skill_name, token_map)
                gap                  = max(0, target - skill_score)    # Gap to target
                pct_of_target        = round(skill_score / target * 100, 1) if target else 0.0

                if matched:
                    matched_count  += 1
                else:
                    unmatched_count += 1

                total_gap += gap

                skill_gaps.append({
                    'skill_name'    : skill_name,
                    'current_score' : skill_score,                 # 0 if not matched
                    'required_score': target,                      # Goal's target score
                    'gap'           : gap,                         # Points needed to close
                    'matched'       : matched,                     # Was a skill found?
                    'pct_of_target' : pct_of_target,               # % toward target
                })

            # Sort: largest gap first (priority for study)
            skill_gaps.sort(key=lambda x: -x['gap'])

            skill_count = matched_count + unmatched_count
            avg_gap     = round(total_gap / skill_count, 1) if skill_count else 0.0

            result.append({
                'id'             : str(goal.id),
                'goal_name'      : goal.goal_name or '',
                'status'         : goal.status    or 'Planned',
                'priority'       : goal.priority  or 'Medium',
                'target_year'    : goal.target_year,
                'target_score'   : int(target),
                'current_score'  : int(current),
                'progress_pct'   : pct,
                'skill_gaps'     : skill_gaps,
                'matched_count'  : matched_count,
                'unmatched_count': unmatched_count,
                'avg_gap'        : avg_gap,
            })

        return jsonify({'count': len(result), 'goals': result}), 200

    except Exception as e:
        logging.error(f'[CHARTS] /charts/goals/skill-gap failed: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE 6 — GET /api/charts/goals/roadmap-timeline
# Goals plotted by target year for a roadmap bubble/gantt chart
# ─────────────────────────────────────────────────────────────────────────────
@goals_charts_bp.route('/charts/goals/roadmap-timeline', methods=['GET'])
def roadmap_timeline():
    """
    Returns all goals formatted for a roadmap timeline / bubble chart.
    Each goal has a year, priority weight (bubble size), progress, and status color.
    Powers the Career Roadmap Timeline Visualization.

    Response shape:
    {
        "min_year": 2024,
        "max_year": 2028,
        "goals": [
            {
                "id"           : "...",
                "goal_name"    : "Senior Python Developer",
                "sub_title"    : "...",
                "target_year"  : 2025,
                "priority"     : "Critical",
                "priority_weight": 4,
                "status"       : "In Progress",
                "current_score": 72,
                "target_score" : 95,
                "progress_pct" : 75,
                "status_color" : "#378ADD",
                "priority_color": "#D85A30",
                "required_skills_count": 8
            }
        ]
    }
    """
    try:
        profile = get_profile()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        STATUS_COLORS   = {
            'Achieved'   : '#1D9E75',
            'In Progress': '#378ADD',
            'Planned'    : '#BA7517',
            'Paused'     : '#888780',
        }
        PRIORITY_COLORS = {
            'Critical': '#D85A30',
            'High'    : '#BA7517',
            'Medium'  : '#378ADD',
            'Low'     : '#888780',
        }
        PRIORITY_WEIGHTS = {                                       # Bubble size multiplier
            'Critical': 4,
            'High'    : 3,
            'Medium'  : 2,
            'Low'     : 1,
        }

        goals  = list(Goal.objects(profile=profile).order_by('target_year', '-priority'))
        result = []

        for goal in goals:
            target  = goal.target_score  or 100
            current = goal.current_score or 0
            pct     = calc_progress_pct(current, target)
            status  = goal.status   or 'Planned'
            pri     = goal.priority or 'Medium'

            result.append({
                'id'                   : str(goal.id),
                'goal_name'            : goal.goal_name or '',
                'sub_title'            : goal.sub_title or '',
                'target_year'          : goal.target_year,
                'priority'             : pri,
                'priority_weight'      : PRIORITY_WEIGHTS.get(pri, 1),   # Bubble size
                'status'               : status,
                'current_score'        : int(current),
                'target_score'         : int(target),
                'progress_pct'         : pct,
                'status_color'         : STATUS_COLORS.get(status,   '#888780'),
                'priority_color'       : PRIORITY_COLORS.get(pri,    '#888780'),
                'required_skills_count': len(goal.required_skills or []),
            })

        valid_years = [g['target_year'] for g in result if g['target_year']]

        return jsonify({
            'min_year': min(valid_years) if valid_years else None,
            'max_year': max(valid_years) if valid_years else None,
            'count'   : len(result),
            'goals'   : result,
        }), 200

    except Exception as e:
        logging.error(f'[CHARTS] /charts/goals/roadmap-timeline failed: {str(e)}')
        return jsonify({'error': str(e)}), 500