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


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/portfolio/analytics
# Mega aggregate payload — a single call that feeds ALL frontend charts
# ─────────────────────────────────────────────────────────────────────────────
@analytics_public_bp.route('/portfolio/analytics', methods=['GET'])
@cache.cached(timeout=300, key_prefix='public_analytics')  # Cache 5 min in RAM
def get_portfolio_analytics():
    """
    Returns a comprehensive analytics snapshot for the entire portfolio.
    Designed as a single "big load" call that powers all homepage and
    stats-page charts without multiple round trips.

    Used by:
        - Homepage stats section (count cards)
        - Skills radar chart
        - Skills distribution donut
        - Courses by year bar chart
        - Tech stack frequency bar chart
        - Learning time chart
        - Goals progress grouped bar

    Response shape:
    {
        "profile_summary"     : { "experience_years": 5.2, "overall_score": 78.4, ... },
        "counts"              : { "skills": 24, "projects": 12, ... },
        "skills_radar"        : [ { "category": "Backend", "avg_score": 85 }, ... ],
        "skills_distribution" : { "expert": 4, "advanced": 7, "intermediate": 8, "beginner": 5 },
        "top_skills"          : [ { "skill_name": "Python", "score": 92, "icon": "...", "color": "..." }, ... ],
        "goals_by_status"     : [ { "status": "In Progress", "count": 3 }, ... ],
        "goals_by_year"       : [ { "year": "2025", "avg_progress": 65 }, ... ],
        "courses_by_year"     : [ { "year": "2022", "count": 6 }, ... ],
        "learning_by_type"    : [ { "type": "Book", "count": 7 }, ... ],
        "projects_by_type"    : [ { "type": "Web App", "count": 8 }, ... ]
    }
    """
    try:
        profile = Profile.objects.first()

        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        # ── Fetch all data in parallel (one query per model) ───────────────
        profile_skills = list(ProfileSkill.objects(profile=profile).select_related())
        goals          = list(Goal.objects(profile=profile))
        courses        = list(Course.objects(profile=profile))
        self_studies   = list(SelfStudy.objects(profile=profile))
        projects       = list(Project.objects(profile=profile))
        achievements   = list(Achievement.objects(profile=profile))
        experiences    = list(Experience.objects(profile=profile))
        educations     = list(Education.objects(profile=profile))

        # ── Profile summary ────────────────────────────────────────────────
        profile_summary = {
            'full_name'       : profile.full_name or '',
            'title'           : profile.title     or '',
            'experience_years': round(float(profile.experience_years or 0), 1),
            'overall_score'   : round(float(profile.overall_score    or 0), 1),
            'is_available'    : bool(profile.is_available_for_hire),
            'primary_avatar'  : profile.primary_avatar or '',
        }

        # ── Model counts ───────────────────────────────────────────────────
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

        # ── Skills radar — average score per category ──────────────────────
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
                {
                    'category' : cat,
                    'avg_score': round(sum(scores) / len(scores), 1),
                    'count'    : len(scores),
                }
                for cat, scores in cat_map.items()
            ],
            key=lambda x: -x['avg_score']
        )

        # ── Skills distribution bands ──────────────────────────────────────
        all_scores = [int(ps.score or 0) for ps in profile_skills if ps.skill]
        skills_distribution = {
            'expert'      : sum(1 for s in all_scores if s >= 80),
            'advanced'    : sum(1 for s in all_scores if 60 <= s < 80),
            'intermediate': sum(1 for s in all_scores if 40 <= s < 60),
            'beginner'    : sum(1 for s in all_scores if s < 40),
        }

        # ── Top 10 skills ──────────────────────────────────────────────────
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
                'icon'      : meta.get('icon',  'fas fa-code'),
                'color'     : meta.get('color', '#64748b'),
            })

        # ── Goals by status ────────────────────────────────────────────────
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

        goals_by_status = [{'status': k, 'count': v} for k, v in status_count.items()]
        goals_by_priority = [{'priority': k, 'count': v} for k, v in pri_count.items()]
        goals_by_year = [
            {'year': yr, 'avg_progress': round(sum(vals) / len(vals), 1)}
            for yr, vals in sorted(year_pcts.items())
        ]

        # ── Courses by completion year ─────────────────────────────────────
        course_years = {}
        for c in courses:
            if c.end_date:
                yr = str(c.end_date.year)
                course_years[yr] = course_years.get(yr, 0) + 1

        courses_by_year = [
            {'year': yr, 'count': cnt}
            for yr, cnt in sorted(course_years.items())
        ]

        # ── Self-study / learning by type ──────────────────────────────────
        type_count = {}
        for item in self_studies:
            t = item.learning_type or 'Other'
            type_count[t] = type_count.get(t, 0) + 1

        learning_by_type = [
            {'type': t, 'count': c}
            for t, c in sorted(type_count.items(), key=lambda x: -x[1])
        ]

        # ── Projects by type ───────────────────────────────────────────────
        proj_type_count = {}
        for p in projects:
            t = p.project_type or 'Other'
            proj_type_count[t] = proj_type_count.get(t, 0) + 1

        projects_by_type = [
            {'type': t, 'count': c}
            for t, c in sorted(proj_type_count.items(), key=lambda x: -x[1])
        ]

        return jsonify({
            'profile_summary'     : profile_summary,
            'counts'              : counts,
            'skills_radar'        : skills_radar,
            'skills_distribution' : skills_distribution,
            'top_skills'          : top_skills,
            'goals_by_status'     : goals_by_status,
            'goals_by_priority'   : goals_by_priority,
            'goals_by_year'       : goals_by_year,
            'courses_by_year'     : courses_by_year,
            'learning_by_type'    : learning_by_type,
            'projects_by_type'    : projects_by_type,
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
            for record in model_class.objects(profile=profile):
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
        for edu in Education.objects(profile=profile).order_by('start_date'):
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
        for exp in Experience.objects(profile=profile).order_by('start_date'):
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