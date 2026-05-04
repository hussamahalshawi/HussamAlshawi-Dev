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

    Media upload behavior (all fields are fully independent):
        image_uploads     → appended to course_images list (never overwrites existing)
        video_upload      → overwrites course_video (single slot)
        certificate_upload→ overwrites certificate_image (single slot)

    Coexistence rule:
        All three media fields can coexist. Uploading one does NOT affect the others.
        If only a certificate is uploaded, course_images and course_video remain untouched.
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

    # --- FORM EXTRA FIELDS ---
    # Three separate virtual upload fields — each maps to an independent model field
    form_extra_fields = {
        'image_uploads'     : MultipleFileField('Upload Course Screenshots or Cover Photos'),   # → course_images list
        'video_upload'      : FileField('Upload Course Promo or Demo Video'),                  # → course_video string
        'certificate_upload': FileField('Upload Certificate Scan or Badge Image'),             # → certificate_image string
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
        'image_uploads',                                       # Virtual: multi-image uploader → course_images
        'video_upload',                                        # Virtual: single video uploader  → course_video
        'certificate_upload',                                  # Virtual: single cert uploader  → certificate_image
        'acquired_skills'                                      # Dynamic skill tags
    )

    # --- UI INTERACTION ---
    column_searchable_list = ['course_name', 'organization']  # Enable quick text search
    column_filters         = ['category', 'end_date']         # Enable filtering by track and date

    # --- LOGIC HOOKS ---
    def on_model_change(self, form, model, is_created):
        """
        Triggered before saving to MongoDB.

        Upload steps are fully independent — each block checks its own file input
        and only modifies its own model field. No block reads or clears another field.

        Steps:
            1. super()           — auto-assigns profile via base class.
            2. image_uploads     — append new URLs to course_images (never clear existing).
            3. video_upload      — update course_video if a new file was provided.
            4. certificate_upload— update certificate_image if a new file was provided.
            5. last_updated      — refresh audit timestamp.

        Args:
            form      : The submitted WTForms form instance.
            model     : The Course document being saved.
            is_created: True if this is a new record.
        """
        # Step 1: Base class — auto-assigns profile if not set
        super().on_model_change(form, model, is_created)

        # ── BLOCK A: Multiple course screenshots / cover photos ──────────────
        # Independent: only touches model.course_images, ignores all other fields
        img_files    = request.files.getlist('image_uploads')             # Get all uploaded image files
        valid_images = [f for f in img_files if f and f.filename != '']   # Filter out empty file inputs

        if valid_images:
            img_urls = upload_media_batch(
                valid_images,
                folder_name='Courses',                         # Cloudinary folder: hussam_Dev/screenshots/Courses
                sub_folder='screenshots'
            )
            if img_urls:
                if not model.course_images:
                    model.course_images = img_urls             # Initialize empty list on first upload
                else:
                    model.course_images.extend(img_urls)       # Append — never overwrite existing images

        # ── BLOCK B: Single promo / demo video ──────────────────────────────
        # Independent: only touches model.course_video, ignores course_images and certificate_image
        video_file = request.files.get('video_upload')         # Get the single video file

        if video_file and video_file.filename != '':           # Guard: skip if no file selected
            video_urls = upload_media_batch(
                [video_file],
                folder_name='Courses',                         # Cloudinary folder: hussam_Dev/videos/Courses
                sub_folder='videos'
            )
            if video_urls:
                model.course_video = video_urls[0]             # Single slot — always the latest upload

        # ── BLOCK C: Single certificate scan / badge image ──────────────────
        # Independent: only touches model.certificate_image, ignores course_images and course_video
        cert_file = request.files.get('certificate_upload')    # Get the single certificate file

        if cert_file and cert_file.filename != '':             # Guard: skip if no file selected
            cert_urls = upload_media_batch(
                [cert_file],
                folder_name='Courses',                         # Cloudinary folder: hussam_Dev/certificates/Courses
                sub_folder='certificates'
            )
            if cert_urls:
                model.certificate_image = cert_urls[0]         # Single slot — always the latest upload

        # Step 5: Refresh audit timestamp
        model.last_updated = datetime.now(timezone.utc)        # Timezone-aware UTC timestamp