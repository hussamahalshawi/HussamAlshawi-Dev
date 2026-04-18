from flask import request  # Handle web requests
from wtforms import MultipleFileField  # Support for multi-file uploads
from admin_views.admin_view import ProfessionalModelView  # Base UI configuration
from App.utils.cloudinary_handler import upload_media_batch  # Cloud storage handler


class CourseAdminView(ProfessionalModelView):
    """
    Course Management View:
    Handles educational certifications and synchronizes acquired skills.
    """

    # --- TEMPLATE CONFIGURATION ---
    create_template = 'admin/model/create.html'  # Premium form layout
    edit_template = 'admin/model/create.html'  # Premium form layout

    create_modal = False  # Disable modal to use full page design
    edit_modal = False  # Disable modal to use full page design

    # --- LIST VIEW DISPLAY ---
    column_list = ('course_name', 'organization', 'category', 'end_date')

    column_labels = {
        'course_name': 'Course Title',
        'organization': 'Provider',
        'category': 'Track',
        'end_date': 'Completed On'
    }

    # # --- FORM CONFIGURATION ---
    # # English Comment: Allow uploading certificates directly to Cloudinary
    # form_extra_fields = {
    #     'cert_uploads': MultipleFileField('Upload Certificate Images')
    # }

    form_args = {
        'start_date': {'format': '%Y-%m-%d'},  # Sync with HTML5 date picker
        'end_date': {'format': '%Y-%m-%d'}
    }

    # English Comment: Organized sequence for better User Experience
    form_columns = (
        'course_name', 'organization', 'category',
        'project_summary', 'credential_url',
        'start_date', 'end_date',
        'acquired_skills'
    )

    def on_model_change(self, form, model, is_created):
        """
        English Comment: Triggered before saving. Handles cloud storage for certificates.
        """
        files = request.files.getlist('cert_uploads')  # Retrieve uploaded files
        valid_files = [f for f in files if f and f.filename != '']  # Filter empty inputs

        if valid_files:
            # English Comment: Upload to a specialized 'Education/Courses' directory
            urls = upload_media_batch(valid_files, folder_name="Education", sub_folder="courses")
            if urls and not model.credential_url:
                model.credential_url = urls[0]  # Auto-populate URL if empty

        # Update the audit timestamp
        from datetime import datetime, timezone
        model.last_updated = datetime.now(timezone.utc)