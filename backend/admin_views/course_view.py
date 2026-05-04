from flask import request                                      # Access multipart file uploads
from wtforms import MultipleFileField, FileField               # Virtual file upload fields
from admin_views.admin_view import ProfessionalModelView       # Base view — handles auto profile assignment
from App.utils.cloudinary_handler import upload_media_batch    # Cloudinary batch upload utility
from datetime import datetime, timezone                        # Timezone-aware timestamp utilities


class CourseAdminView(ProfessionalModelView):
    """
    Course Management View:
    Handles professional certifications and educational records with full media upload support.
    Displays saved media in edit mode via Gallery Viewer injected through edit_form().
    Profile ownership is automatically assigned via the base class on every save.
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
        'course_name', 'organization', 'category',
        'project_summary', 'credential_url',
        'start_date', 'end_date',
        'image_uploads',                                       # Virtual: multi-image uploader → course_images
        'video_upload',                                        # Virtual: single video uploader → course_video
        'certificate_upload',                                  # Virtual: single cert uploader → certificate_image
        'acquired_skills'
    )

    # --- UI INTERACTION ---
    column_searchable_list = ['course_name', 'organization']  # Enable quick text search
    column_filters         = ['category', 'end_date']         # Enable filtering by track and date

    # ── Inject saved media into the form before the edit template renders ─────
    def edit_form(self, obj=None):
        """
        Overrides the default edit_form factory.
        Loads saved media URLs from the Course document and attaches them
        to the form as _media_galleries so the Gallery Viewer in the template
        can display them with per-image delete buttons.

        Args:
            obj: The Course document being edited.

        Returns:
            WTForms form instance with _media_galleries attribute attached.
        """
        form = super().edit_form(obj)                          # Build the standard form first

        galleries = []                                         # Empty list to hold all gallery configs

        # course_images — multiple screenshots or cover photos
        if obj and obj.course_images:
            galleries.append({
                'field_name': 'course_images',                # Model field name — used in hidden input name
                'label'     : 'Course Screenshots & Cover Photos', # UI section label
                'urls'      : list(obj.course_images),        # Real URLs from MongoDB
            })

        # course_video — single promo or demo video
        if obj and obj.course_video:
            galleries.append({
                'field_name': 'course_video',                 # Model field name
                'label'     : 'Course Promo / Demo Video',    # UI section label
                'urls'      : [obj.course_video],             # Wrapped in list for uniform template handling
            })

        # certificate_image — single certificate scan or badge image
        if obj and obj.certificate_image:
            galleries.append({
                'field_name': 'certificate_image',            # Model field name
                'label'     : 'Certificate / Badge Image',    # UI section label
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
            2. course_images        — apply deletions from Gallery Viewer, then append new uploads.
            3. course_video         — apply deletion from Gallery Viewer, then upload new if provided.
            4. certificate_image    — apply deletion from Gallery Viewer, then upload new if provided.
            5. last_updated         — refresh audit timestamp.

        Args:
            form      : The submitted WTForms form instance.
            model     : The Course document being saved.
            is_created: True if this is a new record.
        """
        # Step 1: Base class — auto-assigns profile if not set
        super().on_model_change(form, model, is_created)

        # ── BLOCK A: course_images — multiple screenshots / cover photos ──────
        keep_images = request.form.get('_keep_course_images', None)    # Read kept URLs from hidden input

        if keep_images is not None:                            # None means create mode — skip deletion logic
            # User opened Edit — apply their deletion choices
            model.course_images = (
                [u.strip() for u in keep_images.split(',') if u.strip()]
                if keep_images.strip() else []                 # Empty string = all images deleted
            )

        # Upload new screenshots and append to the surviving list
        img_files    = request.files.getlist('image_uploads')             # Get all uploaded image files
        valid_images = [f for f in img_files if f and f.filename != '']   # Filter out empty inputs

        if valid_images:
            img_urls = upload_media_batch(
                valid_images,
                folder_name='Courses',                         # Cloudinary folder: hussam_Dev/screenshots/Courses
                sub_folder='screenshots'
            )
            if img_urls:
                if not model.course_images:
                    model.course_images = img_urls             # Initialize list on first upload
                else:
                    model.course_images.extend(img_urls)       # Append — never overwrite survivors

        # ── BLOCK B: course_video — single promo / demo video slot ────────────
        keep_video = request.form.get('_keep_course_video', None)      # Read kept URL from hidden input

        if keep_video is not None:                             # None means create mode — skip deletion logic
            # Take the first URL if kept, otherwise clear the field
            model.course_video = (
                keep_video.strip().split(',')[0].strip()
                if keep_video.strip() else None                # Empty = user deleted the video
            )

        video_file = request.files.get('video_upload')         # Get the single video file
        if video_file and video_file.filename != '':
            video_urls = upload_media_batch(
                [video_file],
                folder_name='Courses',                         # Cloudinary folder: hussam_Dev/videos/Courses
                sub_folder='videos'
            )
            if video_urls:
                model.course_video = video_urls[0]             # Single slot — always latest upload

        # ── BLOCK C: certificate_image — single certificate / badge slot ──────
        keep_cert = request.form.get('_keep_certificate_image', None)  # Read kept URL from hidden input

        if keep_cert is not None:                              # None means create mode — skip deletion logic
            # Take the first URL if kept, otherwise clear the field
            model.certificate_image = (
                keep_cert.strip().split(',')[0].strip()
                if keep_cert.strip() else None                 # Empty = user deleted the certificate
            )

        cert_file = request.files.get('certificate_upload')   # Get the single certificate file
        if cert_file and cert_file.filename != '':
            cert_urls = upload_media_batch(
                [cert_file],
                folder_name='Courses',                         # Cloudinary folder: hussam_Dev/certificates/Courses
                sub_folder='certificates'
            )
            if cert_urls:
                model.certificate_image = cert_urls[0]         # Single slot — always latest upload

        # Step 5: Refresh audit timestamp
        model.last_updated = datetime.now(timezone.utc)        # Timezone-aware UTC timestamp