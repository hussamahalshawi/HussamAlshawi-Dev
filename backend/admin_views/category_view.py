from flask_admin.contrib.mongoengine import ModelView  # Base MongoEngine ModelView
from admin_views.admin_view import ProfessionalModelView  # Your custom base view for UI consistency


class CategoryAdminView(ProfessionalModelView):
    """
    Category Management View:
    Provides a centralized interface to manage classifications used across
    different sections of the portfolio (e.g., Blog, Projects, Skills).
    """

    # --- TEMPLATE CONFIGURATION ---
    # English Comment: Ensure the view uses the premium custom form layout
    create_template = 'admin/model/create.html'  # Path to customized creation template
    edit_template = 'admin/model/create.html'  # Path to customized editing template

    create_modal = False  # Disable modal to use full page design
    edit_modal = False  # Disable modal to use full page design

    # --- LIST VIEW DISPLAY ---
    column_list = ('name', 'description', 'created_at')  # Columns shown in the main table

    column_labels = {
        'name': 'Category Name',  # Label for the classification title
        'description': 'Brief Description',  # Label for the summary field
        'created_at': 'Registration Date'  # Label for the creation timestamp
    }

    # --- FORM CONFIGURATION ---
    # English Comment: Define field order for the creation and editing forms
    form_columns = (
        'name',  # Required unique name
        'description'  # Optional explanation of the category
    )

    # --- UI INTERACTION ---
    column_searchable_list = ['name']  # Enable instant search by name
    column_filters = ['created_at']  # Allow filtering by date range

    def on_model_change(self, form, model, is_created):
        """
        English Comment: Triggered before saving a category.
        Ensures metadata or validation logic is applied consistently.
        """
        # English Comment: Convert name to title case for professional look
        if model.name:
            model.name = model.name.strip().title()  # Standardize naming format