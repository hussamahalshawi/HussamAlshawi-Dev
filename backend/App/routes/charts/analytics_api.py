"""
Portfolio Public API — analytics_api.py
=========================================
Endpoints :
    GET /api/portfolio/analytics            — mega aggregate payload for charts
    GET /api/portfolio/analytics/tech-stack — tech stack frequency analysis
    GET /api/portfolio/analytics/timeline   — combined career timeline
Author    : HussamAlshawi-Dev
"""

import logging                                                # Error tracking
from flask import Blueprint, jsonify                          # Core Flask utilities
from App.models.profile     import Profile                    # Profile model
from App.models.skills      import ProfileSkill               # Skill scores
from App.models.goal        import Goal                       # Goals model
from App.models.experience  import Experience                 # Work history
from App.models.course      import Course                     # Certifications
from App.models.education   import Education                  # Academic records
from App.models.project     import Project                    # Portfolio projects
from App.models.self_study  import SelfStudy                  # Self-learning records
from App.models.achievement import Achievement                # Awards
from App import cache                            # Import shared cache instance

# ── Blueprint registration ────────────────────────────────────────────────────
analytics_public_bp = Blueprint('analytics_public', __name__)


# ── Helpers ────────────────────────────────────────────────────────────────
def _get_profile_or_404():
    profile = Profile.objects.first()
    if not profile:
        return None
    return profile


def _build_counts_and_summary(profile, profile_skills, courses, self_studies,
                                educations, experiences, projects, achievements, goals):
    profile_summary = {
        'full_name'       : profile.full_name or '',
        'title'           : profile.title     or '',
        'experience_years': round(float(profile.experience_years or 0), 1),
        'overall_score'   : round(float(profile.overall_score    or 0), 1),
        'is_available'    : bool(profile.is_available_for_hire),
        'primary_avatar'  : profile.primary_avatar or '',
    }
    counts = {
        'skills'      : len(profile_skills),
        'projects'    : len(projects),
        'courses'     : len(courses),
        'experience'  : len(experiences),
        'education'   : len(educations),
        'achievements': len(achievements),
        'self_study'  : len(self_studies),
        'goals'       : len(goals),
    }
    return profile_summary, counts


def _build_skills_data(profile_skills):
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

    all_scores = [int(ps.score or 0) for ps in profile_skills if ps.skill]
    skills_distribution = {
        'expert'      : sum(1 for s in all_scores if s >= 80),
        'advanced'    : sum(1 for s in all_scores if 60 <= s < 80),
        'intermediate': sum(1 for s in all_scores if 40 <= s < 60),
        'beginner'    : sum(1 for s in all_scores if s < 40),
    }

    sorted_skills = sorted(
        [(ps, int(ps.score or 0)) for ps in profile_skills if ps.skill],
        key=lambda x: -x[1]
    )[:10]

    top_skills = []
    for ps, score in sorted_skills:
        meta = ps.skill.get_display_meta()
        top_skills.append({
            'skill_name': ps.skill.skill_name or '',
            'score'     : score,
            'icon'      : meta.get('icon', 'fas fa-code'),
            'color'     : meta.get('color', '#64748b'),
        })

    return skills_radar, skills_distribution, top_skills


def _build_progress_data(goals, courses, self_studies, projects):
    status_count = {}
    pri_count    = {}
    year_pcts    = {}

    for goal in goals:
        st  = goal.status   or 'Planned'
        pri = goal.priority or 'Medium'
        yr  = str(goal.target_year) if goal.target_year else 'Unknown'
        tgt = goal.target_score  or 100
        cur = goal.current_score or 0
        pct = min(round((cur / tgt) * 100), 100)
        status_count[st]   = status_count.get(st, 0) + 1
        pri_count[pri]     = pri_count.get(pri, 0)   + 1
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
        key=lambda x: -x[1]
    )

    proj_type_count = {}
    for p in projects:
        t = p.project_type or 'Other'
        proj_type_count[t] = proj_type_count.get(t, 0) + 1
    projects_by_type = sorted(
        [{'type': t, 'count': c} for t, c in proj_type_count.items()],
        key=lambda x: -x[1]
    )

    return {
        'goals_by_status'  : goals_by_status,
        'goals_by_priority': goals_by_priority,
        'goals_by_year'    : goals_by_year,
        'courses_by_year'  : courses_by_year,
        'learning_by_type' : learning_by_type,
        'projects_by_type' : projects_by_type,
    }


