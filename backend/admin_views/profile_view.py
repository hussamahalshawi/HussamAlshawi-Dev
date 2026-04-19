try:
    from markupsafe import Markup
except ImportError:
    from jinja2 import Markup

from flask import flash, redirect, url_for, request
from flask_admin.actions import action
from wtforms import FileField, MultipleFileField
from admin_views.admin_view import ProfessionalModelView
from App.utils.cloudinary_handler import upload_media_batch
from App.services.profile_service import ProfileService

class ProfileAdminView(ProfessionalModelView):
    """
    Identity Hub Admin: Central management for personal branding, social links, and galleries.
    Features:
    - Single Avatar handling for branding.
    - Multiple Gallery uploads for 'About Me' sections.
    - Dynamic URL validation to prevent database crashes.
    """

    # --- 1. View Configuration ---
    create_template = 'admin/model/create.html'
    edit_template = 'admin/model/create.html'

    # English Comment: Disable modals to ensure the custom smart template renders correctly
    create_modal = False
    edit_modal = False

    can_create = True
    can_edit = True
    can_delete = False

    # --- 2. List View Columns ---
    column_list = ('avatar_preview', 'full_name', 'title', 'experience_years', 'overall_score', 'last_updated')

    column_labels = {
        'avatar_preview': 'Photo',
        'full_name': 'Name',
        'title': 'Job Title',
        'experience_years': 'Exp (Years)',
        'overall_score': 'Score %',
        'last_updated': 'Sync Date'
    }

    # --- 3. Form Configuration & Extra Fields ---
    # English Comment: Define separate fields for single profile photo and multiple gallery images
    form_extra_fields = {
        'avatar_upload': FileField('Primary Profile Photo'),
        'gallery_upload': MultipleFileField('Upload to About Gallery (Multiple)')
    }

    # English Comment: Explicitly define the order and visibility of all fields including social links
    form_columns = (
        'full_name', 'title', 'bio', 'email', 'phone', 'address',
        'is_available_for_hire',
        'remote_preference',
        'avatar_upload',  # Custom field for single upload
        'gallery_upload',  # Custom field for multiple uploads
        'github_url', 'linkedin_url', 'facebook_url',
        'instagram_url', 'medium_url'
    )

    # --- 4. Core Logic: Saving & Validation ---
    def on_model_change(self, form, model, is_created):
        """
        English Comment: Orchestrates data sanitization and cloud media processing.
        Handles both single and multiple file streams.
        """

        # A. URL Sanitization: Prevent MongoEngine ValidationError (Invalid Scheme)
        # English Comment: Convert empty strings to None to satisfy URLField requirements
        social_fields = ['github_url', 'linkedin_url', 'facebook_url', 'instagram_url', 'medium_url']
        for field_name in social_fields:
            val = getattr(model, field_name, None)
            if not val or str(val).strip() == "":
                setattr(model, field_name, None)

        # B. Primary Avatar Processing
        # English Comment: Upload single profile image to 'Identity/profile' folder
        avatar_file = request.files.get('avatar_upload')
        if avatar_file and avatar_file.filename != '':
            avatar_urls = upload_media_batch([avatar_file], folder_name="Identity", sub_folder="profile")
            if avatar_urls:
                model.primary_avatar = avatar_urls[0]

        # C. Profile Gallery Processing (Multiple Files)
        # English Comment: Batch upload selected images to 'Identity/gallery' and append to ListField
        gallery_files = request.files.getlist('gallery_upload')
        valid_files = [f for f in gallery_files if f and f.filename != '']

        if valid_files:
            new_gallery_urls = upload_media_batch(valid_files, folder_name="gallery", sub_folder="profile")
            if new_gallery_urls:
                if not model.profile_gallery:
                    model.profile_gallery = []
                model.profile_gallery.extend(new_gallery_urls)

        # English Comment: Finalize and trigger metrics update
        model.save()  # Save changes to apply cloud URLs
        ProfileService.calculate_metrics(model.id)  # Perform heavy calculations via service

    # --- 5. UI Formatters ---
    def _avatar_preview(view, context, model, name):
        """
        English Comment: Circular preview for the index table.
        """
        if not model.primary_avatar:
            return Markup('<div class="rounded-circle bg-secondary" style="width:40px;height:40px;opacity:0.3;"></div>')
        return Markup(f'''
            <img src="{model.primary_avatar}" 
                 style="width:45px; height:45px; border-radius: 50%; object-fit: cover; border: 2px solid #2563eb; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        ''')

    column_formatters = {
        'avatar_preview': _avatar_preview
    }

    # --- 6. Bulk Actions ---
    @action('refresh_profile_metrics', 'Refresh Metrics', 'Synchronize experience and scores?')
    def action_refresh_metrics(self, ids):
        """
        English Comment: Bulk trigger for the ProfileService logic instead of model methods.
        """
        try:
            count = 0
            for profile_id in ids:
                # English Comment: Use the centralized service to maintain architectural consistency
                success = ProfileService.calculate_metrics(profile_id)
                if success:
                    count += 1
            flash(f'Successfully updated metrics for {count} profile(s).', 'success')
        except Exception as e:
            flash(f'Sync Error: {str(e)}', 'error')

        return redirect(url_for('.index_view'))