from admin_views.admin_view import ProfessionalModelView  # Base UI for consistency
from flask import flash, redirect, url_for                          # Core web utilities
from flask_admin import expose                                      # Route exposure for custom actions
from App.services.skill_service import SkillService                 # Importing the smart logic
from datetime import datetime, timezone                             # Time management
from wtforms import StringField, Form
from flask_admin.model.fields import InlineFormField, InlineFieldList



class KeywordForm(Form):
    name = StringField('Name')
    icon = StringField('Icon Class')
    color = StringField('Color')

class SkillTypeAdminView(ProfessionalModelView):
    """
    Skill Type Management:
    Handles broad categories like Backend, Frontend, and Soft Skills.
    """
    # --- TEMPLATE CONFIGURATION ---
    # English Comment: Essential for custom create.html templates to take full screen width
    create_template = 'admin/model/create.html'  # Path to premium layout
    edit_template = 'admin/model/create.html'  # Path to premium layout
    # --- TEMPLATE CONFIGURATION ---
    # English Comment: Disable modals to ensure the custom grid layout renders properly
    create_modal = False  # Use full page for creation
    edit_modal = False  # Use full page for editing

    form_extra_fields = {
        'keywords': InlineFieldList(InlineFormField(KeywordForm), min_entries=1)
    }

    column_list = ('name', 'keywords')  # Fields visible in the table
    form_columns = ('name', 'keywords')  # Fields visible in the form


class SkillAdminView(ProfessionalModelView):
    """
    Skill Management View:
    Centralizes proficiency tracking and skill categorization.
    """

    # --- TEMPLATE CONFIGURATION ---
    # English Comment: Essential for custom create.html templates to take full screen width
    create_template = 'admin/model/create.html'  # Path to premium layout
    edit_template = 'admin/model/create.html'  # Path to premium layout

    create_modal = False  # Force full-page redirect
    edit_modal = False  # Force full-page redirect

    # --- LIST VIEW DISPLAY ---
    column_list = ('skill_name', 'skill_type', 'level', 'last_updated')
    column_editable_list = ['level']  # Enable fast editing from the list view

    column_labels = {
        'skill_name': 'Technical Skill',
        'skill_type': 'Category',
        'level': 'Proficiency %',
        'last_updated': 'Last Sync'
    }

    # --- FORM CONFIGURATION ---
    # English Comment: Prioritizing identifying info then technical metrics
    form_columns = (
        'skill_name',
        'skill_type',
        'skill_icon',  # Font Awesome class input
        'level'  # Proficiency score (0-100)
    )

    # --- INTERACTION ---
    column_filters = ['skill_type', 'level']  # Dashboard sidebar filters
    column_searchable_list = ['skill_name']  # Search bar integration

    # --- CUSTOM ACTIONS ---
    # English Comment: Button to trigger mass re-categorization from the UI
    @expose('/reorganize/')
    def reorganize_skills(self):
        """Triggers the SkillService to update all skills at once."""
        count = SkillService.bulk_update_categories()  # Call the service logic
        flash(f"Successfully re-categorized {count} skills.", "success")
        return redirect(url_for('.index_view'))

    # --- LOGIC HOOKS ---
    def on_model_change(self, form, model, is_created):
        """
        English Comment: Triggered automatically before saving to MongoDB.
        Uses SkillService to ensure the skill is assigned to the correct category.
        """
        # 1. Audit Timestamp
        model.last_updated = datetime.now(timezone.utc)  # Refresh modification time

        # 2. Auto-Categorization Logic
        # English Comment: Temporary save to ensure the service can read the latest name if needed
        # but here we apply the logic directly to the current model instance.

        # We call a modified version of the service logic for a single object
        SkillService.bulk_update_categories()  # Refresh all to maintain consistency