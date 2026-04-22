from flask_admin.contrib.mongoengine import ModelView        # Base MongoEngine ModelView
from flask import redirect, url_for, request                  # Core Flask utilities


class ProfessionalModelView(ModelView):
    """
    Base Admin View:
    Enforces global standards across all admin panels including:
    - Consistent pagination and UI settings.
    - Automatic profile ownership assignment on every record creation.
    """

    # --- UI LIBRARIES ---
    extra_css = [
        'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css'  # Select2 dropdown styling
    ]

    # --- PAGINATION ---
    page_size = 20                                             # Display 20 items per page

    # --- PERMISSIONS ---
    can_create     = True                                      # Allow record creation
    can_edit       = True                                      # Allow record editing
    can_delete     = True                                      # Allow record deletion
    can_view_details = True                                    # Allow detail view

    # --- MODAL DEFAULTS ---
    create_modal  = True                                       # Default: use modal for creation
    edit_modal    = True                                       # Default: use modal for editing
    details_modal = True                                       # Default: use modal for detail view

    # -------------------------------------------------------------------------
    # AUTO PROFILE ASSIGNMENT
    # -------------------------------------------------------------------------

    def _get_active_profile(self):
        """
        Fetches the single active Profile document from MongoDB.
        Returns None if no profile exists yet (safe fallback).

        Returns:
            Profile | None: The primary portfolio profile document.
        """
        try:
            from App.models.profile import Profile             # Local import to avoid circular dependency
            return Profile.objects.first()                     # Portfolio always has exactly one profile
        except Exception:
            return None                                        # Graceful fallback if DB is unavailable

    def on_model_change(self, form, model, is_created):
        """
        Base lifecycle hook triggered before every save.
        Automatically assigns the profile reference to any model that has a 'profile' field.
        Subclasses should call super().on_model_change(...) to preserve this behavior.

        Args:
            form: The submitted WTForms form instance.
            model: The MongoEngine document being saved.
            is_created (bool): True if this is a new record, False if editing.
        """
        # Step 1: Check if this model has a 'profile' field (not all models need it)
        if hasattr(model, 'profile') and model.profile is None:

            # Step 2: Fetch the active profile from the database
            profile = self._get_active_profile()

            if profile:
                # Step 3: Assign the profile reference before Flask-Admin saves the document
                model.profile = profile                        # Link this record to the owner profile