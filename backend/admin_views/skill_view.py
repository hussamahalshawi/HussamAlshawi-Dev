from flask import flash, redirect, url_for, request        # Core Flask utilities
from flask_admin import expose                              # Custom route decorator
from wtforms import StringField, Form, HiddenField         # ✅ Added HiddenField
from admin_views.admin_view import ProfessionalModelView   # Base view for consistent UI
from App.services.skill_service import SkillService        # Auto-categorization service
from App.models.skills import Keyword                      # EmbeddedDocument for keyword construction
from datetime import datetime, timezone                    # Timezone-aware timestamps


class SkillTypeAdminView(ProfessionalModelView):
    """
    SkillType Management View:
    Manages skill categories (Backend, Frontend, DevOps, etc.).
    - 'name' is handled normally by Flask-Admin.
    - 'keywords' is injected as a HiddenField placeholder so the template
      can detect it in the form loop and render the custom keyword cards UI.
      The actual data is parsed manually in on_model_change from raw POST data.
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

    # ✅ KEY FIX: Inject 'keywords' as a dummy HiddenField
    # Purpose: makes 'keywords' visible in the Jinja2 form loop
    # The template detects field.id == 'keywords' and renders the custom card UI
    # Flask-Admin never touches its value — on_model_change handles it manually
    form_extra_fields = {
        'keywords': HiddenField('Keywords')                # Placeholder — value ignored by Flask-Admin
    }

    # Both fields now visible in the form loop
    form_columns = ('name', 'keywords')                    # 'name' = real, 'keywords' = placeholder

    # --- Lifecycle Hook ---
    def on_model_change(self, form, model, is_created):
        """
        Triggered before saving the SkillType to MongoDB.
        Parses keyword entries from raw POST data and builds Keyword EmbeddedDocument list.
        The HiddenField value is ignored — we read directly from request.form instead.
        """

        # Step 1: Read raw POST form data
        form_data = request.form

        # Step 2: Discover all submitted keyword indices
        # Template sends fields named: keywords-0-name, keywords-0-icon, keywords-0-color
        entry_indices = set()
        for key in form_data.keys():
            if key.startswith('keywords-') and key.endswith('-name'):  # Identify name fields only
                parts = key.split('-')                     # Split: ['keywords', '0', 'name']
                if len(parts) == 3 and parts[1].isdigit(): # Ensure middle segment is a valid index
                    entry_indices.add(int(parts[1]))       # Collect the numeric index

        # Step 3: Build Keyword EmbeddedDocument list from collected indices
        keywords_list = []

        for i in sorted(entry_indices):                    # Process in ascending order: 0, 1, 2...
            name  = form_data.get(f'keywords-{i}-name',  '').strip()  # Required: keyword name
            icon  = form_data.get(f'keywords-{i}-icon',  '').strip()  # Optional: FontAwesome class
            color = form_data.get(f'keywords-{i}-color', '').strip()  # Optional: hex color

            if not name:                                   # Skip empty rows (user left blank)
                continue

            # Build EmbeddedDocument — MongoEngine validates and serializes to BSON
            keywords_list.append(Keyword(
                name  = name,
                icon  = icon  if icon  else 'fas fa-code', # Default: generic code icon
                color = color if color else '#000000'       # Default: black
            ))

        # Step 4: Assign validated list to model field
        model.keywords = keywords_list                     # Replaces entire keywords list on every save


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