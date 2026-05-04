from admin_views.admin_view import ProfessionalModelView       # Base view — handles auto profile assignment
from datetime import datetime, timezone                        # Timezone-aware timestamp utilities


class LanguageAdminView(ProfessionalModelView):
    """
    Language Management View:
    Manages spoken/written language proficiency records for the portfolio.
    Profile ownership is automatically assigned via the base class on every save.
    Language names are normalized to Title Case before persisting.
    """

    # --- TEMPLATE CONFIGURATION ---
    create_template = 'admin/model/create.html'                # Full-page premium card layout
    edit_template   = 'admin/model/create.html'                # Full-page premium card layout

    create_modal = False                                       # Disable modal — use full page
    edit_modal   = False                                       # Disable modal — use full page

    # --- LIST VIEW DISPLAY ---
    column_list = ('language_name', 'proficiency', 'last_updated')

    column_labels = {
        'language_name': 'Language',                           # Human-readable column label
        'proficiency'  : 'Proficiency Level',                  # Human-readable column label
        'last_updated' : 'Last Updated'                        # Human-readable column label
    }

    # --- UI INTERACTION ---
    column_searchable_list = ['language_name']                 # Enable quick search by language name
    column_filters         = ['proficiency']                   # Enable filtering by proficiency level
    column_default_sort    = ('language_name', False)          # Alphabetical sort by default

    # --- FORM CONFIGURATION ---
    # 'profile' is intentionally excluded — assigned automatically by the base class
    form_columns = (
        'language_name',                                       # Required: the language name
        'proficiency',                                         # Required: CEFR-style level dropdown
    )

    # --- LOGIC HOOKS ---
    def on_model_change(self, form, model, is_created):
        """
        Triggered before saving to MongoDB.
        1. Calls super() to auto-assign the profile via the base class.
        2. Normalizes the language name to Title Case for consistency.
        3. Refreshes the audit timestamp.

        Args:
            form      : The submitted WTForms form instance.
            model     : The Language document being saved.
            is_created: True if this is a new record.
        """
        # Step 1: Run base class logic — auto-assigns profile if not set
        super().on_model_change(form, model, is_created)

        # Step 2: Normalize language name — "english" → "English", "ARABIC" → "Arabic"
        if model.language_name:
            model.language_name = model.language_name.strip().title()

        # Step 3: Refresh the audit timestamp
        model.last_updated = datetime.now(timezone.utc)        # Timezone-aware UTC timestamp