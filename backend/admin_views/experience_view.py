from flask import request                                      # Access multipart file uploads
from wtforms import MultipleFileField, FileField               # Virtual file upload fields
from admin_views.admin_view import ProfessionalModelView       # Base view — handles auto profile assignment
from App.utils.cloudinary_handler import upload_media_batch    # Cloudinary batch upload utility
from datetime import datetime, timezone                        # Timezone-aware timestamp utilities


class ExperienceAdminView(ProfessionalModelView):
    """
    Experience Management View:
    Handles career history entries and enforces timeline logic for active roles.
    Profile ownership is automatically assigned via the base class on every save.
    Supports media uploads: workplace/team photos (multi) and a video testimonial (single).
    Upload pattern mirrors ProjectAdminView for architectural consistency.
    """

    # --- TEMPLATE CONFIGURATION ---
    create_template = 'admin/model/create.html'                # Full-page premium card layout
    edit_template   = 'admin/model/create.html'                # Full-page premium card layout

    create_modal = False                                       # Disable modal — use full page
    edit_modal   = False                                       # Disable modal — use full page

    # --- LIST VIEW DISPLAY ---
    column_list = ('job_title', 'company_name', 'employment_type', 'is_current', 'start_date')

    column_labels = {
        'job_title'      : 'Position',                        # Human-readable column label
        'company_name'   : 'Company',                         # Human-readable column label
        'employment_type': 'Type',                            # Human-readable column label
        'is_current'     : 'Active Role',                     # Human-readable column label
        'start_date'     : 'Joined On'                        # Human-readable column label
    }

    # --- FORM CONFIGURATION ---
    # Virtual upload fields — not stored in DB directly, processed in on_model_change
    form_extra_fields = {
        'image_uploads': MultipleFileField('Upload Workplace or Team Photos'),  # Multi-image
        'video_upload' : FileField('Upload Video Testimonial or Role Walkthrough')  # Single video
    }

    form_args = {
        'start_date': {'format': '%Y-%m-%d'},                 # Sync with HTML5 native date picker
        'end_date'  : {'format': '%Y-%m-%d'}                  # Sync with HTML5 native date picker
    }

    # 'profile' is intentionally excluded — assigned automatically by the base class
    form_columns = (
        'job_title',
        'company_name',
        'employment_type',
        'location',
        'company_url',
        'description',
        'is_current',
        'start_date',
        'end_date',
        'image_uploads',                                       # Virtual: multi-image uploader
        'video_upload',                                        # Virtual: single video uploader
        'skills_acquired'
    )

    # --- UI INTERACTION ---
    column_searchable_list = ['job_title', 'company_name']    # Enable quick text search
    column_filters         = ['employment_type', 'is_current', 'start_date']  # Enable filtering

    # --- LOGIC HOOKS ---
    def on_model_change(self, form, model, is_created):
        """
        Triggered before saving to MongoDB.
        1. Calls super() to auto-assign the profile via the base class.
        2. Clears end_date if the role is marked as current (business rule).
        3. Uploads workplace/team photos to Cloudinary and appends to experience_images.
        4. Uploads video testimonial to Cloudinary and stores URL in experience_video.
        5. Refreshes the audit timestamp.

        Args:
            form: The submitted WTForms form instance.
            model: The Experience document being saved.
            is_created (bool): True if this is a new record.
        """
        # Step 1: Run base class logic — auto-assigns profile if not set
        super().on_model_change(form, model, is_created)

        # Step 2: Business rule — active roles must not have an end date
        if model.is_current:
            model.end_date = None                              # Clear end date for active employment

        # Step 3: Handle multiple workplace/team photo uploads
        img_files    = request.files.getlist('image_uploads')             # Get all uploaded image files
        valid_images = [f for f in img_files if f and f.filename != '']   # Filter out empty inputs

        if valid_images:
            # Upload images to Cloudinary under 'Experience/photos'
            img_urls = upload_media_batch(
                valid_images,
                folder_name='Experience',                      # Cloudinary folder name
                sub_folder='photos'                            # Sub-folder for experience photos
            )

            if img_urls:
                if not model.experience_images:
                    model.experience_images = img_urls         # Initialize list on first upload
                else:
                    model.experience_images.extend(img_urls)   # Append new photos to existing list

        # Step 4: Handle single video testimonial upload
        video_file = request.files.get('video_upload')         # Get the single video file

        if video_file and video_file.filename != '':
            # Upload video to Cloudinary under 'Experience/videos'
            video_urls = upload_media_batch(
                [video_file],
                folder_name='Experience',                      # Cloudinary folder name
                sub_folder='videos'                            # Sub-folder for experience videos
            )

            if video_urls:
                model.experience_video = video_urls[0]         # Store the single returned video URL

        # Step 5: Refresh the audit timestamp
        model.last_updated = datetime.now(timezone.utc)        # Ensure timezone-aware UTC timestamp