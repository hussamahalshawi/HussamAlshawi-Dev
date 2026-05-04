from flask import Blueprint, jsonify                               # Core Flask utilities
from App.models.profile  import Profile                            # Profile model — ownership anchor
from App.models.language import Language                           # Language proficiency model
from App.models.feedback import Feedback                           # Visitor feedback model
import logging                                                     # Error tracking


# -------------------------------------------------------------------------
# BLUEPRINT REGISTRATION
# -------------------------------------------------------------------------
languages_feedback_bp = Blueprint('languages_feedback', __name__)  # Blueprint name for url_for()


# -------------------------------------------------------------------------
# ROUTE 1: GET /api/dashboard-languages?profile_id=<id>
# Returns all language records for the selected profile
# -------------------------------------------------------------------------
@languages_feedback_bp.route('/dashboard-languages', methods=['GET'])
def get_dashboard_languages():
    """
    Returns all Language documents for a given profile.
    Used to render the language progress bars on the analytics dashboard.

    Query param:
        profile_id (str): MongoDB ObjectId of the target profile.

    Response shape:
    {
        "count": 3,
        "languages": [
            {
                "language_name": "Arabic",
                "proficiency"  : "Native",
                "level_score"  : 100
            },
            ...
        ]
    }
    """
    from flask import request                                      # Import inside route — avoids circular import

    profile_id = request.args.get('profile_id')                    # Read query parameter

    if not profile_id:
        return jsonify({'error': 'profile_id is required'}), 400   # Guard: missing param

    try:
        profile   = Profile.objects.get(id=profile_id)             # Validate profile exists
        languages = Language.objects(profile=profile).order_by('language_name')  # Alphabetical

        # Proficiency → numeric score mapping for progress bar rendering
        # Maps each CEFR-style level to a percentage width (0–100)
        LEVEL_SCORE = {
            'Native'      : 100,                                   # Full bar — mother tongue
            'Fluent'      : 85,                                    # Near-native level
            'Advanced'    : 70,                                    # C1 — handles complex topics
            'Intermediate': 50,                                    # B1/B2 — everyday communication
            'Beginner'    : 25,                                    # A1/A2 — basic understanding
        }

        data = [
            {
                'language_name': lang.language_name or '',         # Display name
                'proficiency'  : lang.proficiency   or '',         # Level label
                'level_score'  : LEVEL_SCORE.get(lang.proficiency, 50),  # Bar width percentage
            }
            for lang in languages
        ]

        return jsonify({'count': len(data), 'languages': data}), 200

    except Profile.DoesNotExist:
        return jsonify({'error': 'Profile not found'}), 404

    except Exception as e:
        logging.error(f"[LANGUAGES API] /dashboard-languages failed: {str(e)}")
        return jsonify({'error': str(e)}), 500


# -------------------------------------------------------------------------
# ROUTE 2: GET /api/dashboard-feedback?profile_id=<id>
# Returns feedback stats and the latest unread message
# -------------------------------------------------------------------------
@languages_feedback_bp.route('/dashboard-feedback', methods=['GET'])
def get_dashboard_feedback():
    """
    Returns feedback statistics and the most recent unread message
    for the analytics dashboard inbox widget.

    Query param:
        profile_id (str): MongoDB ObjectId of the target profile.

    Response shape:
    {
        "stats": {
            "total"   : 12,
            "unread"  : 3,
            "featured": 5
        },
        "latest": {
            "sender_name" : "Ahmad Khalid",
            "company_name": "Google",
            "job_title"   : "Engineering Lead",
            "message"     : "Great portfolio!",
            "submitted_at": "2026-01-15T10:30:00+00:00"
        }
    }
    """
    from flask import request                                      # Import inside route — avoids circular import

    profile_id = request.args.get('profile_id')                    # Read query parameter

    if not profile_id:
        return jsonify({'error': 'profile_id is required'}), 400   # Guard: missing param

    try:
        profile = Profile.objects.get(id=profile_id)               # Validate profile exists

        # --- Aggregated counts (3 lightweight queries) ---
        total    = Feedback.objects(profile=profile).count()        # All feedback entries
        unread   = Feedback.objects(profile=profile, is_read=False).count()    # Unread only
        featured = Feedback.objects(profile=profile, is_featured=True).count() # Featured only

        # --- Latest unread message (single document fetch) ---
        latest_entry = Feedback.objects(
            profile=profile,
            is_read=False                                          # Prioritize unread entries
        ).order_by('-submitted_at').first()                        # Most recent first

        # Fall back to latest overall if no unread entries exist
        if not latest_entry:
            latest_entry = Feedback.objects(profile=profile).order_by('-submitted_at').first()

        # Serialize the latest entry — None-safe
        latest = None
        if latest_entry:
            latest = {
                'sender_name' : latest_entry.sender_name  or '',  # Visitor name
                'company_name': latest_entry.company_name or '',  # Optional company
                'job_title'   : latest_entry.job_title    or '',  # Optional role
                'message'     : latest_entry.message      or '',  # Message body
                'is_read'     : latest_entry.is_read,             # Read status flag
                'submitted_at': latest_entry.submitted_at.isoformat() if latest_entry.submitted_at else '',
            }

        return jsonify({
            'stats' : {
                'total'   : total,                                 # Total feedback count
                'unread'  : unread,                                # Unread messages count
                'featured': featured,                              # Featured testimonials count
            },
            'latest': latest,                                      # Most recent (unread-first) entry
        }), 200

    except Profile.DoesNotExist:
        return jsonify({'error': 'Profile not found'}), 404

    except Exception as e:
        logging.error(f"[FEEDBACK API] /dashboard-feedback failed: {str(e)}")
        return jsonify({'error': str(e)}), 500