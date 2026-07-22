"""
Portfolio Overview API — overview_data_api.py
================================================
Single composite endpoint that returns ALL data needed by the
OverviewSection in one request. Eliminates N+1 waterfall and
ensures the page opens with complete charts.

Endpoint:
    GET /api/portfolio/overview-data — composite overview payload

Author: HussamAlshawi-Dev
"""

import logging
from collections import defaultdict
from flask import Blueprint, jsonify
from App import cache
from App.models.profile import Profile
from App.models.skills import ProfileSkill
from App.models.goal import Goal
from App.models.course import Course
from App.models.self_study import SelfStudy
from App.models.education import Education
from App.models.experience import Experience
from App.models.project import Project
from App.models.achievement import Achievement
from App.models.language import Language

overview_data_bp = Blueprint('overview_data', __name__)


# ── Source config for skills-by-source mapping ─────────────────────────────
SOURCE_CONFIG = [
    (Course,      'acquired_skills',     'Courses'),
    (SelfStudy,   'skills_learned',      'Self Study'),
    (Education,   'skills_learned',      'Education'),
    (Experience,  'skills_acquired',     'Experience'),
    (Project,     'skills_used',         'Projects'),
    (Achievement, 'skills_demonstrated', 'Achievements'),
]

SOURCE_COLORS = {
    'Experience':   '#1D9E75',
    'Projects':     '#378ADD',
    'Courses':      '#BA7517',
    'Self Study':   '#7F77DD',
    'Education':    '#D85A30',
    'Achievements': '#D4537E',
}


# ── Helpers ────────────────────────────────────────────────────────────────

def _get_profile():
    return Profile.objects.first()


def _normalize(name):
    return name.strip().title() if name else ''


def _build_source_map(profile):
    """Build {skill_name: {source_key: [labels]}} from all source models."""
    source_map = defaultdict(lambda: defaultdict(list))

    field_map = {
        Course:      ('acquired_skills',  'course_name'),
        SelfStudy:   ('skills_learned',   'title'),
        Education:   ('skills_learned',   'degree'),
        Experience:  ('skills_acquired',  'job_title'),
        Project:     ('skills_used',      'project_name'),
        Achievement: ('skills_demonstrated', 'title'),
    }

    for model_class, skill_field, source_key in SOURCE_CONFIG:
        extra_fields = field_map.get(model_class, (skill_field,))
        for record in model_class.objects(profile=profile).only(skill_field, *extra_fields):
            skills = getattr(record, skill_field, []) or []
            for raw in skills:
                if not raw:
                    continue
                norm = _normalize(raw)
                if not norm:
                    continue
                label_fns = {
                    'Courses':      lambda r: getattr(r, 'course_name', ''),
                    'Self Study':   lambda r: getattr(r, 'title', ''),
                    'Education':    lambda r: f"{getattr(r, 'degree', '')} at {getattr(r, 'institution', '')}",
                    'Experience':   lambda r: f"{getattr(r, 'job_title', '')} @ {getattr(r, 'company_name', '')}",
                    'Projects':     lambda r: getattr(r, 'project_name', ''),
                    'Achievements': lambda r: getattr(r, 'title', ''),
                }
                label = label_fns.get(source_key, lambda r: '')(record).strip()
                source_map[norm][source_key].append(label)

    return source_map


def _build_goal_skill_map(goals):
    gsm = defaultdict(list)
    for g in goals:
        for raw in (g.required_skills or []):
            gsm[_normalize(raw)].append(g.goal_name or '')
    return gsm