def _fetch_all_data(profile):
    return (
        list(ProfileSkill.objects(profile=profile).select_related().only('skill', 'score')),
        list(Goal.objects(profile=profile).only('status', 'priority', 'target_year', 'target_score', 'current_score')),
        list(Course.objects(profile=profile).only('end_date', 'course_name')),
        list(SelfStudy.objects(profile=profile).only('learning_type', 'title')),
        list(Education.objects(profile=profile).only('degree', 'major', 'institution', 'start_date', 'end_date')),
        list(Experience.objects(profile=profile).only('job_title', 'company_name', 'start_date', 'end_date', 'is_current')),
        list(Project.objects(profile=profile).only('project_type', 'project_name')),
        list(Achievement.objects(profile=profile).only('title', 'date_obtained')),
    )


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/portfolio/analytics/counts
# Lightweight: profile summary + model counts only
# ─────────────────────────────────────────────────────────────────────────────
@analytics_public_bp.route('/portfolio/analytics/counts', methods=['GET'])
@cache.cached(timeout=300, key_prefix='public_analytics_counts')
def get_analytics_counts():
    try:
        profile = _get_profile_or_404()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404
        profile_skills, goals, courses, self_studies, educations, experiences, projects, achievements = _fetch_all_data(profile)
        profile_summary, counts = _build_counts_and_summary(
            profile, profile_skills, courses, self_studies, educations, experiences, projects, achievements, goals
        )
        return jsonify({'profile_summary': profile_summary, 'counts': counts}), 200
    except Exception as e:
        logging.error(f'[ANALYTICS] /portfolio/analytics/counts failed: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/portfolio/analytics/skills-data
# Skills radar, distribution, top skills
# ─────────────────────────────────────────────────────────────────────────────
@analytics_public_bp.route('/portfolio/analytics/skills-data', methods=['GET'])
@cache.cached(timeout=300, key_prefix='public_analytics_skills')
def get_analytics_skills():
    try:
        profile = _get_profile_or_404()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404
        profile_skills = list(ProfileSkill.objects(profile=profile).select_related().only('skill', 'score'))
        skills_radar, skills_distribution, top_skills = _build_skills_data(profile_skills)
        return jsonify({
            'skills_radar'       : skills_radar,
            'skills_distribution': skills_distribution,
            'top_skills'         : top_skills,
        }), 200
    except Exception as e:
        logging.error(f'[ANALYTICS] /portfolio/analytics/skills-data failed: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/portfolio/analytics/progress
# Goals, courses, learning, projects progress data
# ─────────────────────────────────────────────────────────────────────────────
@analytics_public_bp.route('/portfolio/analytics/progress', methods=['GET'])
@cache.cached(timeout=300, key_prefix='public_analytics_progress')
def get_analytics_progress():
    try:
        profile = _get_profile_or_404()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404
        _, goals, courses, self_studies, _, _, projects, _ = _fetch_all_data(profile)
        progress_data = _build_progress_data(goals, courses, self_studies, projects)
        return jsonify(progress_data), 200
    except Exception as e:
        logging.error(f'[ANALYTICS] /portfolio/analytics/progress failed: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/portfolio/analytics  (composite — backward compatible)
# Mega aggregate: calls all sub-helpers and merges
# ─────────────────────────────────────────────────────────────────────────────
@analytics_public_bp.route('/portfolio/analytics', methods=['GET'])
@cache.cached(timeout=300, key_prefix='public_analytics')
def get_portfolio_analytics():
    try:
        profile = _get_profile_or_404()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        profile_skills, goals, courses, self_studies, educations, experiences, projects, achievements = _fetch_all_data(profile)
        profile_summary, counts = _build_counts_and_summary(
            profile, profile_skills, courses, self_studies, educations, experiences, projects, achievements, goals
        )
        skills_radar, skills_distribution, top_skills = _build_skills_data(profile_skills)
        progress_data = _build_progress_data(goals, courses, self_studies, projects)

        return jsonify({
            'profile_summary'     : profile_summary,
            'counts'              : counts,
            'skills_radar'        : skills_radar,
            'skills_distribution' : skills_distribution,
            'top_skills'          : top_skills,
            **progress_data,
        }), 200

    except Exception as e:
        logging.error(f'[ANALYTICS API] /portfolio/analytics failed: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/portfolio/analytics/tech-stack
# Tech stack frequency across ALL source records
# ─────────────────────────────────────────────────────────────────────────────
@analytics_public_bp.route('/portfolio/analytics/tech-stack', methods=['GET'])
@cache.cached(timeout=300, key_prefix='public_tech_stack')
def get_tech_stack():
    """
    Aggregates skill/technology usage frequency across ALL models:
    Experience, Projects, Courses, Self-Study, Education, Achievements.

    Returns a frequency map sorted by count descending — ideal for
    a horizontal bar chart or a word-cloud widget.

    Response shape:
    {
        "count": 35,
        "tech_stack": [
            { "tech": "Python",   "frequency": 12, "sources": ["Experience", "Projects", "Courses"] },
            { "tech": "React",    "frequency": 7,  "sources": ["Projects", "Courses"] },
            ...
        ]
    }
    """
    try:
        profile = Profile.objects.first()

        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        # Source configuration: (model, field_name, label)
        source_config = [
            (Experience,  'skills_acquired',    'Experience'),
            (Project,     'skills_used',         'Projects'),
            (Course,      'acquired_skills',     'Courses'),
            (SelfStudy,   'skills_learned',      'Self Study'),
            (Education,   'skills_learned',      'Education'),
            (Achievement, 'skills_demonstrated', 'Achievements'),
        ]

        tech_map = {}                                         # { normalized_name: { count, sources } }

        for model_class, field_name, source_label in source_config:
            for record in model_class.objects(profile=profile).only(field_name):
                skills = getattr(record, field_name, []) or []
                for raw_skill in skills:
                    if not raw_skill:
                        continue
                    normalized = raw_skill.strip().title()    # Normalize to Title Case
                    if not normalized:
                        continue
                    if normalized not in tech_map:
                        tech_map[normalized] = {'count': 0, 'sources': set()}
                    tech_map[normalized]['count']   += 1
                    tech_map[normalized]['sources'].add(source_label)

        # Sort by frequency descending
        tech_stack = sorted(
            [
                {
                    'tech'     : tech,
                    'frequency': data['count'],
                    'sources'  : sorted(data['sources']),
                }
                for tech, data in tech_map.items()
            ],
            key=lambda x: -x['frequency']
        )

        return jsonify({'count': len(tech_stack), 'tech_stack': tech_stack}), 200

    except Exception as e:
        logging.error(f'[ANALYTICS API] /portfolio/analytics/tech-stack failed: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/portfolio/analytics/timeline
# Combined career timeline across education + experience
# ─────────────────────────────────────────────────────────────────────────────
@analytics_public_bp.route('/portfolio/analytics/timeline', methods=['GET'])
@cache.cached(timeout=300, key_prefix='public_timeline')
def get_career_timeline():
    """
    Returns a unified career timeline merging Education + Experience events.
    Each event has a type, start/end year, and label — ideal for rendering
    a dual-track horizontal timeline or gantt-style chart.

    Response shape:
    {
        "timeline": [
            {
                "type"      : "education",
                "label"     : "BSc Computer Science",
                "sub_label" : "Jordan University",
                "year_start": 2017,
                "year_end"  : 2021,
                "is_current": false,
                "color"     : "#7F77DD"
            },
            {
                "type"      : "experience",
                "label"     : "Senior Python Dev",
                "sub_label" : "Acme Corp",
                "year_start": 2021,
                "year_end"  : null,
                "is_current": true,
                "color"     : "#1D9E75"
            }
        ]
    }
    """
    try:
        profile = Profile.objects.first()

        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        timeline = []

        # ── Education events ───────────────────────────────────────────────
        for edu in Education.objects(profile=profile).order_by('start_date').only('degree', 'major', 'institution', 'start_date', 'end_date'):
            timeline.append({
                'type'      : 'education',
                'label'     : f"{edu.degree or ''} in {edu.major or ''}".strip(),
                'sub_label' : edu.institution or '',
                'year_start': edu.start_date.year if edu.start_date else None,
                'year_end'  : edu.end_date.year   if edu.end_date   else None,
                'is_current': False,
                'color'     : '#7F77DD',                      # Purple for education
            })

        # ── Experience events ──────────────────────────────────────────────
        for exp in Experience.objects(profile=profile).order_by('start_date').only('job_title', 'company_name', 'start_date', 'end_date', 'is_current'):
            timeline.append({
                'type'      : 'experience',
                'label'     : exp.job_title    or '',
                'sub_label' : exp.company_name or '',
                'year_start': exp.start_date.year if exp.start_date else None,
                'year_end'  : exp.end_date.year   if exp.end_date   else None,
                'is_current': bool(exp.is_current),
                'color'     : '#1D9E75',                      # Teal for experience
            })

        # Sort unified timeline by year_start ascending
        timeline.sort(key=lambda x: x['year_start'] or 9999)

        return jsonify({'timeline': timeline}), 200

    except Exception as e:
        logging.error(f'[ANALYTICS API] /portfolio/analytics/timeline failed: {str(e)}')
        return jsonify({'error': str(e)}), 500