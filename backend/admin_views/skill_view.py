from admin_views.admin_view import ProfessionalModelView  # Base UI for consistency


class SkillTypeAdminView(ProfessionalModelView):
    """
    Skill Type Management:
    Handles broad categories like Backend, Frontend, and Soft Skills.
    """
    # --- TEMPLATE CONFIGURATION ---
    # English Comment: Disable modals to ensure the custom grid layout renders properly
    create_modal = False  # Use full page for creation
    edit_modal = False  # Use full page for editing

    column_list = ('name', 'icon_class')  # Fields visible in the table
    form_columns = ('name', 'icon_class', 'keywords')  # Fields visible in the form


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