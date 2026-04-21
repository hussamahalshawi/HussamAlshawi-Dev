from flask import flash, redirect, url_for, request        # Core Flask utilities
from flask_admin import expose                              # Custom route decorator
from wtforms import StringField, Form                      # WTForms for inline form schema
from admin_views.admin_view import ProfessionalModelView   # Base view for consistent UI
from App.services.skill_service import SkillService        # Auto-categorization service
from App.models.skills import Keyword                      # EmbeddedDocument for keyword construction
from datetime import datetime, timezone                    # Timezone-aware timestamps


class SkillTypeAdminView(ProfessionalModelView):
    """
    SkillType Management View:
    Manages skill categories (Backend, Frontend, DevOps, etc.).
    Keywords are rendered and submitted via the custom HTML template —
    NOT via Flask-Admin's InlineFieldList to avoid populate_obj conflicts.
    """

    # --- Template Configuration ---
    create_template = 'admin/model/create.html'            # Full-page premium layout
    edit_template   = 'admin/model/create.html'            # Full-page premium layout
    create_modal    = False                                # Disable modal — use full page
    edit_modal      = False                                # Disable modal — use full page

    # --- List View ---
    column_list = ('name', 'keywords')                     # Visible columns in table

    column_labels = {
        'name'    : 'Category Name',                       # Human-readable label
        'keywords': 'Skill Keywords'                       # Human-readable label
    }

    # ✅ FIX: No form_extra_fields for keywords
    # Keywords are handled entirely by the custom HTML template
    # Flask-Admin's populate_obj conflicts with EmbeddedDocumentField in InlineFieldList
    form_columns = ('name',)                               # Only 'name' goes through Flask-Admin form

    # --- Lifecycle Hook ---
    def on_model_change(self, form, model, is_created):
        """
        Triggered before saving the SkillType to MongoDB.
        Manually parses keyword entries from raw POST data and builds
        a list of Keyword EmbeddedDocuments — bypassing populate_obj entirely.
        """

        # Step 1: Read raw POST form data
        form_data = request.form

        # Step 2: Discover submitted keyword indices
        # Template sends: keywords-0-name, keywords-0-icon, keywords-0-color
        entry_indices = set()
        for key in form_data.keys():
            if key.startswith('keywords-') and key.endswith('-name'):  # Scan only name fields
                parts = key.split('-')                     # ['keywords', '0', 'name']
                if len(parts) == 3 and parts[1].isdigit(): # Validate middle part is a number
                    entry_indices.add(int(parts[1]))       # Store the numeric index

        # Step 3: Build Keyword EmbeddedDocument list
        keywords_list = []

        for i in sorted(entry_indices):                    # Process in ascending order
            name  = form_data.get(f'keywords-{i}-name',  '').strip()
            icon  = form_data.get(f'keywords-{i}-icon',  '').strip()
            color = form_data.get(f'keywords-{i}-color', '').strip()

            if not name:                                   # Skip empty rows
                continue

            # ✅ Construct EmbeddedDocument — not plain dict
            keywords_list.append(Keyword(
                name  = name,
                icon  = icon  if icon  else 'fas fa-code', # Fallback icon
                color = color if color else '#000000'       # Fallback color
            ))

        # Step 4: Assign to model — MongoEngine serializes EmbeddedDocs to BSON
        model.keywords = keywords_list


class SkillAdminView(ProfessionalModelView):
    """
    Skill Management View:
    Manages individual technical skills and proficiency levels.
    Auto-categorization runs via signals after every save.
    """

    # --- Template Configuration ---
    create_template = 'admin/model/create.html'            # Full-page premium layout
    edit_template   = 'admin/model/create.html'            # Full-page premium layout
    create_modal    = False                                # Disable modal
    edit_modal      = False                                # Disable modal

    # --- List View ---
    column_list          = ('skill_name', 'skill_type', 'level', 'last_updated')
    column_editable_list = ['level']                       # Quick inline level editing

    column_labels = {
        'skill_name'  : 'Technical Skill',
        'skill_type'  : 'Category',
        'level'       : 'Proficiency %',
        'last_updated': 'Last Sync'
    }

    # --- Form Configuration ---
    form_columns = (
        'skill_name',                                      # Required: unique skill identifier
        'skill_type',                                      # Reference: parent SkillType
        'skill_icon',                                      # Optional: manual icon override
        'level'                                            # Proficiency 0–100
    )

    # --- UI Interaction ---
    column_filters         = ['skill_type', 'level']
    column_searchable_list = ['skill_name']

    # --- Custom Route ---
    @expose('/reorganize/')
    def reorganize_skills(self):
        """Manual trigger to re-categorize all skills via SkillService."""
        count = SkillService.bulk_update_categories()
        flash(f"Successfully re-categorized {count} skills.", "success")
        return redirect(url_for('.index_view'))

    # --- Lifecycle Hook ---
    def on_model_change(self, form, model, is_created):
        """Refreshes audit timestamp before saving. Categorization runs via signals."""
        model.last_updated = datetime.now(timezone.utc)   # Keep modification time current