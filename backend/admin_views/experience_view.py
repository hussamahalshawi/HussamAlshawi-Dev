from admin_views.admin_view import ProfessionalModelView       # Base view — handles auto profile assignment
from datetime import datetime, timezone                        # Timezone-aware timestamp utilities


class ExperienceAdminView(ProfessionalModelView):
    """
    Experience Management View:
    Handles career history entries and enforces timeline logic for active roles.
    Profile ownership is automatically assigned via the base class on every save.
    """

    # --- TEMPLATE CONFIGURATION ---
    create_template = 'admin/model/create.html'                # Full-page premium card layout
    edit_template   = 'admin/model/create.html'                # Full-page premium card layout

    create_modal = False                                       # Disable modal — use full page
    edit_modal   = False                                       # Disable modal — use full page

    # --- LIST VIEW DISPLAY ---
    column_list = ('job_title', 'company_name', 'employment_type', 'is_current', 'start_date')

    column_labels = {
        'job_title'      : 'Position',                        # Human-readable column label
        'company_name'   : 'Company',                         # Human-readable column label
        'employment_type': 'Type',                            # Human-readable column label
        'is_current'     : 'Active Role',                     # Human-readable column label
        'start_date'     : 'Joined On'                        # Human-readable column label
    }

    # --- FORM CONFIGURATION ---
    form_args = {
        'start_date': {'format': '%Y-%m-%d'},                 # Sync with HTML5 native date picker
        'end_date'  : {'format': '%Y-%m-%d'}                  # Sync with HTML5 native date picker
    }

    # 'profile' is intentionally excluded — assigned automatically by the base class
    form_columns = (
        'job_title',
        'company_name',
        'employment_type',
        'location',
        'company_url',
        'description',
        'is_current',
        'start_date',
        'end_date',
        'skills_acquired'
    )

    # --- LOGIC HOOKS ---
    def on_model_change(self, form, model, is_created):
        """
        Triggered before saving to MongoDB.
        1. Calls super() to auto-assign the profile via the base class.
        2. Clears end_date if the role is marked as current.
        3. Refreshes the audit timestamp.

        Args:
            form: The submitted WTForms form instance.
            model: The Experience document being saved.
            is_created (bool): True if this is a new record.
        """
        # Step 1: Run base class logic — auto-assigns profile if not set
        super().on_model_change(form, model, is_created)

        # Step 2: Business rule — active roles must not have an end date
        if model.is_current:
            model.end_date = None                              # Clear end date for active employment

        # Step 3: Refresh the audit timestamp
        model.last_updated = datetime.now(timezone.utc)       # Ensure timezone-aware UTC timestamp