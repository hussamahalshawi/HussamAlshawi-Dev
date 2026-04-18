from admin_views.admin_view import ProfessionalModelView  # Base UI configuration
from datetime import datetime, timezone  # Time utilities


class SelfStudyAdminView(ProfessionalModelView):
    """
    Self-Study Management View:
    Centralizes the tracking of books, courses, and articles with dynamic skill tagging.
    """

    # --- TEMPLATE CONFIGURATION ---
    create_template = 'admin/model/create.html'  # Using premium card-based layout
    edit_template = 'admin/model/create.html'

    create_modal = False  # Force full-page for complex lists
    edit_modal = False  # Force full-page for complex lists

    # --- LIST VIEW DISPLAY ---
    column_list = ('title', 'learning_type', 'platform_name', 'track', 'created_at')

    column_labels = {
        'title': 'Resource Title',
        'learning_type': 'Type',
        'platform_name': 'Source/Platform',
        'track': 'Learning Track',
        'created_at': 'Recorded On'
    }

    # --- FORM CONFIGURATION ---
    form_args = {
        'start_date': {'format': '%Y-%m-%d'},  # Sync with HTML5 date picker
        'end_date': {'format': '%Y-%m-%d'}
    }

    # English Comment: Logic sequence - Identity -> Type -> Timeline -> Skills
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
        'skills_learned'  # Card-based skill input
    )

    def on_model_change(self, form, model, is_created):
        """
        English Comment: Update metadata on every save operation.
        """
        model.last_updated = datetime.now(timezone.utc)  # Refresh sync timestamp