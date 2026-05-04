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
    Displays saved media in edit mode via Gallery Viewer injected through edit_form().
    Profile ownership is automatically assigned via the base class on every save.
    After saving, profile metrics are refreshed to reflect the new education entry.
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
        'institution', 'degree', 'major', 'grade', 'description',
        'start_date', 'end_date',
        'photos_upload',                                       # Virtual: multi-image  → education_photos
        'video_upload',                                        # Virtual: single video → education_video
        'cert_image_upload',                                   # Virtual: single cert  → certificate_image
        'skills_learned'
    )

    # --- UI INTERACTION ---
    column_searchable_list = ['institution', 'degree', 'major']  # Enable quick text search
    column_filters         = ['start_date', 'end_date']          # Enable date range filtering

    # ── Inject saved media into the form before the edit template renders ─────
    def edit_form(self, obj=None):
        """
        Overrides the default edit_form factory.
        Loads saved media URLs from the Education document and attaches them
        to the form as _media_galleries so the Gallery Viewer in the template
        can display them with per-image delete buttons.

        Args:
            obj: The Education document being edited.

        Returns:
            WTForms form instance with _media_galleries attribute attached.
        """
        form = super().edit_form(obj)                          # Build the standard form first

        galleries = []                                         # Empty list to hold all gallery configs

        # education_photos — multiple campus photos or certificate scans
        if obj and obj.education_photos:
            galleries.append({
                'field_name': 'education_photos',             # Model field name — used in hidden input name
                'label'     : 'Campus Photos & Certificate Scans', # UI section label
                'urls'      : list(obj.education_photos),     # Real URLs from MongoDB
            })

        # education_video — single graduation or campus tour video
        if obj and obj.education_video:
            galleries.append({
                'field_name': 'education_video',              # Model field name
                'label'     : 'Graduation / Campus Video',    # UI section label
                'urls'      : [obj.education_video],          # Wrapped in list for uniform template handling
            })

        # certificate_image — single primary official degree scan
        if obj and obj.certificate_image:
            galleries.append({
                'field_name': 'certificate_image',            # Model field name
                'label'     : 'Official Degree Scan',         # UI section label
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
            2. education_photos     — apply deletions from Gallery Viewer, then append new uploads.
            3. education_video      — apply deletion from Gallery Viewer, then upload new if provided.
            4. certificate_image    — apply deletion from Gallery Viewer, then upload new if provided.

        Args:
            form      : The submitted WTForms form instance.
            model     : The Education document being saved.
            is_created: True if this is a new record.
        """
        # Step 1: Base class — auto-assigns profile if not set
        super().on_model_change(form, model, is_created)

        # ── BLOCK A: education_photos — multiple campus photos / certificate scans ──
        keep_photos = request.form.get('_keep_education_photos', None)  # Read kept URLs from hidden input

        if keep_photos is not None:                            # None means create mode — skip deletion logic
            # User opened Edit — apply their deletion choices
            model.education_photos = (
                [u.strip() for u in keep_photos.split(',') if u.strip()]
                if keep_photos.strip() else []                 # Empty string = all photos deleted
            )

        # Upload new campus photos and append to the surviving list
        files       = request.files.getlist('photos_upload')              # Get all uploaded photo files
        valid_files = [f for f in files if f and f.filename != '']        # Filter out empty inputs

        if valid_files:
            photo_urls = upload_media_batch(
                valid_files,
                folder_name='Education',                       # Cloudinary folder: hussam_Dev/photos/Education
                sub_folder='photos'
            )
            if photo_urls:
                if not model.education_photos:
                    model.education_photos = photo_urls        # Initialize list on first upload
                else:
                    model.education_photos.extend(photo_urls)  # Append — never overwrite survivors

        # ── BLOCK B: education_video — single graduation video slot ───────────
        keep_video = request.form.get('_keep_education_video', None)  # Read kept URL from hidden input

        if keep_video is not None:                             # None means create mode — skip deletion logic
            # Take the first URL if kept, otherwise clear the field
            model.education_video = (
                keep_video.strip().split(',')[0].strip()
                if keep_video.strip() else None                # Empty = user deleted the video
            )

        video_file = request.files.get('video_upload')         # Get the single video file
        if video_file and video_file.filename != '':
            video_urls = upload_media_batch(
                [video_file],
                folder_name='Education',                       # Cloudinary folder: hussam_Dev/videos/Education
                sub_folder='videos'
            )
            if video_urls:
                model.education_video = video_urls[0]          # Single slot — always latest upload

        # ── BLOCK C: certificate_image — single official degree scan slot ─────
        keep_cert = request.form.get('_keep_certificate_image', None)  # Read kept URL from hidden input

        if keep_cert is not None:                              # None means create mode — skip deletion logic
            # Take the first URL if kept, otherwise clear the field
            model.certificate_image = (
                keep_cert.strip().split(',')[0].strip()
                if keep_cert.strip() else None                 # Empty = user deleted the certificate
            )

        cert_img_file = request.files.get('cert_image_upload') # Get the single degree scan file
        if cert_img_file and cert_img_file.filename != '':
            cert_img_urls = upload_media_batch(
                [cert_img_file],
                folder_name='Education',                       # Cloudinary folder: hussam_Dev/certificates/Education
                sub_folder='certificates'
            )
            if cert_img_urls:
                model.certificate_image = cert_img_urls[0]     # Single slot — always latest upload

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