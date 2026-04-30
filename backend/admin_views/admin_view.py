from flask import redirect, url_for, request                         # Core Flask utilities
from auth.secure_views import SecureModelView                         # ← Authenticated base view
import re                                                             # Regex for skill name sanitization


def sanitize_skill_list(raw_list):
    """
    Cleans a list of skill name strings before saving to MongoDB.

    Removes trailing/leading garbage characters that sneak in from the admin
    form — Arabic commas (،٫), Western commas, dots, semicolons, and extra
    whitespace. Also collapses internal whitespace and drops empty results.

    Args:
        raw_list (list): Raw list of strings from the model field.

    Returns:
        list: Cleaned list with no empty or malformed entries.
    """
    cleaned = []

    for raw in (raw_list or []):
        if not raw:
            continue                                                   # Skip None and empty strings

        # Strip trailing garbage: spaces, EN/AR commas, dots, semicolons
        name = re.sub(r'[\s,،\u060c\u066b.;]+$', '', raw)            # Remove from end
        name = re.sub(r'^[\s,،\u060c\u066b.;]+', '', name)           # Remove from start
        name = ' '.join(name.split())                                  # Collapse internal spaces

        if name:
            cleaned.append(name)                                       # Only keep non-empty results

    return cleaned


class ProfessionalModelView(SecureModelView):
    """
    Base Admin View:
    Inherits from SecureModelView to enforce authentication on every admin panel.
    Adds global UI standards, pagination, and automatic profile assignment.

    Authentication flow:
        Request → SecureModelView.is_accessible() → AuthService.is_authenticated()
        → Allowed if session is valid, redirected to /admin/login otherwise.
    """

    # --- UI LIBRARIES ---
    extra_css = [
        'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css'  # Select2 dropdown styling
    ]

    # --- PAGINATION ---
    page_size = 20                                                    # Display 20 items per page

    # --- PERMISSIONS ---
    can_create      = True                                            # Allow record creation
    can_edit        = True                                            # Allow record editing
    can_delete      = True                                            # Allow record deletion
    can_view_details= True                                            # Allow detail view

    # --- MODAL DEFAULTS ---
    create_modal  = True                                              # Default: use modal for creation
    edit_modal    = True                                              # Default: use modal for editing
    details_modal = True                                              # Default: use modal for detail view

    # -------------------------------------------------------------------------
    # AUTO PROFILE ASSIGNMENT + SKILL SANITIZATION
    # -------------------------------------------------------------------------

    def _get_active_profile(self):
        """
        Fetches the single active Profile document from MongoDB.

        Returns:
            Profile | None
        """
        try:
            from App.models.profile import Profile
            return Profile.objects.first()
        except Exception:
            return None

    # Skill list field names present across all models — sanitized automatically
    SKILL_LIST_FIELDS = [
        'acquired_skills',       # Course
        'skills_used',           # Project
        'skills_acquired',       # Experience
        'skills_learned',        # Education, SelfStudy
        'skills_demonstrated',   # Achievement
        'required_skills',       # Goal
    ]

    def on_model_change(self, form, model, is_created):
        """
        Base lifecycle hook triggered before every save.

        Responsibilities:
            1. Auto-assign profile reference if missing.
            2. Sanitize all skill list fields to remove dirty characters
               (trailing commas, Arabic punctuation, extra spaces).

        Subclasses must call super().on_model_change(...) to keep this behavior.

        Args:
            form      : The submitted WTForms form instance.
            model     : The MongoEngine document being saved.
            is_created: True if new record, False if editing.
        """
        # Step 1: Auto-assign profile if this model supports ownership
        if hasattr(model, 'profile') and model.profile is None:
            profile = self._get_active_profile()
            if profile:
                model.profile = profile                               # Link to the active portfolio profile

        # Step 2: Sanitize every skill list field present on this model
        for field_name in self.SKILL_LIST_FIELDS:
            if hasattr(model, field_name):
                raw = getattr(model, field_name, [])
                setattr(model, field_name, sanitize_skill_list(raw))  # Replace with cleaned list