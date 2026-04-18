from flask import flash  # Message flashing for user feedback
from admin_views.admin_view import ProfessionalModelView  # Base UI configuration


class ExperienceAdminView(ProfessionalModelView):
    """
    Experience Management View:
    Handles career history and enforces timeline logic for active roles.
    """

    # --- TEMPLATE CONFIGURATION ---
    create_template = 'admin/model/create.html'  # High-end form layout
    edit_template = 'admin/model/create.html'  # High-end form layout

    create_modal = False  # Disable modal to use full page design
    edit_modal = False  # Disable modal to use full page design

    # --- LIST VIEW DISPLAY ---
    column_list = ('job_title', 'company_name', 'employment_type', 'is_current', 'start_date')

    column_labels = {
        'job_title': 'Position',
        'company_name': 'Company',
        'employment_type': 'Type',
        'is_current': 'Active Role',
        'start_date': 'Joined On'
    }

    # --- FORM CONFIGURATION ---
    form_args = {
        'start_date': {'format': '%Y-%m-%d'},  # Sync with native HTML5 date picker
        'end_date': {'format': '%Y-%m-%d'}
    }

    # English Comment: Grouping related fields for better logical flow
    form_columns = (
        'job_title', 'company_name', 'employment_type',
        'location', 'company_url', 'description',
        'is_current', 'start_date', 'end_date',
        'skills_acquired'
    )

    def on_model_change(self, form, model, is_created):
        """
        English Comment: Business logic to ensure data integrity.
        If 'is_current' is checked, 'end_date' is automatically cleared.
        """
        if model.is_current:
            model.end_date = None  # Clear end date for active jobs

        # English Comment: Refresh the audit timestamp
        from datetime import datetime, timezone
        model.last_updated = datetime.now(timezone.utc)