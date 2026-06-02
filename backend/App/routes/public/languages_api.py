"""
Portfolio Public API — languages_api.py
=========================================
Endpoints:
    GET /api/portfolio/languages   — language proficiency with visual tokens

Extracted from:
    - goals_languages_api.py  (GET /portfolio/languages)
    - languages_feedback_api.py (GET /dashboard-languages — admin version)

Author: HussamAlshawi-Dev
"""

import logging                                                        # Error tracking
from flask import Blueprint, jsonify                                  # Core Flask utilities
from App import cache                                                 # Cache decorator
from App.models.language import Language                              # Language proficiency model
from App.routes.helpers.route_helpers import get_profile             # Shared helper — no duplication


# ── Blueprint registration ────────────────────────────────────────────────────
languages_public_bp = Blueprint('languages_public', __name__)         # Blueprint name for url_for()


# ── Proficiency level metadata — single source of truth ──────────────────────
# Replaces LEVEL_SCORE in languages_feedback_api.py and PROFICIENCY_META in goals_languages_api.py
PROFICIENCY_META = {                                                   # Maps proficiency label to visual tokens
    'Native'      : {'score': 100, 'color': '#1D9E75', 'bg': '#E1F5EE', 'icon': '🌍'},
    'Fluent'      : {'score': 85,  'color': '#185FA5', 'bg': '#E6F1FB', 'icon': '💬'},
    'Advanced'    : {'score': 70,  'color': '#534AB7', 'bg': '#EEEDFE', 'icon': '📚'},
    'Intermediate': {'score': 50,  'color': '#854F0B', 'bg': '#FAEEDA', 'icon': '🗣️'},
    'Beginner'    : {'score': 25,  'color': '#5F5E5A', 'bg': '#F1EFE8', 'icon': '🌱'},
}


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE  GET /api/portfolio/languages
# Language proficiency list with visual tokens for the public portfolio
# ─────────────────────────────────────────────────────────────────────────────
@languages_public_bp.route('/portfolio/languages', methods=['GET'])
@cache.cached(timeout=300)
def get_public_languages():
    """
    Returns all language proficiency records with visual metadata.

    Used by:
        - Languages widget in About / Skills sections
        - Proficiency progress bars
        - Language cards with emoji + color tokens

    Response shape:
    {
        "count": 3,
        "languages": [
            {
                "language_name" : "Arabic",
                "proficiency"   : "Native",
                "level_score"   : 100,
                "color"         : "#1D9E75",
                "bg"            : "#E1F5EE",
                "icon"          : "🌍"
            }
        ]
    }
    """
    try:
        profile = get_profile()                                        # Fetch active profile via shared helper

        if not profile:
            return jsonify({'error': 'Profile not found'}), 404        # Guard: no profile configured

        records = Language.objects(profile=profile).order_by('language_name').only(
    'language_name', 'proficiency',
)

        result = []
        for lang in records:
            # Resolve visual metadata — fall back to Intermediate if unknown proficiency
            meta = PROFICIENCY_META.get(lang.proficiency or '', PROFICIENCY_META['Intermediate'])

            result.append({
                'language_name': lang.language_name or '',             # Display name e.g. 'Arabic'
                'proficiency'  : lang.proficiency   or '',             # Level label e.g. 'Native'
                'level_score'  : meta['score'],                        # Numeric score 0-100
                'color'        : meta['color'],                        # Text/bar color hex
                'bg'           : meta['bg'],                           # Background color hex
                'icon'         : meta['icon'],                         # Emoji icon for the level
            })

        return jsonify({'count': len(result), 'languages': result}), 200  # Return languages payload

    except Exception as e:
        logging.error(f'[LANGUAGES API] /portfolio/languages failed: {str(e)}')
        return jsonify({'error': str(e)}), 500                         # Return error with details