"""
Portfolio Dashboard API — portfolio_charts_api.py
=================================================
Aggregates ALL portfolio data into a single comprehensive payload
for the integrated portfolio dashboard.

Shows the full causal chain:
  Learning (Courses/Education/SelfStudy) -> Skills (ProfileSkill by SkillType) -> Goals -> Overall Profile

Endpoints:
    GET /api/charts/portfolio/summary  — comprehensive dashboard payload

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

portfolio_charts_bp = Blueprint('portfolio_charts', __name__)

SOURCE_CONFIG = [
    (Course,     'acquired_skills',    'courses'),
    (SelfStudy,  'skills_learned',     'self_study'),
    (Education,  'skills_learned',     'education'),
    (Experience, 'skills_acquired',    'experience'),
    (Project,    'skills_used',        'projects'),
    (Achievement, 'skills_demonstrated', 'achievements'),
]


def _get_source_label(record, source_key):
    labels = {
        'courses':     lambda r: getattr(r, 'course_name', ''),
        'self_study':  lambda r: getattr(r, 'title', ''),
        'education':   lambda r: f"{getattr(r, 'degree', '')} at {getattr(r, 'institution', '')}",
        'experience':  lambda r: f"{getattr(r, 'job_title', '')} @ {getattr(r, 'company_name', '')}",
        'projects':    lambda r: getattr(r, 'project_name', ''),
        'achievements': lambda r: getattr(r, 'title', ''),
    }
    fn = labels.get(source_key, lambda r: '')
    return fn(record).strip()


def _build_source_map(profile):
    source_map = defaultdict(lambda: defaultdict(list))
    _FIELD_MAP = {
        Course:     ('acquired_skills',    'course_name'),
        SelfStudy:  ('skills_learned',     'title'),
        Education:  ('skills_learned',     'degree'),
        Experience: ('skills_acquired',    'job_title'),
        Project:    ('skills_used',        'project_name'),
        Achievement:('skills_demonstrated','title'),
    }
    for model_class, field_name, source_key in SOURCE_CONFIG:
        extra_fields = _FIELD_MAP.get(model_class, (field_name,))
        for record in model_class.objects(profile=profile).only(field_name, *extra_fields):
            skills = getattr(record, field_name, []) or []
            label = _get_source_label(record, source_key)
            for raw in skills:
                if not raw:
                    continue
                norm = raw.strip().title()
                if not norm:
                    continue
                source_map[norm][source_key].append(label)
    return source_map


def _normalize(name):
    return name.strip().title() if name else ''


# ── Helpers ────────────────────────────────────────────────────────────────

def _get_profile():
    profile = Profile.objects.first()
    if not profile:
        return None
    return profile


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


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/charts/portfolio/skills
# Skills grouped by type with source tracking
# ─────────────────────────────────────────────────────────────────────────────
@portfolio_charts_bp.route('/charts/portfolio/skills', methods=['GET'])
@cache.cached(timeout=300, key_prefix='portfolio_skills')
def get_portfolio_skills():
    try:
        profile = _get_profile()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        profile_skills = list(ProfileSkill.objects(profile=profile).only('skill', 'score').select_related())
        goals = list(Goal.objects(profile=profile).only('goal_name', 'required_skills'))
        source_map = _build_source_map(profile)
        goal_skill_map = _build_goal_skill_map(goals)
        skills_by_type, skills_with_sources = _build_skills_payload(profile_skills, source_map, goal_skill_map)

        return jsonify({'skills_by_type': skills_by_type, 'skills_with_sources': skills_with_sources}), 200
    except Exception as e:
        logging.error(f'[PORTFOLIO CHARTS] /charts/portfolio/skills failed: {str(e)}', exc_info=True)
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/charts/portfolio/goals
# Goals with skill gap analysis
# ─────────────────────────────────────────────────────────────────────────────
@portfolio_charts_bp.route('/charts/portfolio/goals', methods=['GET'])
@cache.cached(timeout=300, key_prefix='portfolio_goals')
def get_portfolio_goals():
    try:
        profile = _get_profile()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        profile_skills = list(ProfileSkill.objects(profile=profile).only('skill', 'score').select_related())
        goals = list(Goal.objects(profile=profile).only(
            'goal_name', 'sub_title', 'status', 'priority', 'target_year',
            'target_score', 'current_score', 'required_skills',
        ))
        goals_payload = _build_goals_payload(goals, profile_skills)

        return jsonify({'goals': goals_payload}), 200
    except Exception as e:
        logging.error(f'[PORTFOLIO CHARTS] /charts/portfolio/goals failed: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/charts/portfolio/timeline
# Learning timeline by year
# ─────────────────────────────────────────────────────────────────────────────
@portfolio_charts_bp.route('/charts/portfolio/timeline', methods=['GET'])
@cache.cached(timeout=300, key_prefix='portfolio_timeline')
def get_portfolio_timeline():
    try:
        profile = _get_profile()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        courses = list(Course.objects(profile=profile).only(
            'course_name', 'organization', 'acquired_skills', 'end_date', 'start_date',
        ))
        self_studies = list(SelfStudy.objects(profile=profile).only(
            'title', 'learning_type', 'skills_learned', 'end_date', 'start_date',
        ))
        educations = list(Education.objects(profile=profile).only(
            'institution', 'degree', 'major', 'skills_learned', 'end_date', 'start_date',
        ))
        learning_timeline = _build_timeline(courses, self_studies, educations)

        return jsonify({'learning_timeline': learning_timeline}), 200
    except Exception as e:
        logging.error(f'[PORTFOLIO CHARTS] /charts/portfolio/timeline failed: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/charts/portfolio/sources
# Source contribution breakdown
# ─────────────────────────────────────────────────────────────────────────────
@portfolio_charts_bp.route('/charts/portfolio/sources', methods=['GET'])
@cache.cached(timeout=300, key_prefix='portfolio_sources')
def get_portfolio_sources():
    try:
        profile = _get_profile()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        source_map = _build_source_map(profile)
        source_contribution = _build_source_contribution(source_map)

        return jsonify({'learning_overview': {'source_contribution': source_contribution}}), 200
    except Exception as e:
        logging.error(f'[PORTFOLIO CHARTS] /charts/portfolio/sources failed: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/charts/portfolio/summary  (composite — backward compatible)
# Full dashboard payload — merges all sub-endpoints
# ─────────────────────────────────────────────────────────────────────────────
@portfolio_charts_bp.route('/charts/portfolio/summary', methods=['GET'])
@cache.cached(timeout=300, key_prefix='portfolio_summary')
def get_portfolio_summary():
    try:
        profile = _get_profile()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

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

        source_map = _build_source_map(profile)
        goal_skill_map = _build_goal_skill_map(goals)
        skills_by_type, skills_with_sources = _build_skills_payload(profile_skills, source_map, goal_skill_map)
        learning_timeline = _build_timeline(courses, self_studies, educations)
        goals_payload = _build_goals_payload(goals, profile_skills)
        source_contribution = _build_source_contribution(source_map)

        profile_summary = {
            'experience_years': round(float(profile.experience_years or 0), 1),
            'overall_score': round(float(profile.overall_score or 0), 1),
            'total_skills': len(profile_skills),
            'total_goals': len(goals),
            'total_courses': len(courses),
            'total_self_study': len(self_studies),
            'total_education': len(educations),
        }

        return jsonify({
            'profile_summary': profile_summary,
            'skills_by_type': skills_by_type,
            'skills_with_sources': skills_with_sources,
            'learning_timeline': learning_timeline,
            'goals': goals_payload,
            'learning_overview': {'source_contribution': source_contribution},
        }), 200

    except Exception as e:
        logging.error(f'[PORTFOLIO CHARTS] /charts/portfolio/summary failed: {str(e)}')
        return jsonify({'error': str(e)}), 500
