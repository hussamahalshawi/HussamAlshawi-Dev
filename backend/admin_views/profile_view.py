try:
    from markupsafe import Markup
except ImportError:
    from jinja2 import Markup

import logging                                                        # Error tracking for after_model_change
from flask import flash, redirect, url_for, request                  # Core Flask utilities
from flask_admin.actions import action                               # Bulk action decorator
from wtforms import FileField, MultipleFileField                     # Virtual file upload fields
from admin_views.admin_view import ProfessionalModelView             # Authenticated base view
from App.utils.cloudinary_handler import upload_media_batch          # Cloudinary batch upload utility
from App.services.profile_service import ProfileService              # Metrics calculation service


class ProfileAdminView(ProfessionalModelView):
    """
    Identity Hub Admin View.
    Manages personal branding, social links, avatar, and gallery uploads.

    Lifecycle hooks:
        on_model_change     — handles media uploads and URL sanitization only.
                              Never calls ProfileService here because model.id
                              does not exist yet when is_created=True.
        after_model_change  — calls ProfileService.calculate_metrics() safely
                              because Flask-Admin has already saved the document
                              and assigned a valid MongoDB ObjectId.
    """

    # --- VIEW CONFIGURATION ---
    create_template = 'admin/model/create.html'                      # Full-page premium layout
    edit_template   = 'admin/model/create.html'                      # Full-page premium layout

    create_modal = False                                             # Disable modal — use full page
    edit_modal   = False                                             # Disable modal — use full page

    can_create = True                                                # Allow profile creation
    can_edit   = True                                                # Allow profile editing
    can_delete = False                                               # Prevent accidental deletion

    # --- LIST VIEW ---
    column_list = (
        'avatar_preview', 'full_name', 'title',
        'experience_years', 'overall_score', 'last_updated'
    )

    column_labels = {
        'avatar_preview' : 'Photo',
        'full_name'      : 'Name',
        'title'          : 'Job Title',
        'experience_years': 'Exp (Years)',
        'overall_score'  : 'Score %',
        'last_updated'   : 'Sync Date'
    }

    # --- FORM EXTRA FIELDS ---
    form_extra_fields = {
        'avatar_upload' : FileField('Primary Profile Photo'),        # Single avatar upload
        'gallery_upload': MultipleFileField('Upload to About Gallery (Multiple)')  # Multi gallery upload
    }

    form_columns = (
        'full_name', 'title', 'bio', 'email', 'phone', 'address',
        'is_available_for_hire',
        'remote_preference',
        'avatar_upload',                                             # Virtual field — single image
        'gallery_upload',                                            # Virtual field — multiple images
        'github_url', 'linkedin_url', 'facebook_url',
        'instagram_url', 'medium_url'
    )

    # -------------------------------------------------------------------------
    # LIFECYCLE HOOK 1: before save
    # Handles media uploads and URL sanitization ONLY.
    # Must NOT call ProfileService here — model.id is None when is_created=True.
    # -------------------------------------------------------------------------

    def on_model_change(self, form, model, is_created):
        """
        Triggered by Flask-Admin BEFORE saving the document to MongoDB.

        Responsibilities:
            1. Sanitize social URL fields — convert empty strings to None
               so MongoEngine URLField does not raise a ValidationError.
            2. Upload the primary avatar to Cloudinary and store the URL.
            3. Upload gallery images to Cloudinary and append URLs to the list.

        Why ProfileService is NOT called here:
            When is_created=True, Flask-Admin has not yet called model.save(),
            so model.id is None at this point. Passing None to
            ProfileService.calculate_metrics() causes a DoesNotExist exception.
            Metrics are recalculated safely in after_model_change() instead.

        Args:
            form      : The submitted WTForms form instance.
            model     : The Profile document about to be saved.
            is_created: True if this is a new record, False if editing.
        """

        # Step 1: Sanitize social URL fields
        # URLField raises ValidationError if it receives an empty string instead of None
        social_fields = [
            'github_url', 'linkedin_url', 'facebook_url',
            'instagram_url', 'medium_url'
        ]
        for field_name in social_fields:
            value = getattr(model, field_name, None)                 # Read current field value
            if not value or str(value).strip() == '':
                setattr(model, field_name, None)                     # Replace empty string with None

        # Step 2: Primary avatar upload
        avatar_file = request.files.get('avatar_upload')             # Get the single uploaded file
        if avatar_file and avatar_file.filename != '':
            avatar_urls = upload_media_batch(
                [avatar_file],
                folder_name='Identity',                              # Cloudinary folder
                sub_folder='profile'                                 # Subfolder path
            )
            if avatar_urls:
                model.primary_avatar = avatar_urls[0]               # Store the returned Cloudinary URL

        # Step 3: Profile gallery upload (multiple files)
        gallery_files = request.files.getlist('gallery_upload')      # Get all uploaded gallery files
        valid_files   = [f for f in gallery_files if f and f.filename != '']  # Filter empty inputs

        if valid_files:
            new_gallery_urls = upload_media_batch(
                valid_files,
                folder_name='gallery',                               # Cloudinary folder
                sub_folder='profile'                                 # Subfolder path
            )
            if new_gallery_urls:
                if not model.profile_gallery:
                    model.profile_gallery = []                       # Initialize list if empty
                model.profile_gallery.extend(new_gallery_urls)       # Append new URLs without overwriting

    # -------------------------------------------------------------------------
    # LIFECYCLE HOOK 2: after save
    # Safe to call ProfileService here — model.id is guaranteed to exist.
    # -------------------------------------------------------------------------

    def after_model_change(self, form, model, is_created):
        """
        Triggered by Flask-Admin AFTER the document has been saved to MongoDB.

        At this point model.id is a valid MongoDB ObjectId regardless of
        whether this was a create or edit operation, so ProfileService
        can safely query the database using it.

        Responsibilities:
            1. Recalculate experience_years and overall_score via ProfileService.

        Args:
            form      : The submitted WTForms form instance.
            model     : The saved Profile document (has a valid .id now).
            is_created: True if this was a new record, False if editing.
        """
        try:
            ProfileService.calculate_metrics(model.id)               # Safe — model.id exists after save

        except Exception as e:
            logging.error(
                f"ProfileAdminView.after_model_change: "
                f"metrics calculation failed for profile [{model.id}] — {str(e)}"
            )

    # -------------------------------------------------------------------------
    # UI FORMATTER
    # -------------------------------------------------------------------------

    def _avatar_preview(view, context, model, name):
        """
        Renders a circular avatar thumbnail in the list view table.
        Falls back to a grey placeholder circle if no avatar is set.

        Args:
            view   : The current admin view instance.
            context: The Jinja2 template context.
            model  : The current Profile document row.
            name   : The column name being rendered.

        Returns:
            Markup: Safe HTML string for the avatar cell.
        """
        if not model.primary_avatar:
            # Render a grey placeholder circle when no avatar is uploaded
            return Markup(
                '<div class="rounded-circle bg-secondary" '
                'style="width:40px;height:40px;opacity:0.3;"></div>'
            )

        return Markup(
            f'<img src="{model.primary_avatar}" '
            f'style="width:45px; height:45px; border-radius:50%; '
            f'object-fit:cover; border:2px solid #2563eb; '
            f'box-shadow:0 2px 4px rgba(0,0,0,0.1);">'
        )

    column_formatters = {
        'avatar_preview': _avatar_preview                            # Register formatter for the column
    }

    # -------------------------------------------------------------------------
    # BULK ACTION
    # -------------------------------------------------------------------------

    @action('refresh_profile_metrics', 'Refresh Metrics', 'Synchronize experience and scores?')
    def action_refresh_metrics(self, ids):
        """
        Bulk admin action to manually trigger metric recalculation
        for one or more selected profiles.

        Uses ProfileService to maintain architectural consistency —
        the business logic stays in the service layer, not in the view.

        Args:
            ids: List of selected Profile ObjectIds from the admin checkbox.
        """
        try:
            count = 0
            for profile_id in ids:
                success = ProfileService.calculate_metrics(profile_id)  # Delegate to service layer
                if success:
                    count += 1

            flash(f'Successfully updated metrics for {count} profile(s).', 'success')

        except Exception as e:
            flash(f'Sync Error: {str(e)}', 'error')

        return redirect(url_for('.index_view'))                      # Return to list view after action