from flask import Blueprint, jsonify                               # Core Flask utilities
from App.models.profile     import Profile                         # Profile model
from App.models.skills      import ProfileSkill, Skill             # Skill models
from App.models.goal        import Goal                            # Goal model
from App.models.experience  import Experience                      # Experience model
from App.models.course      import Course                          # Course model
from App.models.education   import Education                       # Education model
from App.models.project     import Project                         # Project model
from App.models.self_study  import SelfStudy                       # SelfStudy model
from App.models.achievement import Achievement                     # Achievement model
import logging                                                      # Error tracking


# -------------------------------------------------------------------------
# BLUEPRINT REGISTRATION
# -------------------------------------------------------------------------
dashboard_bp = Blueprint('dashboard', __name__)                    # Blueprint name for url_for()


# -------------------------------------------------------------------------
# ROUTE 1: GET /api/profiles
# Returns a lightweight list of all profiles for the dropdown selector
# -------------------------------------------------------------------------
@dashboard_bp.route('/profiles', methods=['GET'])
def get_profiles():
    """
    Returns all Profile documents as a minimal list.
    Used to populate the profile selector dropdown in the dashboard.

    Response shape:
    {
        "count": 1,
        "profiles": [
            {
                "id"              : "...",
                "full_name"       : "Hussam Alshawi",
                "title"           : "Full Stack Developer",
                "experience_years": 5.2,
                "overall_score"   : 78.4,
                "is_available"    : true,
                "primary_avatar"  : "https://..."
            }
        ]
    }
    """
    try:
        profiles = Profile.objects.all()                               # Fetch all profile documents

        data = []
        for p in profiles:
            data.append({
                'id'              : str(p.id),                         # MongoDB ObjectId as string
                'full_name'       : p.full_name or '',                 # Display name
                'title'           : p.title or '',                     # Job title
                'experience_years': round(float(p.experience_years or 0), 1),   # Rounded float
                'overall_score'   : round(float(p.overall_score or 0), 1),      # Rounded float
                'is_available'    : bool(p.is_available_for_hire),     # Availability flag
                'primary_avatar'  : p.primary_avatar or '',            # Cloudinary avatar URL
            })

        return jsonify({'count': len(data), 'profiles': data}), 200

    except Exception as e:
        logging.error(f"[DASHBOARD API] /profiles failed: {str(e)}")
        return jsonify({'error': str(e)}), 500


# -------------------------------------------------------------------------
# ROUTE 2: GET /api/profile/<profile_id>
# Returns full profile details for the selected profile
# -------------------------------------------------------------------------
@dashboard_bp.route('/profile/<profile_id>', methods=['GET'])
def get_profile(profile_id):
    """
    Returns detailed metrics for a single Profile document.
    Used to populate the metric cards at the top of the dashboard.

    Args:
        profile_id: MongoDB ObjectId string from the URL path.

    Response shape:
    {
        "id"              : "...",
        "full_name"       : "Hussam Alshawi",
        "title"           : "Full Stack Developer",
        "experience_years": 5.2,
        "overall_score"   : 78.4,
        "is_available"    : true,
        "model_counts"    : {
            "skills"      : 12,
            "goals"       : 4,
            "experience"  : 3,
            "courses"     : 8,
            "projects"    : 6,
            "education"   : 2,
            "achievements": 5
        }
    }
    """
    try:
        profile = Profile.objects.get(id=profile_id)                   # Fetch specific profile

        # Count related records — each is a lightweight count query
        model_counts = {
            'skills'      : ProfileSkill.objects(profile=profile).count(),   # ProfileSkill records
            'goals'       : Goal.objects(profile=profile).count(),           # Goal records
            'experience'  : Experience.objects(profile=profile).count(),     # Experience records
            'courses'     : Course.objects(profile=profile).count(),         # Course records
            'projects'    : Project.objects(profile=profile).count(),        # Project records
            'education'   : Education.objects(profile=profile).count(),      # Education records
            'self_study': SelfStudy.objects(profile=profile).count(),
            'achievements': Achievement.objects(profile=profile).count(),  # Achievement records
        }

        return jsonify({
            'id'              : str(profile.id),                       # MongoDB ObjectId as string
            'full_name'       : profile.full_name or '',               # Display name
            'title'           : profile.title or '',                   # Job title
            'bio'             : profile.bio or '',                     # Bio text
            'experience_years': round(float(profile.experience_years or 0), 1),
            'overall_score'   : round(float(profile.overall_score or 0), 1),
            'is_available'    : bool(profile.is_available_for_hire),   # Hire status
            'remote_preference': bool(profile.remote_preference),      # Remote flag
            'primary_avatar'  : profile.primary_avatar or '',          # Avatar URL
            'model_counts'    : model_counts,                          # Related record counts
        }), 200

    except Profile.DoesNotExist:
        return jsonify({'error': 'Profile not found'}), 404

    except Exception as e:
        logging.error(f"[DASHBOARD API] /profile/{profile_id} failed: {str(e)}")
        return jsonify({'error': str(e)}), 500


