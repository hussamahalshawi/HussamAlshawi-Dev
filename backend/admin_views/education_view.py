from flask import request                                      # Access multipart file uploads
from wtforms import MultipleFileField, FileField               # Virtual file upload fields
from admin_views.admin_view import ProfessionalModelView       # Base view — handles auto profile assignment
from App.utils.cloudinary_handler import upload_media_batch    # Cloudinary batch upload utility
from App.services.profile_service import ProfileService        # Recalculate experience metrics after save
import logging                                                 # Error tracking


class EducationAdminView(ProfessionalModelView):
    """
    Education Management View:
    Handles academic milestones with certificate image and video upload support.
    Profile ownership is automatically assigned via the base class on every save.
    After saving, profile metrics are refreshed to reflect the new education entry.
    Supports media uploads: certificate images (multi) and a graduation/campus video (single).
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

    # --- FORM CONFIGURATION ---
    # Virtual upload fields — not stored in DB directly, processed in on_model_change
    form_extra_fields = {
        'certificate_upload': MultipleFileField('Upload Certificates or Campus Photos'),  # Multi-image
        'video_upload'      : FileField('Upload Graduation or Campus Tour Video')         # Single video
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
        'certificate_upload',                                  # Virtual: multi-image certificate uploader
        'video_upload',                                        # Virtual: single graduation/campus video
        'skills_learned'
    )

    # --- UI INTERACTION ---
    column_searchable_list = ['institution', 'degree', 'major']  # Enable quick text search
    column_filters         = ['start_date', 'end_date']          # Enable date range filtering

    # --- LOGIC HOOKS ---
    def on_model_change(self, form, model, is_created):
        """
        Triggered before saving to MongoDB.
        1. Calls super() to auto-assign the profile via the base class.
        2. Uploads certificate/photo images to Cloudinary and stores returned URLs.
        3. Uploads graduation/campus video to Cloudinary and stores URL in education_video.

        Args:
            form: The submitted WTForms form instance.
            model: The Education document being saved.
            is_created (bool): True if this is a new record.
        """
        # Step 1: Run base class logic — auto-assigns profile if not set
        super().on_model_change(form, model, is_created)

        # Step 2: Retrieve and filter uploaded certificate/photo files from the request
        files       = request.files.getlist('certificate_upload')          # Get all uploaded files
        valid_files = [f for f in files if f and f.filename != '']         # Filter out empty inputs

        if valid_files:
            # Step 3: Upload valid files to Cloudinary under 'certificates/Academic'
            cert_urls = upload_media_batch(
                valid_files,
                folder_name='Academic',                        # Cloudinary folder: hussam_Dev/certificates/Academic
                sub_folder='certificates'                      # Sub-folder for academic certificates
            )

            if cert_urls:
                # Step 4: Persist the returned Cloudinary URLs into the certificates list field
                model.certificates = cert_urls                 # Store all uploaded certificate URLs

        # Step 5: Handle single graduation/campus video upload
        video_file = request.files.get('video_upload')         # Get the single video file

        if video_file and video_file.filename != '':
            # Upload video to Cloudinary under 'Education/videos'
            video_urls = upload_media_batch(
                [video_file],
                folder_name='Education',                       # Cloudinary folder name
                sub_folder='videos'                            # Sub-folder for education videos
            )

            if video_urls:
                model.education_video = video_urls[0]          # Store the single returned video URL

    def after_model_change(self, form, model, is_created):
        """
        Triggered after the education record is successfully saved to MongoDB.
        Refreshes profile metrics so experience_years reflects the new entry immediately.

        Args:
            form: The submitted WTForms form instance.
            model: The saved Education document.
            is_created (bool): True if this was a new record.
        """
        try:
            from App.models.profile import Profile             # Local import — avoids circular dependency
            profile = Profile.objects.first()                  # Fetch the active portfolio profile

            if profile:
                ProfileService.calculate_metrics(profile.id)  # Recalculate experience_years + overall_score

        except Exception as e:
            logging.error(f"EducationAdminView.after_model_change: metrics refresh failed — {str(e)}")