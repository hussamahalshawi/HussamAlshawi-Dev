from flask import flash, redirect, url_for, request          # Core Flask utilities for web handling
from wtforms import FileField, MultipleFileField              # Form fields for file upload support
from admin_views.admin_view import ProfessionalModelView      # Base view for consistent UI styling
from App.utils.cloudinary_handler import upload_media_batch   # Cloudinary batch upload utility
from App.services.profile_service import ProfileService       # ✅ FIX: Import service directly, not model method


class EducationAdminView(ProfessionalModelView):
    """
    Education Management View:
    Handles academic milestones and integrates with the profile's global experience metrics.
    Supports bulk uploads for certificates or campus photos.
    """

    # --- 1. Template Configuration ---
    create_template = 'admin/model/create.html'               # Custom card-based creation layout
    edit_template = 'admin/model/create.html'                 # Custom card-based editing layout

    create_modal = False                                       # Disable modal for full-page rendering
    edit_modal = False                                         # Disable modal for full-page rendering

    # --- 2. List View Display ---
    column_list = ('institution', 'degree', 'major', 'start_date', 'end_date')  # Visible table columns

    column_labels = {
        'institution': 'Institution Name',                    # Human-readable label for institution field
        'degree': 'Degree Level',                             # Human-readable label for degree field
        'major': 'Field of Study',                            # Human-readable label for major field
        'start_date': 'Started',                              # Human-readable label for start date
        'end_date': 'Graduated/Expected'                      # Human-readable label for end date
    }

    # --- 3. Form Configuration ---
    form_extra_fields = {
        # Virtual upload field — not stored in DB, processed in on_model_change
        'certificate_upload': MultipleFileField('Upload Certificates or Campus Photos')
    }

    form_args = {
        'start_date': {'format': '%Y-%m-%d'},                 # Sync with HTML5 native date picker format
        'end_date': {'format': '%Y-%m-%d'}                    # Sync with HTML5 native date picker format
    }

    form_columns = (
        'institution',                                        # Required: university or school name
        'degree',                                             # Required: degree level
        'major',                                              # Required: field of study
        'grade',                                              # Optional: GPA or grade descriptor
        'description',                                        # Optional: academic summary or thesis
        'start_date',                                         # Required: enrollment date
        'end_date',                                           # Required: graduation or expected date
        'certificate_upload',                                 # Virtual: file uploader for certificates
        'skills_learned'                                      # Dynamic: list of acquired skills
    )

    # --- 4. Logical Hooks ---
    def on_model_change(self, form, model, is_created):
        """
        Triggered before saving the education record to MongoDB.
        Handles certificate uploads and stores returned Cloudinary URLs.
        """

        # Step 1: Retrieve uploaded files from the multipart form request
        files = request.files.getlist('certificate_upload')

        # Step 2: Filter out empty file inputs (browser sends blank entries)
        valid_files = [f for f in files if f and f.filename != '']

        if valid_files:
            # Step 3: Upload valid files to Cloudinary under the 'Education/certificates' path
            cert_urls = upload_media_batch(
                valid_files,
                folder_name="Academic",                       # Cloudinary folder: hussam_Dev/certificates/Academic
                sub_folder="certificates"                     # Sub-folder for academic certificates
            )

            if cert_urls:
                # Step 4: Persist the returned Cloudinary URLs into the certificates list field
                model.certificates = cert_urls

    def after_model_change(self, form, model, is_created):
        """
        Triggered after the education record is successfully saved to MongoDB.
        Refreshes the profile's experience_years and overall_score metrics.
        """
        try:
            # Step 1: Fetch the primary profile document
            from App.models.profile import Profile             # Local import to avoid circular dependency
            profile = Profile.objects.first()                  # Portfolio has one profile document

            if profile:
                # Step 2: ✅ FIX — Call ProfileService directly instead of non-existent model method
                # Old (broken): profile.refresh_metrics()
                # New (correct): delegates to the centralized service layer
                ProfileService.calculate_metrics(profile.id)  # Recalculates experience_years and overall_score

        except Exception as e:
            # Step 3: Log the error without crashing the admin UI
            import logging                                     # Standard library for error tracking
            logging.error(f"Education after_model_change: Metrics refresh failed — {str(e)}")

    # --- 5. UI Interaction ---
    column_searchable_list = ['institution', 'degree', 'major']  # Enable text search in list view
    column_filters = ['start_date', 'end_date']                   # Enable date range filtering in sidebar