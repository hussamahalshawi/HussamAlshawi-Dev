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

    Media upload behavior (all fields are fully independent):
        image_uploads     → appended to experience_images list (never overwrites existing)
        video_upload      → overwrites experience_video (single slot)
        certificate_upload→ overwrites certificate_image (single slot)

    Coexistence rule:
        All three media fields can coexist. Uploading one does NOT affect the others.
        If only a certificate is uploaded, experience_images and experience_video remain untouched.
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

    # --- FORM EXTRA FIELDS ---
    # Three separate virtual upload fields — each maps to an independent model field
    form_extra_fields = {
        'image_uploads'     : MultipleFileField('Upload Workplace or Team Photos'),            # → experience_images list
        'video_upload'      : FileField('Upload Video Testimonial or Role Walkthrough'),       # → experience_video string
        'certificate_upload': FileField('Upload Employment Letter or Contract Scan'),          # → certificate_image string
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
        'image_uploads',                                       # Virtual: multi-image uploader → experience_images
        'video_upload',                                        # Virtual: single video uploader  → experience_video
        'certificate_upload',                                  # Virtual: single cert uploader  → certificate_image
        'skills_acquired'
    )

    # --- UI INTERACTION ---
    column_searchable_list = ['job_title', 'company_name']    # Enable quick text search
    column_filters         = ['employment_type', 'is_current', 'start_date']  # Enable filtering

    # --- LOGIC HOOKS ---
    def on_model_change(self, form, model, is_created):
        """
        Triggered before saving to MongoDB.

        Upload steps are fully independent — each block checks its own file input
        and only modifies its own model field. No block reads or clears another field.

        Steps:
            1. super()           — auto-assigns profile via base class.
            2. Business rule     — clear end_date if role is marked as current.
            3. image_uploads     — append new URLs to experience_images (never clear existing).
            4. video_upload      — update experience_video if a new file was provided.
            5. certificate_upload— update certificate_image if a new file was provided.
            6. last_updated      — refresh audit timestamp.

        Args:
            form      : The submitted WTForms form instance.
            model     : The Experience document being saved.
            is_created: True if this is a new record.
        """
        # Step 1: Base class — auto-assigns profile if not set
        super().on_model_change(form, model, is_created)

        # Step 2: Business rule — active roles must not have an end date
        if model.is_current:
            model.end_date = None                              # Clear end date for ongoing employment

        # ── BLOCK A: Multiple workplace / team photos ────────────────────────
        # Independent: only touches model.experience_images, ignores all other media fields
        img_files    = request.files.getlist('image_uploads')             # Get all uploaded image files
        valid_images = [f for f in img_files if f and f.filename != '']   # Filter out empty file inputs

        if valid_images:
            img_urls = upload_media_batch(
                valid_images,
                folder_name='Experience',                      # Cloudinary folder: hussam_Dev/photos/Experience
                sub_folder='photos'
            )
            if img_urls:
                if not model.experience_images:
                    model.experience_images = img_urls         # Initialize empty list on first upload
                else:
                    model.experience_images.extend(img_urls)   # Append — never overwrite existing photos

        # ── BLOCK B: Single video testimonial / role walkthrough ─────────────
        # Independent: only touches model.experience_video, ignores experience_images and certificate_image
        video_file = request.files.get('video_upload')         # Get the single video file

        if video_file and video_file.filename != '':           # Guard: skip if no file selected
            video_urls = upload_media_batch(
                [video_file],
                folder_name='Experience',                      # Cloudinary folder: hussam_Dev/videos/Experience
                sub_folder='videos'
            )
            if video_urls:
                model.experience_video = video_urls[0]         # Single slot — always the latest upload

        # ── BLOCK C: Single employment letter / contract scan ────────────────
        # Independent: only touches model.certificate_image, ignores experience_images and experience_video
        cert_file = request.files.get('certificate_upload')    # Get the single certificate file

        if cert_file and cert_file.filename != '':             # Guard: skip if no file selected
            cert_urls = upload_media_batch(
                [cert_file],
                folder_name='Experience',                      # Cloudinary folder: hussam_Dev/certificates/Experience
                sub_folder='certificates'
            )
            if cert_urls:
                model.certificate_image = cert_urls[0]         # Single slot — always the latest upload

        # Step 6: Refresh audit timestamp
        model.last_updated = datetime.now(timezone.utc)        # Timezone-aware UTC timestamp