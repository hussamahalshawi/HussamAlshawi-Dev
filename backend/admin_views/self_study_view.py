from admin_views.admin_view import ProfessionalModelView       # Base view — handles auto profile assignment
from datetime import datetime, timezone                        # Timezone-aware timestamp utilities


class SelfStudyAdminView(ProfessionalModelView):
    """
    Self-Study Management View:
    Tracks books, articles, workshops, and other independent learning activities.
    Profile ownership is automatically assigned via the base class on every save.
    """

    # --- TEMPLATE CONFIGURATION ---
    create_template = 'admin/model/create.html'                # Full-page premium card layout
    edit_template   = 'admin/model/create.html'                # Full-page premium card layout

    create_modal = False                                       # Disable modal — use full page
    edit_modal   = False                                       # Disable modal — use full page

    # --- LIST VIEW DISPLAY ---
    column_list = ('title', 'learning_type', 'platform_name', 'track', 'created_at')

    column_labels = {
        'title'        : 'Resource Title',                    # Human-readable column label
        'learning_type': 'Type',                              # Human-readable column label
        'platform_name': 'Source/Platform',                   # Human-readable column label
        'track'        : 'Learning Track',                    # Human-readable column label
        'created_at'   : 'Recorded On'                        # Human-readable column label
    }

    # --- FORM CONFIGURATION ---
    form_args = {
        'start_date': {'format': '%Y-%m-%d'},                 # Sync with HTML5 native date picker
        'end_date'  : {'format': '%Y-%m-%d'}                  # Sync with HTML5 native date picker
    }

    # 'profile' is intentionally excluded — assigned automatically by the base class
    form_columns = (
        'title',
        'learning_type',
        'platform_name',
        'track',
        'summary',
        'source_url',
        'cover_image',
        'start_date',
        'end_date',
        'skills_learned'                                       # Dynamic skill tags
    )

    # --- LOGIC HOOKS ---
    def on_model_change(self, form, model, is_created):
        """
        Triggered before saving to MongoDB.
        1. Calls super() to auto-assign the profile via the base class.
        2. Refreshes the audit timestamp.

        Args:
            form: The submitted WTForms form instance.
            model: The SelfStudy document being saved.
            is_created (bool): True if this is a new record.
        """
        # Step 1: Run base class logic — auto-assigns profile if not set
        super().on_model_change(form, model, is_created)

        # Step 2: Refresh the audit timestamp
        model.last_updated = datetime.now(timezone.utc)       # Ensure timezone-aware UTC timestamp