def _build_skills_payload(profile_skills, source_map, goal_skill_map):
    type_map = defaultdict(list)
    skills_with_sources = []

    for ps in profile_skills:
        if not ps.skill:
            continue
        skill_name = ps.skill.skill_name or ''
        score = int(ps.score or 0)
        meta = ps.skill.get_display_meta()

        skill_type = ''
        if ps.skill.skill_type:
            try:
                skill_type = ps.skill.skill_type.name or 'Other'
            except Exception:
                skill_type = 'Other'
        else:
            skill_type = 'Other'

        norm = _normalize(skill_name)
        raw_sources = source_map.get(norm, {})
        sources = {k: list(set(v)) for k, v in raw_sources.items()}
        related_goals = list(set(goal_skill_map.get(norm, [])))

        skills_with_sources.append({
            'skill_name': skill_name, 'skill_type': skill_type, 'score': score,
            'icon': meta.get('icon', 'fas fa-code'), 'color': meta.get('color', '#64748b'),
            'sources': sources, 'related_goals': related_goals,
        })
        type_map[skill_type].append(score)

    skills_by_type = sorted(
        [
            {
                'type': cat, 'avg_score': round(sum(scores) / len(scores), 1),
                'count': len(scores),
                'skills': [s for s in skills_with_sources if s['skill_type'] == cat],
            }
            for cat, scores in type_map.items()
        ],
        key=lambda x: -x['avg_score']
    )
    return skills_by_type, skills_with_sources


def _build_timeline(courses, self_studies, educations):
    timeline_map = defaultdict(lambda: {
        'courses': [], 'self_studies': [], 'educations': [], 'all_skills': set(),
    })

    for c in courses:
        yr = c.end_date.year if c.end_date else (c.start_date.year if c.start_date else None)
        if yr:
            entry = {
                'name': c.course_name or '', 'org': c.organization or '',
                'skills': [s.strip().title() for s in (c.acquired_skills or []) if s],
            }
            timeline_map[yr]['courses'].append(entry)
            for s in entry['skills']:
                timeline_map[yr]['all_skills'].add(s)

    for s in self_studies:
        yr = s.end_date.year if s.end_date else (s.start_date.year if s.start_date else None)
        if yr:
            entry = {
                'title': s.title or '', 'type': s.learning_type or 'Other',
                'skills': [sk.strip().title() for sk in (s.skills_learned or []) if sk],
            }
            timeline_map[yr]['self_studies'].append(entry)
            for sk in entry['skills']:
                timeline_map[yr]['all_skills'].add(sk)

    for e in educations:
        yr = e.end_date.year if e.end_date else (e.start_date.year if e.start_date else None)
        if yr:
            entry = {
                'institution': e.institution or '', 'degree': e.degree or '', 'major': e.major or '',
                'skills': [sk.strip().title() for sk in (e.skills_learned or []) if sk],
            }
            timeline_map[yr]['educations'].append(entry)
            for sk in entry['skills']:
                timeline_map[yr]['all_skills'].add(sk)

    return sorted(
        [
            {
                'year': yr, 'courses': data['courses'], 'self_studies': data['self_studies'],
                'educations': data['educations'], 'skills_gained': sorted(data['all_skills']),
                'new_skills_count': len(data['all_skills']),
            }
            for yr, data in timeline_map.items()
        ],
        key=lambda x: x['year']
    )


def _build_goals_payload(goals, profile_skills):
    skill_score_map = {}
    for ps in profile_skills:
        if ps.skill:
            skill_score_map[_normalize(ps.skill.skill_name)] = int(ps.score or 0)

    result = []
    for g in goals:
        tgt = g.target_score or 95
        cur = g.current_score or 0
        progress_pct = min(round((cur / tgt) * 100, 1), 100)
        skills_needed = []
        for raw in (g.required_skills or []):
            name = _normalize(raw)
            current_score = skill_score_map.get(name, 0)
            skills_needed.append({
                'name': raw.strip(), 'current': current_score,
                'target': tgt, 'gap': max(tgt - current_score, 0),
            })
        skills_needed.sort(key=lambda x: -x['gap'])
        result.append({
            'goal_name': g.goal_name or '', 'sub_title': g.sub_title or '',
            'status': g.status or 'Planned', 'priority': g.priority or 'Medium',
            'target_year': g.target_year, 'current_score': cur, 'target_score': tgt,
            'progress_pct': progress_pct, 'skills_needed': skills_needed,
        })
    return result


def _build_source_contribution(source_map):
    return sorted(
        [
            {
                'source': source_key,
                'unique_skills': len({norm for norm, src in source_map.items() if src.get(source_key)}),
            }
            for _, _, source_key in SOURCE_CONFIG
        ],
        key=lambda x: -x['unique_skills']
    )


