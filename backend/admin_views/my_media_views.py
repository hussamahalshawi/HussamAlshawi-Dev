# The correct way for modern Flask/Jinja2 versions
try:
    from markupsafe import Markup
except ImportError:
    from jinja2 import Markup

from admin_views.admin_view import ProfessionalModelView

try:
    from markupsafe import Markup
except ImportError:
    from jinja2 import Markup

from flask import request
from wtforms import MultipleFileField  # Essential for multi-selection
from admin_views.admin_view import ProfessionalModelView
from App.utils.cloudinary_handler import upload_media_batch


class MediaVaultAdminView(ProfessionalModelView):
    """
    Admin View with multi-file selection from local machine.
    """
    column_list = ('vault_name', 'content_type', 'media_preview', 'last_updated')

    # Add a custom field for the creation/edit form
    # This creates ONE button that allows you to select 20+ files at once
    form_extra_fields = {
        'file_upload': MultipleFileField('Select Media Files (Images/Videos)')
    }

    def on_model_change(self, form, model, is_created):
        """
        Process uploaded files through Cloudinary with specific sub-folder routing.
        """
        # English Comment: Retrieve files from the custom form field
        files = request.files.getlist('file_upload')

        # Filter valid files
        valid_files = [f for f in files if f.filename != '']

        if valid_files:
            # English Comment: Explicitly defining the sub_folder as 'my_media'
            # This ensures these files go to: hussam_Dev/my_media/[vault_name]
            new_urls = upload_media_batch(
                valid_files,
                folder_name=model.vault_name,
                sub_folder="my_media"
            )

            # Initialize or extend the media_links list
            if not model.media_links:
                model.media_links = []

            model.media_links.extend(new_urls)

    def _media_preview(view, context, model, name):
        if not model.media_links:
            return "Empty"
        first_url = model.media_links[0]
        is_video = any(ext in first_url.lower() for ext in ['.mp4', '.mov', '.avi', '.wmv'])

        if is_video:
            return Markup(
                f'<span style="color: #17a2b8; font-weight: bold;">Video Vault ({len(model.media_links)})</span>')
        return Markup(
            f'<img src="{first_url}" width="60" style="border-radius: 8px; border: 1px solid #ddd; object-fit: cover;">')

    column_formatters = {'media_preview': _media_preview}

    column_labels = {
        'vault_name': 'Collection Name',
        'file_upload': 'Upload from Device',
        'media_links': 'Cloudinary Database Links'
    }
