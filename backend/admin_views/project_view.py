from flask import request                                      # Access multipart file uploads
from wtforms import MultipleFileField, FileField               # Virtual file upload fields
from admin_views.admin_view import ProfessionalModelView       # Base view — handles auto profile assignment
from App.utils.cloudinary_handler import upload_media_batch    # Cloudinary batch upload utility
from datetime import datetime, timezone                        # Timezone-aware timestamp utilities


class ProjectAdminView(ProfessionalModelView):
    """
    Project Management View:
    Handles portfolio projects with screenshot and video upload support.
    Profile ownership is automatically assigned via the base class on every save.
    """

    # --- TEMPLATE CONFIGURATION ---
    create_template = 'admin/model/create.html'                # Full-page premium card layout
    edit_template   = 'admin/model/create.html'                # Full-page premium card layout

    create_modal = False                                       # Disable modal — use full page
    edit_modal   = False                                       # Disable modal — use full page

    # --- LIST VIEW DISPLAY ---
    column_list = ('project_name', 'project_type', 'category', 'end_date')

    column_labels = {
        'project_name': 'Project Title',                      # Human-readable column label
        'project_type': 'Type',                               # Human-readable column label
        'category'    : 'Track',                              # Human-readable column label
        'end_date'    : 'Finished On'                         # Human-readable column label
    }

    # --- FORM CONFIGURATION ---
    # Virtual upload fields — not stored in DB directly, processed in on_model_change
    form_extra_fields = {
        'image_uploads': MultipleFileField('Upload Project Screenshots'),  # Multiple images
        'video_upload' : FileField('Upload Project Demo Video')            # Single video file
    }

    form_args = {
        'start_date': {'format': '%Y-%m-%d'},                 # Sync with HTML5 native date picker
        'end_date'  : {'format': '%Y-%m-%d'}                  # Sync with HTML5 native date picker
    }

    # 'profile' is intentionally excluded — assigned automatically by the base class
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
        'image_uploads',                                       # Virtual: multi-image uploader
        'video_upload',                                        # Virtual: single video uploader
        'skills_used'
    )

    # --- LOGIC HOOKS ---
    def on_model_change(self, form, model, is_created):
        """
        Triggered before saving to MongoDB.
        1. Calls super() to auto-assign the profile via the base class.
        2. Uploads screenshot images to Cloudinary and appends URLs to project_images.
        3. Uploads demo video to Cloudinary and stores the URL in project_video.
        4. Refreshes the audit timestamp.

        Args:
            form: The submitted WTForms form instance.
            model: The Project document being saved.
            is_created (bool): True if this is a new record.
        """
        # Step 1: Run base class logic — auto-assigns profile if not set
        super().on_model_change(form, model, is_created)

        # Step 2: Handle multiple screenshot image uploads
        img_files    = request.files.getlist('image_uploads')             # Get all uploaded image files
        valid_images = [f for f in img_files if f and f.filename != '']   # Filter out empty inputs

        if valid_images:
            # Upload images to Cloudinary under 'Projects/screenshots'
            img_urls = upload_media_batch(
                valid_images,
                folder_name='Projects',                        # Cloudinary folder name
                sub_folder='screenshots'                       # Sub-folder for project screenshots
            )

            if img_urls:
                if not model.project_images:
                    model.project_images = img_urls            # Initialize the list on first upload
                else:
                    model.project_images.extend(img_urls)      # Append new screenshots to existing list

        # Step 3: Handle single demo video upload
        video_file = request.files.get('video_upload')         # Get the single video file

        if video_file and video_file.filename != '':
            # Upload video to Cloudinary under 'Projects/videos'
            video_urls = upload_media_batch(
                [video_file],
                folder_name='Projects',                        # Cloudinary folder name
                sub_folder='videos'                            # Sub-folder for project videos
            )

            if video_urls:
                model.project_video = video_urls[0]            # Store the single returned video URL

        # Step 4: Refresh the audit timestamp
        model.last_updated = datetime.now(timezone.utc)       # Ensure timezone-aware UTC timestamp