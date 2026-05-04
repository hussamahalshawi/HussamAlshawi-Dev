from flask import request                                      # Access multipart file uploads
from wtforms import MultipleFileField, FileField               # Virtual file upload fields
from admin_views.admin_view import ProfessionalModelView       # Base view — handles auto profile assignment
from App.utils.cloudinary_handler import upload_media_batch    # Cloudinary batch upload utility
from App.services.profile_service import ProfileService        # Recalculate experience metrics after save
import logging                                                 # Error tracking


class EducationAdminView(ProfessionalModelView):
    """
    Education Management View:
    Handles academic milestones with full media upload support.
    Profile ownership is automatically assigned via the base class on every save.
    After saving, profile metrics are refreshed to reflect the new education entry.

    Media upload behavior (all fields are fully independent):
        photos_upload     → appended to education_photos list (never overwrites existing)
        video_upload      → overwrites education_video (single slot)
        cert_image_upload → overwrites certificate_image (single slot)

    Coexistence rule:
        All three media fields can coexist. Uploading one does NOT affect the others.
        If only a certificate_image is uploaded, education_photos and education_video remain untouched.
    """

    # --- TEMPLATE CONFIGURATION ---
    create_template = 'admin/model/create.html'                # Full-page premium card layout
    edit_template   = 'admin/model/create.html'                # Full-page premium card layout

    create_modal = False                                       # Disable modal — use full page
    edit_modal   = False                                       # Disable modal — use full page

    # --- LIST VIEW DISPLAY ---
    column_list = ('institution', 'degree', 'major', 'start_date', 'end_date')

    column_labels = {
        'institution': 'Institution Name',                    # Human-readable column label
        'degree'     : 'Degree Level',                        # Human-readable column label
        'major'      : 'Field of Study',                      # Human-readable column label
        'start_date' : 'Started',                             # Human-readable column label
        'end_date'   : 'Graduated/Expected'                   # Human-readable column label
    }

    # --- FORM EXTRA FIELDS ---
    # Three separate virtual upload fields — each maps to an independent model field
    form_extra_fields = {
        'photos_upload'     : MultipleFileField('Upload Campus Photos or Certificate Scans'),   # → education_photos list
        'video_upload'      : FileField('Upload Graduation or Campus Tour Video'),              # → education_video string
        'cert_image_upload' : FileField('Upload Primary Degree Scan (Single Official Image)'), # → certificate_image string
    }

    form_args = {
        'start_date': {'format': '%Y-%m-%d'},                 # Sync with HTML5 native date picker
        'end_date'  : {'format': '%Y-%m-%d'}                  # Sync with HTML5 native date picker
    }

    # 'profile' is intentionally excluded — assigned automatically by the base class
    form_columns = (
        'institution',
        'degree',
        'major',
        'grade',
        'description',
        'start_date',
        'end_date',
        'photos_upload',                                       # Virtual: multi-image  → education_photos
        'video_upload',                                        # Virtual: single video → education_video
        'cert_image_upload',                                   # Virtual: single cert  → certificate_image
        'skills_learned'
    )

    # --- UI INTERACTION ---
    column_searchable_list = ['institution', 'degree', 'major']  # Enable quick text search
    column_filters         = ['start_date', 'end_date']          # Enable date range filtering

    # --- LOGIC HOOKS ---
    def on_model_change(self, form, model, is_created):
        """
        Triggered before saving to MongoDB.

        Upload steps are fully independent — each block checks its own file input
        and only modifies its own model field. No block reads or clears another field.

        Steps:
            1. super()           — auto-assigns profile via base class.
            2. photos_upload     — append new URLs to education_photos (never clear existing).
            3. video_upload      — update education_video if a new file was provided.
            4. cert_image_upload — update certificate_image if a new file was provided.

        Args:
            form      : The submitted WTForms form instance.
            model     : The Education document being saved.
            is_created: True if this is a new record.
        """
        # Step 1: Base class — auto-assigns profile if not set
        super().on_model_change(form, model, is_created)

        # ── BLOCK A: Multiple campus photos / certificate scans ──────────────
        # Independent: only touches model.education_photos list
        # Does NOT affect education_video or certificate_image
        files       = request.files.getlist('photos_upload')               # Get all uploaded photo/cert files
        valid_files = [f for f in files if f and f.filename != '']         # Filter out empty file inputs

        if valid_files:
            photo_urls = upload_media_batch(
                valid_files,
                folder_name='Education',                       # Cloudinary folder: hussam_Dev/photos/Education
                sub_folder='photos'
            )
            if photo_urls:
                if not model.education_photos:
                    model.education_photos = photo_urls        # Initialize empty list on first upload
                else:
                    model.education_photos.extend(photo_urls)  # Append — never overwrite existing photos

        # ── BLOCK B: Single graduation / campus tour video ───────────────────
        # Independent: only touches model.education_video
        # Does NOT affect education_photos or certificate_image
        video_file = request.files.get('video_upload')         # Get the single video file

        if video_file and video_file.filename != '':           # Guard: skip if no file selected
            video_urls = upload_media_batch(
                [video_file],
                folder_name='Education',                       # Cloudinary folder: hussam_Dev/videos/Education
                sub_folder='videos'
            )
            if video_urls:
                model.education_video = video_urls[0]          # Single slot — always the latest upload

        # ── BLOCK C: Single primary official degree scan ─────────────────────
        # Independent: only touches model.certificate_image
        # Does NOT affect education_photos or education_video
        cert_img_file = request.files.get('cert_image_upload') # Get the single degree scan file

        if cert_img_file and cert_img_file.filename != '':     # Guard: skip if no file selected
            cert_img_urls = upload_media_batch(
                [cert_img_file],
                folder_name='Education',                       # Cloudinary folder: hussam_Dev/certificates/Education
                sub_folder='certificates'
            )
            if cert_img_urls:
                model.certificate_image = cert_img_urls[0]     # Single slot — always the latest upload

    def after_model_change(self, form, model, is_created):
        """
        Triggered after the education record is successfully saved to MongoDB.
        Refreshes profile metrics so experience_years reflects the new entry immediately.

        Args:
            form      : The submitted WTForms form instance.
            model     : The saved Education document.
            is_created: True if this was a new record.
        """
        try:
            from App.models.profile import Profile             # Local import — avoids circular dependency
            profile = Profile.objects.first()                  # Fetch the active portfolio profile

            if profile:
                ProfileService.calculate_metrics(profile.id)  # Recalculate experience_years + overall_score

        except Exception as e:
            logging.error(f"EducationAdminView.after_model_change: metrics refresh failed — {str(e)}")