def _build_skills_sources(profile):
    """Build the skills sources stacked bar data."""
    source_totals = {}
    skill_counts = {}
    colors = {}

    for model_class, field_name, label, color in [
        (Experience,  'skills_acquired',    'Experience',   '#1D9E75'),
        (Project,     'skills_used',         'Projects',     '#378ADD'),
        (Course,      'acquired_skills',     'Courses',      '#BA7517'),
        (SelfStudy,   'skills_learned',      'Self Study',   '#7F77DD'),
        (Education,   'skills_learned',      'Education',    '#D85A30'),
        (Achievement, 'skills_demonstrated', 'Achievements', '#D4537E'),
    ]:
        source_totals[label] = 0
        colors[label] = color

        for record in model_class.objects(profile=profile).only(field_name):
            raw_skills = getattr(record, field_name, []) or []
            for raw in raw_skills:
                normalized = (raw or '').strip().title()
                if not normalized:
                    continue
                source_totals[label] += 1
                if normalized not in skill_counts:
                    skill_counts[normalized] = {}
                skill_counts[normalized][label] = (
                    skill_counts[normalized].get(label, 0) + 1
                )

    top_skills = sorted(
        [
            {
                'skill': skill,
                'total': sum(sc.values()),
                'sources': sc,
            }
            for skill, sc in skill_counts.items()
        ],
        key=lambda x: -x['total']
    )[:15]

    source_labels = ['Experience', 'Projects', 'Courses', 'Self Study', 'Education', 'Achievements']

    return {
        'sources': source_labels,
        'counts': [source_totals.get(l, 0) for l in source_labels],
        'colors': [colors.get(l, '#888') for l in source_labels],
        'top_skills': top_skills,
    }


def _build_goals_roadmap(profile):
    """Build the goals roadmap timeline data."""
    STATUS_COLORS = {
        'Achieved':    '#1D9E75',
        'In Progress': '#378ADD',
        'Planned':     '#BA7517',
        'Paused':      '#888780',
    }
    PRIORITY_COLORS = {
        'Critical': '#D85A30',
        'High':     '#BA7517',
        'Medium':   '#378ADD',
        'Low':      '#888780',
    }
    PRIORITY_WEIGHTS = {
        'Critical': 4,
        'High':     3,
        'Medium':   2,
        'Low':      1,
    }

    goals = list(Goal.objects(profile=profile).order_by('target_year', '-priority').only(
        'goal_name', 'sub_title', 'target_year', 'priority', 'status',
        'current_score', 'target_score', 'required_skills',
    ))

    result = []
    for goal in goals:
        target  = goal.target_score  or 100
        current = goal.current_score or 0
        pct     = min(round((current / target) * 100, 1), 100)
        status  = goal.status   or 'Planned'
        pri     = goal.priority or 'Medium'

        result.append({
            'id':                    str(goal.id),
            'goal_name':             goal.goal_name or '',
            'sub_title':             goal.sub_title or '',
            'target_year':           goal.target_year,
            'priority':              pri,
            'priority_weight':       PRIORITY_WEIGHTS.get(pri, 1),
            'status':                status,
            'current_score':         int(current),
            'target_score':          int(target),
            'progress_pct':          pct,
            'status_color':          STATUS_COLORS.get(status,   '#888780'),
            'priority_color':        PRIORITY_COLORS.get(pri,    '#888780'),
            'required_skills_count': len(goal.required_skills or []),
        })

    valid_years = [g['target_year'] for g in result if g['target_year']]

    return {
        'min_year': min(valid_years) if valid_years else None,
        'max_year': max(valid_years) if valid_years else None,
        'count':    len(result),
        'goals':    result,
    }


