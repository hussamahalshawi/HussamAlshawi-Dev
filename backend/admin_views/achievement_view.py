from flask import request                                      # Access multipart file uploads
from wtforms import MultipleFileField, FileField               # Virtual file upload fields
from admin_views.admin_view import ProfessionalModelView       # Base view — handles auto profile assignment
from App.utils.cloudinary_handler import upload_media_batch    # Cloudinary batch upload utility
from datetime import datetime, timezone                        # Timezone-aware timestamp utilities


class AchievementAdminView(ProfessionalModelView):
    """
    Achievement Management View:
    Handles professional recognitions and milestones with full media upload support.
    Displays saved media in edit mode via Gallery Viewer injected through edit_form().
    Profile ownership is automatically assigned via the base class on every save.
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

    # ── Inject saved media into the form before the edit template renders ─────
    def edit_form(self, obj=None):
        """
        Overrides the default edit_form factory.
        Loads saved media URLs from the Achievement document and attaches them
        to the form as _media_galleries so the Gallery Viewer in the template
        can display them with per-image delete buttons.

        Args:
            obj: The Achievement document being edited.

        Returns:
            WTForms form instance with _media_galleries attribute attached.
        """
        form = super().edit_form(obj)                          # Build the standard form first

        galleries = []                                         # Empty list to hold all gallery configs

        # evidence_photos — multiple evidence photos or PDF certificates
        if obj and obj.evidence_photos:
            galleries.append({
                'field_name': 'evidence_photos',              # Model field name — used in hidden input name
                'label'     : 'Evidence Photos & Certificates', # UI section label
                'urls'      : list(obj.evidence_photos),      # Real URLs from MongoDB
            })

        # evidence_video — single video walkthrough or acceptance speech
        if obj and obj.evidence_video:
            galleries.append({
                'field_name': 'evidence_video',               # Model field name
                'label'     : 'Video Walkthrough',            # UI section label
                'urls'      : [obj.evidence_video],           # Wrapped in list for uniform template handling
            })

        # certificate_image — single official certificate or award scan
        if obj and obj.certificate_image:
            galleries.append({
                'field_name': 'certificate_image',            # Model field name
                'label'     : 'Official Certificate',         # UI section label
                'urls'      : [obj.certificate_image],        # Wrapped in list for uniform template handling
            })

        form._media_galleries = galleries                      # Attach galleries to the form object
        return form                                            # Return enriched form to Flask-Admin

    # --- LOGIC HOOKS ---
    def on_model_change(self, form, model, is_created):
        """
        Triggered before saving to MongoDB.

        Steps:
            1. super()              — auto-assigns profile via base class.
            2. evidence_photos      — apply deletions from Gallery Viewer, then append new uploads.
            3. evidence_video       — apply deletion from Gallery Viewer, then upload new if provided.
            4. certificate_image    — apply deletion from Gallery Viewer, then upload new if provided.
            5. last_updated         — refresh audit timestamp.

        Args:
            form      : The submitted WTForms form instance.
            model     : The Achievement document being saved.
            is_created: True if this is a new record.
        """
        # Step 1: Base class — auto-assigns profile if not set
        super().on_model_change(form, model, is_created)

        # ── BLOCK A: evidence_photos — multiple photos / PDFs ──────────────
        keep_photos = request.form.get('_keep_evidence_photos', None)  # Read kept URLs from hidden input

        if keep_photos is not None:                            # None means create mode — skip deletion logic
            # User opened Edit — apply their deletion choices
            model.evidence_photos = (
                [u.strip() for u in keep_photos.split(',') if u.strip()]
                if keep_photos.strip() else []                 # Empty string = all deleted
            )

        # Upload new evidence files and append to the surviving list
        files       = request.files.getlist('evidence_files')             # Get all uploaded files
        valid_files = [f for f in files if f and f.filename != '']        # Filter out empty inputs

        if valid_files:
            uploaded_urls = upload_media_batch(
                valid_files,
                folder_name='Achievements',                    # Cloudinary folder: hussam_Dev/evidence/Achievements
                sub_folder='evidence'
            )
            if uploaded_urls:
                if not model.evidence_photos:
                    model.evidence_photos = uploaded_urls      # Initialize list on first upload
                else:
                    model.evidence_photos.extend(uploaded_urls) # Append — never overwrite survivors

                # Auto-populate evidence_url with first file if not already set manually
                if not model.evidence_url:
                    model.evidence_url = uploaded_urls[0]      # Quick-access URL for the first file

        # ── BLOCK B: evidence_video — single video slot ────────────────────
        keep_video = request.form.get('_keep_evidence_video', None)  # Read kept URL from hidden input

        if keep_video is not None:                             # None means create mode — skip deletion logic
            # Take the first URL if kept, otherwise clear the field
            model.evidence_video = (
                keep_video.strip().split(',')[0].strip()
                if keep_video.strip() else None               # Empty = user deleted the video
            )

        video_file = request.files.get('video_upload')         # Get the single video file
        if video_file and video_file.filename != '':
            video_urls = upload_media_batch(
                [video_file],
                folder_name='Achievements',                    # Cloudinary folder: hussam_Dev/videos/Achievements
                sub_folder='videos'
            )
            if video_urls:
                model.evidence_video = video_urls[0]           # Single slot — always latest upload

        # ── BLOCK C: certificate_image — single certificate slot ───────────
        keep_cert = request.form.get('_keep_certificate_image', None)  # Read kept URL from hidden input

        if keep_cert is not None:                              # None means create mode — skip deletion logic
            # Take the first URL if kept, otherwise clear the field
            model.certificate_image = (
                keep_cert.strip().split(',')[0].strip()
                if keep_cert.strip() else None                # Empty = user deleted the certificate
            )

        cert_file = request.files.get('certificate_upload')   # Get the single certificate file
        if cert_file and cert_file.filename != '':
            cert_urls = upload_media_batch(
                [cert_file],
                folder_name='Achievements',                    # Cloudinary folder: hussam_Dev/certificates/Achievements
                sub_folder='certificates'
            )
            if cert_urls:
                model.certificate_image = cert_urls[0]         # Single slot — always latest upload

        # Step 5: Refresh audit timestamp
        model.last_updated = datetime.now(timezone.utc)        # Timezone-aware UTC timestamp