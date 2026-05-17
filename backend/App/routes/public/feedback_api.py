from flask import Blueprint, jsonify, request  # Core Flask utilities
from App.models.feedback import Feedback  # Feedback model
from App.models.profile import Profile  # Profile model — to link ownership

feedback_bp = Blueprint('feedback_api', __name__)  # Blueprint for feedback routes


@feedback_bp.route('/feedback', methods=['POST'])
def submit_feedback():
    """
    Public endpoint — receives feedback from the portfolio contact form.
    No authentication required. Validates required fields server-side.
    Automatically links the submission to the active profile.

    Expected JSON body:
        {
            "name"       : "Ahmad Khalid",
            "email"      : "ahmad@example.com",
            "company"    : "Google",          (optional)
            "job_title"  : "Engineering Lead", (optional)
            "message"    : "Great portfolio!"
        }

    Returns:
        201: Success with confirmation message.
        400: Validation error with field details.
        500: Unexpected server error.
    """
    data = request.get_json(silent=True) or {}  # Parse JSON body safely

    # --- Server-side validation ---
    name = (data.get('name') or '').strip()  # Required: sender name
    email = (data.get('email') or '').strip()  # Required: sender email
    message = (data.get('message') or '').strip()  # Required: feedback content

    errors = {}  # Accumulate all validation errors

    if not name:
        errors['name'] = 'Name is required.'  # Guard: missing name

    if not email or '@' not in email:
        errors['email'] = 'A valid email address is required.'  # Guard: missing or malformed email

    if not message:
        errors['message'] = 'Message cannot be empty.'  # Guard: missing message

    if errors:
        return jsonify({'success': False, 'errors': errors}), 400  # Return all errors at once

    try:
        profile = Profile.objects.first()  # Fetch the active portfolio profile

        fb = Feedback(
            profile=profile,  # Link to portfolio owner
            sender_name=name,  # Validated sender name
            sender_email=email,  # Validated sender email
            company_name=(data.get('company') or '').strip() or None,  # Optional — None if empty
            job_title=(data.get('job_title') or '').strip() or None,  # Optional — None if empty
            message=message,  # Validated message body
        )
        fb.save()  # Persist to MongoDB

        return jsonify({'success': True, 'message': 'Thank you! Your message has been received.'}), 201

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500  # Return server error details


@feedback_bp.route('/feedback/featured', methods=['GET'])
def get_featured_feedback():
    """
    Public endpoint — returns only featured testimonials for the portfolio frontend.
    Featured entries are curated by the admin via the Feedback Inbox admin view.

    Returns:
        200: List of featured feedback entries.
        404: No profile found.
    """
    profile = Profile.objects.first()  # Fetch the active profile

    if not profile:
        return jsonify({'error': 'No profile found.'}), 404  # Guard: portfolio not configured

    entries = Feedback.objects(
        profile=profile,
        is_featured=True  # Only return curated testimonials
    ).order_by('-submitted_at')  # Newest featured entries first

    data = [
        {
            'name': f.sender_name,  # Display name for testimonial card
            'company': f.company_name or '',  # Company shown on the card
            'job_title': f.job_title or '',  # Role shown on the card
            'message': f.message,  # The testimonial text
            'submitted_at': f.submitted_at.isoformat(),  # ISO timestamp for frontend sorting
        }
        for f in entries
    ]

    return jsonify({'count': len(data), 'testimonials': data}), 200