def _build_analytics(profile, profile_skills, goals, courses, self_studies,
                     educations, experiences, projects, achievements):
    """Build the analytics data (counts + radar + distribution + progress)."""
    counts = {
        'skills':      len(profile_skills),
        'projects':    len(projects),
        'courses':     len(courses),
        'experience':  len(experiences),
        'education':   len(educations),
        'achievements': len(achievements),
        'self_study':  len(self_studies),
        'goals':       len(goals),
    }

    # Skills radar
    cat_map = {}
    for ps in profile_skills:
        if not ps.skill:
            continue
        cat = ''
        if ps.skill.skill_type:
            try:
                cat = ps.skill.skill_type.name or 'Other'
            except Exception:
                cat = 'Other'
        else:
            cat = 'Other'
        cat_map.setdefault(cat, []).append(int(ps.score or 0))

    skills_radar = sorted(
        [
            {'category': cat, 'avg_score': round(sum(scores) / len(scores), 1), 'count': len(scores)}
            for cat, scores in cat_map.items()
        ],
        key=lambda x: -x['avg_score']
    )

    # Skills distribution
    all_scores = [int(ps.score or 0) for ps in profile_skills if ps.skill]
    skills_distribution = {
        'expert':       sum(1 for s in all_scores if s >= 80),
        'advanced':     sum(1 for s in all_scores if 60 <= s < 80),
        'intermediate': sum(1 for s in all_scores if 40 <= s < 60),
        'beginner':     sum(1 for s in all_scores if s < 40),
    }

    # Progress data
    status_count = {}
    pri_count = {}
    year_pcts = {}

    for goal in goals:
        st  = goal.status   or 'Planned'
        pri = goal.priority or 'Medium'
        yr  = str(goal.target_year) if goal.target_year else 'Unknown'
        tgt = goal.target_score  or 100
        cur = goal.current_score or 0
        pct = min(round((cur / tgt) * 100), 100)
        status_count[st]  = status_count.get(st, 0) + 1
        pri_count[pri]    = pri_count.get(pri, 0)   + 1
        year_pcts.setdefault(yr, []).append(pct)

    goals_by_status   = [{'status': k, 'count': v} for k, v in status_count.items()]
    goals_by_priority = [{'priority': k, 'count': v} for k, v in pri_count.items()]
    goals_by_year     = [
        {'year': yr, 'avg_progress': round(sum(vals) / len(vals), 1)}
        for yr, vals in sorted(year_pcts.items())
    ]

    course_years = {}
    for c in courses:
        if c.end_date:
            yr = str(c.end_date.year)
            course_years[yr] = course_years.get(yr, 0) + 1
    courses_by_year = [{'year': yr, 'count': cnt} for yr, cnt in sorted(course_years.items())]

    type_count = {}
    for item in self_studies:
        t = item.learning_type or 'Other'
        type_count[t] = type_count.get(t, 0) + 1
    learning_by_type = sorted(
        [{'type': t, 'count': c} for t, c in type_count.items()],
        key=lambda x: -x['count']
    )

    proj_type_count = {}
    for p in projects:
        t = p.project_type or 'Other'
        proj_type_count[t] = proj_type_count.get(t, 0) + 1
    projects_by_type = sorted(
        [{'type': t, 'count': c} for t, c in proj_type_count.items()],
        key=lambda x: -x['count']
    )

    return {
        'counts': counts,
        'skills_radar': skills_radar,
        'skills_distribution': skills_distribution,
        'goals_by_status': goals_by_status,
        'goals_by_priority': goals_by_priority,
        'goals_by_year': goals_by_year,
        'courses_by_year': courses_by_year,
        'learning_by_type': learning_by_type,
        'projects_by_type': projects_by_type,
    }