# -------------------------------------------------------------------------
# ROUTE 3: GET /api/profile-skills?profile_id=<id>
# Returns all ProfileSkill scores for a given profile
# -------------------------------------------------------------------------
@dashboard_bp.route('/profile-skills', methods=['GET'])
def get_profile_skills():
    """
    Returns all ProfileSkill documents for a given profile.
    Used to render the skill bar chart, radar chart, and distribution chart.

    Query param:
        profile_id (str): MongoDB ObjectId of the target profile.

    Response shape:
    {
        "count": 12,
        "skills": [
            {
                "skill_name" : "Python",
                "skill_type" : "Backend Development",
                "score"      : 90,
                "icon"       : "fab fa-python",
                "color"      : "#3776ab"
            }
        ]
    }
    """
    from flask import request                                          # Import inside route — avoids circular import

    profile_id = request.args.get('profile_id')                        # Read query parameter

    if not profile_id:
        return jsonify({'error': 'profile_id is required'}), 400       # Guard: missing param

    try:
        profile = Profile.objects.get(id=profile_id)                   # Validate profile exists

        # Fetch all ProfileSkill docs with related Skill and SkillType in one query
        profile_skills = ProfileSkill.objects(profile=profile).select_related()

        skills_data = []
        for ps in profile_skills:
            if not ps.skill:
                continue                                                # Skip orphaned references

            skill_type_name = ''                                        # Default: no category
            if ps.skill.skill_type:
                try:
                    skill_type_name = ps.skill.skill_type.name or ''   # Dereference SkillType
                except Exception:
                    skill_type_name = ''                                # Handle broken reference

            # Resolve display icon and color from skill metadata
            display_meta = ps.skill.get_display_meta()                 # Returns {icon, color}

            skills_data.append({
                'skill_name': ps.skill.skill_name or '',               # Official skill name
                'skill_type': skill_type_name,                         # Parent category name
                'score'     : int(ps.score or 0),                      # Proficiency score 0-100
                'icon'      : display_meta.get('icon', 'fas fa-code'), # FontAwesome class
                'color'     : display_meta.get('color', '#64748b'),    # Hex brand color
            })

        # Sort by score descending for natural chart ordering
        skills_data.sort(key=lambda x: x['score'], reverse=True)

        return jsonify({'count': len(skills_data), 'skills': skills_data}), 200

    except Profile.DoesNotExist:
        return jsonify({'error': 'Profile not found'}), 404

    except Exception as e:
        logging.error(f"[DASHBOARD API] /profile-skills failed: {str(e)}")
        return jsonify({'error': str(e)}), 500


# -------------------------------------------------------------------------
# ROUTE 4: GET /api/goals?profile_id=<id>
# Returns all goals with progress data for a given profile
# -------------------------------------------------------------------------
@dashboard_bp.route('/goals-dashboard', methods=['GET'])
def get_goals_dashboard():
    """
    Returns all Goal documents for a given profile with progress metrics.
    Separate from the existing /api/goals route — this one is scoped to a
    specific profile_id passed as a query parameter.

    Query param:
        profile_id (str): MongoDB ObjectId of the target profile.

    Response shape:
    {
        "count": 4,
        "goals": [
            {
                "id"           : "...",
                "goal_name"    : "Senior Python Developer",
                "sub_title"    : "...",
                "status"       : "In Progress",
                "priority"     : "Critical",
                "target_year"  : 2025,
                "target_score" : 95,
                "current_score": 72,
                "progress_pct" : 75
            }
        ]
    }
    """
    from flask import request                                          # Import inside route — avoids circular import

    profile_id = request.args.get('profile_id')                        # Read query parameter

    if not profile_id:
        return jsonify({'error': 'profile_id is required'}), 400       # Guard: missing param

    try:
        profile = Profile.objects.get(id=profile_id)                   # Validate profile exists

        # Fetch all goals ordered by target year then priority
        goals = Goal.objects(profile=profile).order_by('target_year', '-priority')

        goals_data = []
        for g in goals:
            target  = g.target_score or 100                            # Avoid division by zero
            current = g.current_score or 0                             # Default to 0
            pct     = min(round((current / target) * 100), 100)        # Cap at 100%

            goals_data.append({
                'id'           : str(g.id),                            # MongoDB ObjectId as string
                'goal_name'    : g.goal_name or '',                    # Goal display name
                'sub_title'    : g.sub_title or '',                    # Optional subtitle
                'status'       : g.status or 'Planned',                # Status enum value
                'priority'     : g.priority or 'Medium',               # Priority enum value
                'target_year'  : g.target_year,                        # Target achievement year
                'target_score' : int(target),                          # Target proficiency score
                'current_score': int(current),                         # Current calculated score
                'progress_pct' : pct,                                  # Percentage toward target
            })

        return jsonify({'count': len(goals_data), 'goals': goals_data}), 200

    except Profile.DoesNotExist:
        return jsonify({'error': 'Profile not found'}), 404

    except Exception as e:
        logging.error(f"[DASHBOARD API] /goals-dashboard failed: {str(e)}")
        return jsonify({'error': str(e)}), 500