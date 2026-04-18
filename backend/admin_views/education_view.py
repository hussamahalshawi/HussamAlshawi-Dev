from flask import flash, redirect, url_for, request
from wtforms import FileField, MultipleFileField
from admin_views.admin_view import ProfessionalModelView
from App.utils.cloudinary_handler import upload_media_batch


class EducationAdminView(ProfessionalModelView):
    """
    Education Management View:
    Handles academic milestones and integrates with the profile's global experience metrics.
    Supports bulk uploads for certificates or campus photos.
    """

    # --- 1. Template Configuration ---
    # English Comment: Use the smart universal template for consistent UI design
    create_template = 'admin/model/create.html'
    edit_template = 'admin/model/create.html'

    create_modal = False
    edit_modal = False

    # --- 2. List View Display ---
    column_list = ('institution', 'degree', 'major', 'start_date', 'end_date')

    column_labels = {
        'institution': 'Institution Name',
        'degree': 'Degree Level',
        'major': 'Field of Study',
        'start_date': 'Started',
        'end_date': 'Graduated/Expected'
    }

    # --- 3. Form Configuration ---
    # English Comment: Extra field to allow uploading degree certificates or relevant images
    form_extra_fields = {
        'certificate_upload': MultipleFileField('Upload Certificates or Campus Photos')
    }
    # English Comment: Ensure the form accepts the date format sent by the HTML5 input
    form_args = {
        'start_date': {'format': '%Y-%m-%d'},
        'end_date': {'format': '%Y-%m-%d'}
    }

    # English Comment: Define field order and exclude technical ID fields
    form_columns = (
        'institution', 'degree', 'major', 'grade',
        'start_date', 'end_date', 'description',
        'certificate_upload', 'skills_learned'
    )

    # --- 4. Logical Hooks ---
    def on_model_change(self, form, model, is_created):
        """
        English Comment: Triggered before saving. Handles bulk certificate uploads
        and updates the 'skills_learned' list if necessary.
        """

        # A. Handle File Uploads (Certificates/Photos)
        # English Comment: Process multiple files and store URLs in the list field
        files = request.files.getlist('certificate_upload')
        valid_files = [f for f in files if f and f.filename != '']

        if valid_files:
            # English Comment: Upload to a dedicated 'Education' folder in Cloudinary
            cert_urls = upload_media_batch(valid_files, folder_name="Academic", sub_folder="certificates")

            if cert_urls:
                model.certificates = cert_urls
                if not model.skills_learned:  # Just as an example, or add a dedicated Field in Model
                    model.skills_learned = []
                # If you decide to add a 'certificates' ListField to Education model later,
                # you would append them there. For now, we handle the upload stream.
                pass

    def after_model_change(self, form, model, is_created):
        """
        English Comment: After saving education, we could trigger a profile metric refresh
        to ensure 'experience_years' is updated immediately.
        """
        try:
            from App.models.profile import Profile
            profile = Profile.objects.first()
            if profile:
                profile.refresh_metrics()
        except Exception as e:
            # English Comment: Log the error but don't crash the UI
            print(f"Metrics Refresh Failed: {str(e)}")

    # --- 5. UI Elements ---
    # English Comment: Add search functionality for quick filtering
    column_searchable_list = ['institution', 'degree', 'major']
    column_filters = ['start_date', 'end_date']