def _build_languages(profile):
    """Build the languages data."""
    PROFICIENCY_META = {
        'Native':       {'score': 100, 'color': '#1D9E75', 'bg': '#E1F5EE', 'icon': '🌍'},
        'Fluent':       {'score': 85,  'color': '#185FA5', 'bg': '#E6F1FB', 'icon': '💬'},
        'Advanced':     {'score': 70,  'color': '#534AB7', 'bg': '#EEEDFE', 'icon': '📚'},
        'Intermediate': {'score': 50,  'color': '#854F0B', 'bg': '#FAEEDA', 'icon': '🗣️'},
        'Beginner':     {'score': 25,  'color': '#5F5E5A', 'bg': '#F1EFE8', 'icon': '🌱'},
    }

    records = Language.objects(profile=profile).order_by('language_name').only(
        'language_name', 'proficiency',
    )

    result = []
    for lang in records:
        meta = PROFICIENCY_META.get(lang.proficiency or '', PROFICIENCY_META['Intermediate'])
        result.append({
            'language_name': lang.language_name or '',
            'proficiency':   lang.proficiency   or '',
            'level_score':   meta['score'],
            'color':         meta['color'],
            'bg':            meta['bg'],
            'icon':          meta['icon'],
        })

    return {'count': len(result), 'languages': result}


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/portfolio/overview-data
# Composite: ALL data needed by OverviewSection in one request
# ─────────────────────────────────────────────────────────────────────────────
@overview_data_bp.route('/portfolio/overview-data', methods=['GET'])
@cache.cached(timeout=300, key_prefix='overview_data')
def get_overview_data():
    """
    Returns everything OverviewSection needs in a single payload:
    - analytics (counts + radar + distribution + progress)
    - languages
    - portfolioSummary (skills_by_type + skills_with_sources + goals + timeline)
    - skillsCharts (sources)
    - goalsCharts (roadmap)

    Single DB fetch for all shared models, then builds each payload.
    """
    try:
        profile = _get_profile()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        # ── Shared DB queries (one pass for everything) ──
        profile_skills = list(ProfileSkill.objects(profile=profile).only('skill', 'score').select_related())
        goals = list(Goal.objects(profile=profile).only(
            'goal_name', 'sub_title', 'status', 'priority', 'target_year',
            'target_score', 'current_score', 'required_skills',
        ))
        courses = list(Course.objects(profile=profile).only(
            'course_name', 'organization', 'category', 'acquired_skills',
            'end_date', 'start_date', 'project_summary',
        ))
        self_studies = list(SelfStudy.objects(profile=profile).only(
            'title', 'learning_type', 'skills_learned', 'end_date', 'start_date',
        ))
        educations = list(Education.objects(profile=profile).only(
            'institution', 'degree', 'major', 'skills_learned', 'end_date', 'start_date',
        ))
        experiences = list(Experience.objects(profile=profile).only(
            'job_title', 'company_name', 'start_date', 'end_date', 'is_current',
        ))
        projects = list(Project.objects(profile=profile).only(
            'project_type', 'project_name', 'project_images', 'start_date', 'end_date',
        ))
        achievements = list(Achievement.objects(profile=profile).only(
            'title', 'date_obtained',
        ))

        # ── Build shared data structures ──
        source_map = _build_source_map(profile)
        goal_skill_map = _build_goal_skill_map(goals)
        skills_by_type, skills_with_sources = _build_skills_payload(profile_skills, source_map, goal_skill_map)
        learning_timeline = _build_timeline(courses, self_studies, educations)
        goals_payload = _build_goals_payload(goals, profile_skills)
        source_contribution = _build_source_contribution(source_map)

        # ── Build each sub-payload ──
        analytics = _build_analytics(
            profile, profile_skills, goals, courses, self_studies,
            educations, experiences, projects, achievements,
        )
        languages = _build_languages(profile)

        portfolio_summary = {
            'profile_summary': {
                'experience_years': round(float(profile.experience_years or 0), 1),
                'overall_score':    round(float(profile.overall_score or 0), 1),
                'total_skills':     len(profile_skills),
                'total_goals':      len(goals),
                'total_courses':    len(courses),
                'total_self_study': len(self_studies),
                'total_education':  len(educations),
            },
            'skills_by_type':       skills_by_type,
            'skills_with_sources':  skills_with_sources,
            'learning_timeline':    learning_timeline,
            'goals':                goals_payload,
            'learning_overview':    {'source_contribution': source_contribution},
        }

        skills_charts = {
            'sources': _build_skills_sources(profile),
        }

        goals_charts = {
            'roadmap': _build_goals_roadmap(profile),
        }

        return jsonify({
            'analytics':        analytics,
            'languages':        languages,
            'portfolioSummary': portfolio_summary,
            'skillsCharts':     skills_charts,
            'goalsCharts':      goals_charts,
        }), 200

    except Exception as e:
        logging.error(f'[OVERVIEW DATA] /portfolio/overview-data failed: {str(e)}', exc_info=True)
        return jsonify({'error': str(e)}), 500
