from flask import Blueprint, current_app, request, jsonify
from App import cache                            # Import shared cache instance
# English Comment: Use your specific variable name 'Api' as requested
Api = Blueprint('main', __name__)


@Api.route('/dev/cache-status', methods=['GET'])
def cache_status():
    """Temporary dev route — shows what's currently stored in RAM cache."""

    keys = [
        'public_profile', 'public_analytics', 'public_tech_stack',
        'public_timeline', 'public_skills', 'public_skills_summary',
        'public_projects', 'public_experience',
    ]

    status = {}
    for key in keys:
        value = cache.get(key)  # Try to read from RAM
        status[key] = '✅ IN RAM' if value else '❌ NOT CACHED'

    return jsonify(status)