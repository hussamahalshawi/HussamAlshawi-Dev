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
        Triggered when you click Save. Handles the Cloudinary upload logic.
        """
        # Get the list of files from the 'file_upload' field
        files = request.files.getlist('file_upload')

        # Filter out any empty selections
        valid_files = [f for f in files if f.filename != '']

        if valid_files:
            # Call your Cloudinary service to upload and get URLs
            # folder_name can be the vault_name for organization
            new_urls = upload_media_batch(valid_files, folder_name=model.vault_name)

            # Store the returned URLs in the database field 'media_links'
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

# class MediaVaultAdminView(ProfessionalModelView):
#     """
#     Custom view for MediaVault located in backend/admin_views/
#     """
#     # Columns to display in the list view
#     column_list = ('vault_name', 'content_type', 'media_preview', 'last_updated')
#
#     # Enable search and filters
#     column_searchable_list = ('vault_name', 'description')
#     column_filters = ('content_type',)
#
#     def _media_preview(view, context, model, name):
#         """
#         Generates a visual thumbnail for images or a label for videos using Markup.
#         """
#         if not model.media_links:
#             return "Empty"
#
#         first_url = model.media_links[0]
#
#         # Check for video extensions
#         is_video = any(ext in first_url.lower() for ext in ['.mp4', '.mov', '.avi', '.wmv'])
#
#         if is_video:
#             # Use Markup instead of mark_safe
#             return Markup(
#                 f'<span style="color: #17a2b8; font-weight: bold;">Video Vault ({len(model.media_links)})</span>'
#             )
#
#         # Return image thumbnail using Markup
#         return Markup(
#             f'<img src="{first_url}" width="60" style="border-radius: 8px; border: 1px solid #ddd; object-fit: cover;">'
#         )
#
#     # Register the custom formatter
#     column_formatters = {
#         'media_preview': _media_preview
#     }
#
#     # Custom labels for English interface
#     column_labels = {
#         'vault_name': 'Collection Name',
#         'media_preview': 'Preview',
#         'media_links': 'Cloudinary URLs',
#         'content_type': 'Asset Type'
#     }
#
#     # Layout for creating/editing
#     form_widget_args = {
#         'description': {
#             'rows': 3
#         }
#     }