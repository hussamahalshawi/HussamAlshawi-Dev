from flask import request                                      # Access multipart file uploads
from wtforms import MultipleFileField, FileField               # Virtual file upload fields
from admin_views.admin_view import ProfessionalModelView       # Base view — handles auto profile assignment
from App.utils.cloudinary_handler import upload_media_batch    # Cloudinary batch upload utility
from datetime import datetime, timezone                        # Timezone-aware timestamp utilities


class AchievementAdminView(ProfessionalModelView):
    """
    Achievement Management View:
    Handles professional recognitions and milestones with full media upload support.
    Profile ownership is automatically assigned via the base class on every save.

    Media upload behavior (all fields are fully independent):
        evidence_files    → appended to evidence_photos list (never overwrites existing)
        video_upload      → overwrites evidence_video (single slot)
        certificate_upload→ overwrites certificate_image (single slot)

    Coexistence rule:
        All three media fields can coexist. Uploading one does NOT affect the others.
        If only a certificate is uploaded, evidence_photos and evidence_video remain untouched.
    """

    # --- TEMPLATE CONFIGURATION ---
    create_template = 'admin/model/create.html'                # Full-page premium card layout
    edit_template   = 'admin/model/create.html'                # Full-page premium card layout

    create_modal = False                                       # Disable modal — use full page
    edit_modal   = False                                       # Disable modal — use full page

    # --- LIST VIEW DISPLAY ---
    column_list = ('title', 'issuing_organization', 'date_obtained')

    column_labels = {
        'title'               : 'Achievement Title',          # Human-readable column label
        'issuing_organization': 'Issued By',                  # Human-readable column label
        'date_obtained'       : 'Date Received'               # Human-readable column label
    }

    # --- FORM EXTRA FIELDS ---
    # Three separate virtual upload fields — each maps to an independent model field
    form_extra_fields = {
        'evidence_files'    : MultipleFileField('Upload Evidence Photos or PDF Certificates'),  # → evidence_photos list
        'video_upload'      : FileField('Upload Video Walkthrough or Acceptance Speech'),       # → evidence_video string
        'certificate_upload': FileField('Upload Official Certificate or Award Scan'),           # → certificate_image string
    }

    form_args = {
        'date_obtained': {'format': '%Y-%m-%d'}               # Sync with HTML5 native date picker
    }

    # 'profile' is intentionally excluded — assigned automatically by the base class
    form_columns = (
        'title',
        'issuing_organization',
        'description',
        'evidence_url',                                        # Manual URL to online certificate
        'date_obtained',
        'evidence_files',                                      # Virtual: multi-file uploader     → evidence_photos
        'video_upload',                                        # Virtual: single video uploader   → evidence_video
        'certificate_upload',                                  # Virtual: single cert uploader    → certificate_image
        'skills_demonstrated'
    )

    # --- UI INTERACTION ---
    column_searchable_list = ['title', 'issuing_organization']  # Enable quick text search
    column_filters         = ['date_obtained']                  # Enable date range filtering

    # --- LOGIC HOOKS ---
    def on_model_change(self, form, model, is_created):
        """
        Triggered before saving to MongoDB.

        Upload steps are fully independent — each block checks its own file input
        and only modifies its own model field. No block reads or clears another field.

        Steps:
            1. super()           — auto-assigns profile via base class.
            2. evidence_files    — append new URLs to evidence_photos (never clear existing).
                                   Sets evidence_url to first upload if not already set.
            3. video_upload      — update evidence_video if a new file was provided.
            4. certificate_upload— update certificate_image if a new file was provided.
            5. last_updated      — refresh audit timestamp.

        Args:
            form      : The submitted WTForms form instance.
            model     : The Achievement document being saved.
            is_created: True if this is a new record.
        """
        # Step 1: Base class — auto-assigns profile if not set
        super().on_model_change(form, model, is_created)

        # ── BLOCK A: Multiple evidence photos / PDFs ─────────────────────────
        # Independent: only touches model.evidence_photos and model.evidence_url
        # Does NOT affect evidence_video or certificate_image
        files       = request.files.getlist('evidence_files')             # Get all uploaded evidence files
        valid_files = [f for f in files if f and f.filename != '']        # Filter out empty file inputs

        if valid_files:
            uploaded_urls = upload_media_batch(
                valid_files,
                folder_name='Achievements',                    # Cloudinary folder: hussam_Dev/evidence/Achievements
                sub_folder='evidence'
            )
            if uploaded_urls:
                model.evidence_photos = uploaded_urls          # Replace with latest batch of evidence files

                # Set convenience URL to the first file only if not already manually set
                if not model.evidence_url:
                    model.evidence_url = uploaded_urls[0]      # Auto-populate the quick-access link

        # ── BLOCK B: Single video walkthrough / acceptance speech ────────────
        # Independent: only touches model.evidence_video
        # Does NOT affect evidence_photos or certificate_image
        video_file = request.files.get('video_upload')         # Get the single video file

        if video_file and video_file.filename != '':           # Guard: skip if no file selected
            video_urls = upload_media_batch(
                [video_file],
                folder_name='Achievements',                    # Cloudinary folder: hussam_Dev/videos/Achievements
                sub_folder='videos'
            )
            if video_urls:
                model.evidence_video = video_urls[0]           # Single slot — always the latest upload

        # ── BLOCK C: Single official certificate / award scan ────────────────
        # Independent: only touches model.certificate_image
        # Does NOT affect evidence_photos or evidence_video
        cert_file = request.files.get('certificate_upload')    # Get the single certificate file

        if cert_file and cert_file.filename != '':             # Guard: skip if no file selected
            cert_urls = upload_media_batch(
                [cert_file],
                folder_name='Achievements',                    # Cloudinary folder: hussam_Dev/certificates/Achievements
                sub_folder='certificates'
            )
            if cert_urls:
                model.certificate_image = cert_urls[0]         # Single slot — always the latest upload

        # Step 5: Refresh audit timestamp
        model.last_updated = datetime.now(timezone.utc)        # Timezone-aware UTC timestamp