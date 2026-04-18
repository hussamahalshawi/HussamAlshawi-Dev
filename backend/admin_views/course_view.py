from flask import request  # Handle web requests
from admin_views.admin_view import ProfessionalModelView  # Base UI configuration
from datetime import datetime, timezone  # Standard utilities for time management


class CourseAdminView(ProfessionalModelView):
    """
    Course Management View:
    Handles educational certifications and professional development records.
    Simplified version without image upload functionality.
    """

    # --- TEMPLATE CONFIGURATION ---
    create_template = 'admin/model/create.html'  # Premium form layout
    edit_template = 'admin/model/create.html'  # Premium form layout

    create_modal = False  # Use full page for creation
    edit_modal = False  # Use full page for editing

    # --- LIST VIEW DISPLAY ---
    column_list = ('course_name', 'organization', 'category', 'end_date')

    column_labels = {
        'course_name': 'Course Title',  # UI label for course name
        'organization': 'Provider',  # UI label for organization
        'category': 'Track',  # UI label for category
        'end_date': 'Completed On'  # UI label for completion date
    }

    # --- FORM CONFIGURATION ---
    form_args = {
        'start_date': {'format': '%Y-%m-%d'},  # Sync with HTML5 date picker
        'end_date': {'format': '%Y-%m-%d'}  # Sync with HTML5 date picker
    }

    # English Comment: Clean sequence of fields without file upload triggers
    form_columns = (
        'course_name',
        'organization',
        'category',
        'project_summary',
        'credential_url',  # Manual URL entry for certificates
        'start_date',
        'end_date',
        'acquired_skills'  # Dynamic list for skills
    )

    def on_model_change(self, form, model, is_created):
        """
        English Comment: Triggered before saving to database.
        Maintains data integrity and updates audit timestamps.
        """

        # English Comment: Ensure the last_updated field is refreshed on every save
        model.last_updated = datetime.now(timezone.utc)  # Update synchronization timestamp