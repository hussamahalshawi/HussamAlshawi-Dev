from flask import Blueprint, jsonify                               # Core Flask utilities
from App.models.goal import Goal                                   # Goal model
from App.models.profile import Profile                             # Profile model
from App.models.skills import ProfileSkill                         # ProfileSkill for score lookup


# -------------------------------------------------------------------------
# BLUEPRINT REGISTRATION
# -------------------------------------------------------------------------
goals_bp = Blueprint('goals', __name__)                            # Blueprint name for url_for()


@goals_bp.route('/goals', methods=['GET'])
def get_goals_with_skills():
    """
    Returns all goals with their required skills and the current ProfileSkill
    score for each required skill.

    Matching strategy:
        - Tokenizes each ProfileSkill name into individual words.
        - Tokenizes each required_skill into individual words.
        - First token match wins — score counted once per required_skill.
        - Uses break after first match to prevent double-counting.

    Response shape:
    {
        "count": 10,
        "goals": [
            {
                "id"             : "...",
                "goal_name"      : "Foundations — Python, Math...",
                "sub_title"      : "...",
                "status"         : "Planned",
                "priority"       : "Critical",
                "target_year"    : 2025,
                "target_score"   : 95,
                "current_score"  : 28,
                "required_skills": [
                    {
                        "skill_name"   : "Python",
                        "profile_score": 100,
                        "matched"      : true
                    },
                    {
                        "skill_name"   : "Linear Algebra",
                        "profile_score": 68,
                        "matched"      : true
                    },
                    {
                        "skill_name"   : "Bash scripting",
                        "profile_score": 0,
                        "matched"      : false
                    }
                ]
            }
        ]
    }
    """
    try:
        # Step 1: Fetch the active profile
        profile = Profile.objects.first()                              # Single portfolio profile

        if not profile:
            return jsonify({'error': 'No profile found'}), 404        # Guard: no profile

        # Step 2: Pre-fetch ALL ProfileSkill docs in ONE query
        # Build token map: {token: best_score}
        # Each ProfileSkill name is split into tokens
        # e.g. "Linear Algebra" → {"linear": 68, "algebra": 68}
        # If same token appears in multiple skills → keep highest score
        token_score_map = {}                                           # {token_str: best_score}

        for ps in ProfileSkill.objects(profile=profile).select_related():
            if not ps.skill:
                continue                                               # Skip orphaned references

            tokens = ps.skill.skill_name.strip().lower().split()      # Tokenize skill name

            for token in tokens:
                # Keep highest score per token across all ProfileSkill docs
                if token not in token_score_map or ps.score > token_score_map[token]:
                    token_score_map[token] = ps.score                 # Map token → best score

        # Step 3: Fetch all goals for this profile — ordered by year then priority
        goals = Goal.objects(profile=profile).order_by('target_year', '-priority')

        # Step 4: Build response for each goal
        goals_data = []

        for goal in goals:
            skills_data = []

            for skill_name in (goal.required_skills or []):
                if not skill_name:
                    continue                                           # Skip empty entries

                # Tokenize the required skill name
                req_tokens = skill_name.strip().lower().split()        # e.g. "Linear Algebra" → ["linear", "algebra"]

                best_score = 0                                         # Default: no match
                matched    = False                                     # Default: not matched

                for token in req_tokens:
                    if token in token_score_map:
                        best_score = token_score_map[token]            # Take score of first matching token
                        matched    = True                              # Mark as matched
                        break                                          # ← First match wins — no double counting

                skills_data.append({
                    'skill_name'   : skill_name,                       # Original name from goal
                    'profile_score': best_score,                       # 0 if no match found
                    'matched'      : matched                           # True if any token matched
                })

            # Sort: matched skills first, then by score descending, then alphabetically
            skills_data.sort(key=lambda x: (-x['profile_score'], x['skill_name']))

            goals_data.append({
                'id'             : str(goal.id),                       # MongoDB ObjectId as string
                'goal_name'      : goal.goal_name,                     # Goal display name
                'sub_title'      : goal.sub_title or '',               # Optional subtitle
                'status'         : goal.status,                        # Planned / In Progress / Achieved
                'priority'       : goal.priority,                      # Low / Medium / High / Critical
                'target_year'    : goal.target_year,                   # Year to achieve this goal
                'target_score'   : goal.target_score,                  # Target proficiency percentage
                'current_score'  : goal.current_score,                 # Auto-calculated score
                'required_skills': skills_data                         # Skills with match results
            })

        return jsonify({
            'count': len(goals_data),                                  # Total number of goals
            'goals': goals_data                                        # Full goals array
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500                         # Return error with details