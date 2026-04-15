# backend/admin_views/my_media_view.py

try:
    from markupsafe import Markup
except ImportError:
    from jinja2 import Markup

from flask import request
from wtforms import MultipleFileField
from admin_views.admin_view import ProfessionalModelView
from App.utils.cloudinary_handler import upload_media_batch


class MediaVaultAdminView(ProfessionalModelView):
    """
    Highly Professional Media Gallery View with Grid Layout and Custom Actions.
    Inherits from ProfessionalModelView for global styling.
    """

    # --- 1. Dashboard Layout & Template Settings ---
    # English Comment: Use the custom Google Drive-like HTML template
    list_template = 'admin/media_drive.html'
    create_template = 'admin/model/create.html'
    edit_template = 'admin/model/create.html'

    # English Comment: Define columns for search and filters
    column_list = ('vault_name', 'content_type', 'media_preview', 'last_updated')
    column_searchable_list = ('vault_name', 'description')
    column_filters = ('content_type', 'last_updated')

    # --- CRITICAL FIX START ---
    # English Comment: Disable Modals to allow the professional custom Edit/Create pages to load.
    # Modals in Flask-Admin often conflict with custom JS dropdowns and SPA navigation.
    create_modal = False
    edit_modal = False
    # --- CRITICAL FIX END ---

    can_view_details = True
    details_modal = True

    # --- 2. Media Upload Handling ---
    form_extra_fields = {
        'file_upload': MultipleFileField('Upload New Assets (Images/Videos)')
    }

    def on_model_change(self, form, model, is_created):
        """
        English Comment: Triggered before saving to DB.
        Ensures existing media_links are preserved when new assets are uploaded.
        """
        # 1. Get the uploaded files from the request
        files = request.files.getlist('file_upload')
        valid_files = [f for f in files if f.filename != '']

        # 2. Critical Fix: If this is an update, preserve the current links
        # English Comment: We ensure the list exists and contains current data before appending.
        if not model.media_links:
            model.media_links = []

        # 3. Handle the bulk upload to Cloudinary
        if valid_files:
            new_urls = upload_media_batch(
                valid_files,
                folder_name=model.vault_name,
                sub_folder="my_media"
            )

            # 4. English Comment: Use extend to append new items without overwriting the old list
            model.media_links.extend(new_urls)

        # 5. English Comment: Direct assignment to ensure the session tracks the change (especially for MongoDB/SQLAlchemy)
        # This forces the session to realize the list has been modified.
        model.media_links = list(model.media_links)

    # --- 3. UI Formatters & Previews ---
    def _media_preview(view, context, model, name):
        """
        English Comment: Generates a visual thumbnail with a badge showing file count.
        """
        if not model.media_links:
            return Markup('<span class="badge badge-secondary">No Media</span>')

        first_url = model.media_links[0]
        asset_count = len(model.media_links)
        is_video = any(ext in first_url.lower() for ext in ['.mp4', '.mov', '.avi', '.wmv'])

        if is_video:
            html = f'''
                <div style="position: relative; width: 80px;">
                    <video width="80" style="border-radius: 4px; border: 2px solid #17a2b8;">
                        <source src="{first_url}" type="video/mp4">
                    </video>
                    <span class="badge badge-info" style="position: absolute; bottom: 0; right: 0;">{asset_count} Vid</span>
                </div>
            '''
        else:
            html = f'''
                <div style="position: relative; width: 80px; display: inline-block;">
                    <img src="{first_url}" width="80" height="60" 
                         style="border-radius: 8px; border: 2px solid #ddd; object-fit: cover; box-shadow: 2px 2px 5px rgba(0,0,0,0.1);">
                    <span class="badge badge-primary" style="position: absolute; top: -5px; right: -5px; border-radius: 50%;">{asset_count}</span>
                </div>
            '''
        return Markup(html)

    column_formatters = {
        'media_preview': _media_preview
    }

    # --- 4. Internationalization & Labels ---
    column_labels = {
        'vault_name': 'Collection Name',
        'media_preview': 'Gallery Preview',
        'content_type': 'Type',
        'last_updated': 'Modified At',
        'file_upload': 'Select Assets'
    }

    column_default_sort = ('last_updated', True)