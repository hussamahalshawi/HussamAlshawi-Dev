"""
Portfolio Public API — profile.py
===================================
Endpoint  : GET /api/portfolio/profile
Purpose   : Returns the complete public-facing profile payload for the
            hero section, about page, contact widget, and social links.
Author    : HussamAlshawi-Dev
"""

from flask import Blueprint, jsonify                          # Core Flask utilities
from App.models.profile import Profile                        # Profile MongoEngine document


# ── Blueprint registration ────────────────────────────────────────────────────
portfolio_profile_bp = Blueprint('portfolio_profile', __name__)


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/portfolio/profile
# Returns a single profile document with all public-facing fields.
# ─────────────────────────────────────────────────────────────────────────────
@portfolio_profile_bp.route('/portfolio/profile', methods=['GET'])
def get_public_profile():
    """
    Returns the complete public portfolio profile.

    Used by:
        - Hero section (name, title, avatar, availability badge)
        - About section (bio, address, contact info)
        - Social links bar (github, linkedin, etc.)
        - Hire-me CTA (is_available_for_hire, remote_preference)
        - Profile gallery (profile_gallery list)
        - Analytics widgets (experience_years, overall_score)

    Response shape:
    {
        "id"                    : "...",
        "full_name"             : "Hussam Alshawi",
        "title"                 : "Full Stack Developer | AI Enthusiast",
        "bio"                   : "...",
        "email"                 : "hussam@example.com",
        "phone"                 : "+962...",
        "address"               : "Amman, Jordan",
        "is_available_for_hire" : true,
        "remote_preference"     : true,
        "experience_years"      : 5.2,
        "overall_score"         : 78.4,
        "primary_avatar"        : "https://res.cloudinary.com/...",
        "profile_gallery"       : ["https://...", "https://..."],
        "social"                : {
            "github"   : "https://github.com/...",
            "linkedin" : "https://linkedin.com/...",
            "facebook" : null,
            "instagram": null,
            "medium"   : null
        }
    }
    """
    try:
        profile = Profile.objects.first()                     # Fetch the single portfolio profile

        if not profile:                                       # Guard: no profile configured yet
            return jsonify({'error': 'Profile not found'}), 404

        # Build and return the public payload
        return jsonify({
            'id'                    : str(profile.id),
            'full_name'             : profile.full_name or '',
            'title'                 : profile.title or '',
            'bio'                   : profile.bio or '',
            'email'                 : profile.email or '',
            'phone'                 : profile.phone or '',
            'address'               : profile.address or '',
            'is_available_for_hire' : bool(profile.is_available_for_hire),
            'remote_preference'     : bool(profile.remote_preference),
            'experience_years'      : round(float(profile.experience_years or 0), 1),
            'overall_score'         : round(float(profile.overall_score or 0), 1),
            'primary_avatar'        : profile.primary_avatar or '',
            'profile_gallery'       : list(profile.profile_gallery or []),
            'social': {
                'github'   : profile.github_url    or None,
                'linkedin' : profile.linkedin_url  or None,
                'facebook' : profile.facebook_url  or None,
                'instagram': profile.instagram_url or None,
                'medium'   : profile.medium_url    or None,
            },
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500                # Return server error details