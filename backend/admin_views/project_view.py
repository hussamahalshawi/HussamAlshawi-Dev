from flask import request  # Handle incoming web requests
from wtforms import MultipleFileField, FileField  # Support for multi-file and single-file uploads
from admin_views.admin_view import ProfessionalModelView  # Base UI configuration
from App.utils.cloudinary_handler import upload_media_batch  # Utility for cloud storage integration
from datetime import datetime, timezone  # Time management utilities


class ProjectAdminView(ProfessionalModelView):
    """
    Project Management View:
    Automates cloud media uploads for project screenshots and demo videos.
    """

    # --- TEMPLATE CONFIGURATION ---
    create_template = 'admin/model/create.html'  # Using the premium card-based layout
    edit_template = 'admin/model/create.html'  # Using the premium card-based layout

    create_modal = False  # Disable modal for full-page design
    edit_modal = False  # Disable modal for full-page design

    # --- LIST VIEW DISPLAY ---
    column_list = ('project_name', 'project_type', 'category', 'end_date')

    column_labels = {
        'project_name': 'Project Title',
        'project_type': 'Type',
        'category': 'Track',
        'end_date': 'Finished On'
    }

    # --- FORM CONFIGURATION (MEDIA UPLOAD FIELDS) ---
    # English Comment: Adding virtual fields for file selection that are not in the DB model
    form_extra_fields = {
        'image_uploads': MultipleFileField('Upload Project Screenshots'),  # For multiple images
        'video_upload': FileField('Upload Project Demo Video')  # For single video file
    }

    form_args = {
        'start_date': {'format': '%Y-%m-%d'},  # Sync with native HTML5 date picker
        'end_date': {'format': '%Y-%m-%d'}
    }

    # English Comment: Organize sequence to handle identity, links, then media uploads
    form_columns = (
        'project_name',
        'project_type',
        'category',
        'github_url',
        'live_url',
        'description',
        'my_role',
        'start_date',
        'end_date',
        'image_uploads',  # File selector for images
        'video_upload',  # File selector for video
        'skills_used'  # Dynamic skill tags
    )

    def on_model_change(self, form, model, is_created):
        """
        English Comment: Captures files from request, uploads them to Cloudinary,
        and synchronizes the returned URLs with the MongoDB document.
        """

        # 1. HANDLE MULTIPLE IMAGES UPLOAD
        # English Comment: Retrieve images from the 'image_uploads' field
        img_files = request.files.getlist('image_uploads')  # Get files from request
        valid_images = [f for f in img_files if f and f.filename != '']  # Filter empty inputs

        if valid_images:
            # English Comment: Upload to Cloudinary under 'Projects/Screenshots'
            img_urls = upload_media_batch(valid_images, folder_name="Projects", sub_folder="screenshots")
            if img_urls:
                # English Comment: Append new URLs to the existing list or create a new one
                if not model.project_images:
                    model.project_images = img_urls  # Initialize if empty
                else:
                    model.project_images.extend(img_urls)  # Extend existing array

        # 2. HANDLE VIDEO UPLOAD
        # English Comment: Retrieve the single video file from 'video_upload'
        video_file = request.files.get('video_upload')  # Get single file

        if video_file and video_file.filename != '':
            # English Comment: Upload to Cloudinary under 'Projects/Videos'
            video_urls = upload_media_batch([video_file], folder_name="Projects", sub_folder="videos")
            if video_urls:
                model.project_video = video_urls[0]  # Store the first (and only) URL

        # 3. UPDATE AUDIT METRICS
        model.last_updated = datetime.now(timezone.utc)  # Refresh modification timestamp