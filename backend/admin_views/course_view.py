from admin_views.admin_view import ProfessionalModelView       # Base view — handles auto profile assignment
from datetime import datetime, timezone                        # Timezone-aware timestamp utilities


class CourseAdminView(ProfessionalModelView):
    """
    Course Management View:
    Handles professional certifications and educational records.
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

    # --- FORM CONFIGURATION ---
    form_args = {
        'start_date': {'format': '%Y-%m-%d'},                 # Sync with HTML5 native date picker
        'end_date'  : {'format': '%Y-%m-%d'}                  # Sync with HTML5 native date picker
    }

    # 'profile' is intentionally excluded — assigned automatically by the base class
    form_columns = (
        'course_name',
        'organization',
        'category',
        'project_summary',
        'credential_url',                                      # Manual URL entry for the certificate
        'start_date',
        'end_date',
        'acquired_skills'                                      # Dynamic skill tags
    )

    # --- LOGIC HOOKS ---
    def on_model_change(self, form, model, is_created):
        """
        Triggered before saving to MongoDB.
        1. Calls super() to auto-assign the profile via the base class.
        2. Refreshes the audit timestamp.

        Args:
            form: The submitted WTForms form instance.
            model: The Course document being saved.
            is_created (bool): True if this is a new record.
        """
        # Step 1: Run base class logic — auto-assigns profile if not set
        super().on_model_change(form, model, is_created)

        # Step 2: Refresh the audit timestamp
        model.last_updated = datetime.now(timezone.utc)       # Ensure timezone-aware UTC timestamp