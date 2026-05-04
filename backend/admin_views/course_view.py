from flask import request                                      # Access multipart file uploads
from wtforms import MultipleFileField, FileField               # Virtual file upload fields
from admin_views.admin_view import ProfessionalModelView       # Base view — handles auto profile assignment
from App.utils.cloudinary_handler import upload_media_batch    # Cloudinary batch upload utility
from datetime import datetime, timezone                        # Timezone-aware timestamp utilities


class CourseAdminView(ProfessionalModelView):
    """
    Course Management View:
    Handles professional certifications and educational records.
    Profile ownership is automatically assigned via the base class on every save.
    Supports media uploads: course screenshots/certificates (multi) and a promo video (single).
    Upload pattern mirrors ProjectAdminView for architectural consistency.
    """

    # --- TEMPLATE CONFIGURATION ---
    create_template = 'admin/model/create.html'                # Full-page premium card layout
    edit_template   = 'admin/model/create.html'                # Full-page premium card layout

    create_modal = False                                       # Disable modal — use full page
    edit_modal   = False                                       # Disable modal — use full page

    # --- LIST VIEW DISPLAY ---
    column_list = ('course_name', 'organization', 'category', 'end_date')

    column_labels = {
        'course_name' : 'Course Title',                       # Human-readable column label
        'organization': 'Provider',                           # Human-readable column label
        'category'    : 'Track',                              # Human-readable column label
        'end_date'    : 'Completed On'                        # Human-readable column label
    }

    # --- FORM CONFIGURATION ---
    # Virtual upload fields — not stored in DB directly, processed in on_model_change
    form_extra_fields = {
        'image_uploads': MultipleFileField('Upload Course Screenshots or Certificate Images'),  # Multi-image
        'video_upload' : FileField('Upload Course Promo or Demo Video')                        # Single video
    }

    form_args = {
        'start_date': {'format': '%Y-%m-%d'},                 # Sync with HTML5 native date picker
        'end_date'  : {'format': '%Y-%m-%d'}                  # Sync with HTML5 native date picker
    }

    # 'profile' is intentionally excluded — assigned automatically by the base class
    form_columns = (
        'course_name',
        'organization',
        'category',
        'project_summary',
        'credential_url',                                      # Manual URL entry for the certificate
        'start_date',
        'end_date',
        'image_uploads',                                       # Virtual: multi-image uploader
        'video_upload',                                        # Virtual: single video uploader
        'acquired_skills'                                      # Dynamic skill tags
    )

    # --- UI INTERACTION ---
    column_searchable_list = ['course_name', 'organization']  # Enable quick text search
    column_filters         = ['category', 'end_date']         # Enable filtering by track and date

    # --- LOGIC HOOKS ---
    def on_model_change(self, form, model, is_created):
        """
        Triggered before saving to MongoDB.
        1. Calls super() to auto-assign the profile via the base class.
        2. Uploads course screenshot/certificate images to Cloudinary and appends URLs to course_images.
        3. Uploads promo/demo video to Cloudinary and stores the URL in course_video.
        4. Refreshes the audit timestamp.

        Args:
            form: The submitted WTForms form instance.
            model: The Course document being saved.
            is_created (bool): True if this is a new record.
        """
        # Step 1: Run base class logic — auto-assigns profile if not set
        super().on_model_change(form, model, is_created)

        # Step 2: Handle multiple course image uploads (screenshots, certificate scans)
        img_files    = request.files.getlist('image_uploads')             # Get all uploaded image files
        valid_images = [f for f in img_files if f and f.filename != '']   # Filter out empty inputs

        if valid_images:
            # Upload images to Cloudinary under 'Courses/screenshots'
            img_urls = upload_media_batch(
                valid_images,
                folder_name='Courses',                         # Cloudinary folder name
                sub_folder='screenshots'                       # Sub-folder for course images
            )

            if img_urls:
                if not model.course_images:
                    model.course_images = img_urls             # Initialize list on first upload
                else:
                    model.course_images.extend(img_urls)       # Append new images to existing list

        # Step 3: Handle single promo/demo video upload
        video_file = request.files.get('video_upload')         # Get the single video file

        if video_file and video_file.filename != '':
            # Upload video to Cloudinary under 'Courses/videos'
            video_urls = upload_media_batch(
                [video_file],
                folder_name='Courses',                         # Cloudinary folder name
                sub_folder='videos'                            # Sub-folder for course videos
            )

            if video_urls:
                model.course_video = video_urls[0]             # Store the single returned video URL

        # Step 4: Refresh the audit timestamp
        model.last_updated = datetime.now(timezone.utc)        # Ensure timezone-aware UTC timestamp