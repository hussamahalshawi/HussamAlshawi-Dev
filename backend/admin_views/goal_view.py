from flask import flash, redirect, url_for  # Core web utilities
from flask_admin import expose  # Route exposure for custom actions
from admin_views.admin_view import ProfessionalModelView  # Base UI configuration
from datetime import datetime, timezone  # Time utilities
from App.services.roadmap_service import RoadmapService             # Import the new centralized logic

class GoalAdminView(ProfessionalModelView):
    """
    Goal Management View:
    Visualizes the roadmap progress and triggers skill synchronization.
    """

    # --- TEMPLATE CONFIGURATION ---
    create_template = 'admin/model/create.html'  # Using premium card-based layout
    edit_template = 'admin/model/create.html'

    create_modal = False  # Force full-page design
    edit_modal = False  # Force full-page design

    # --- LIST VIEW DISPLAY ---
    column_list = ('goal_name', 'target_year', 'priority', 'status', 'current_score')
    column_editable_list = ['status', 'priority']  # Fast updates from table

    column_labels = {
        'goal_name': 'Milestone',
        'target_year': 'Target Year',
        'current_score': 'Progress %'
    }

    # --- FORM CONFIGURATION ---
    form_columns = (
        'goal_name',
        'sub_title',
        'status',
        'priority',
        'target_year',
        'target_score',
        'required_skills'  # Using the dynamic card-based list
    )

    # --- CUSTOM ADMIN ACTIONS ---
    @expose('/sync_all/')
    def sync_goals(self):
        """
        English Comment: Manual trigger to recalculate all goals via the RoadmapService.
        """
        # English Comment: Call the centralized service instead of individual model methods
        RoadmapService.sync_all_goals()  # Bulk update logic

        flash("Successfully synchronized all goals using RoadmapService.", "success")
        return redirect(url_for('.index_view'))

    # --- LOGIC HOOKS ---
    def on_model_change(self, form, model, is_created):
        """
        English Comment: Automated trigger before saving a goal.
        Ensures the goal score is fresh based on the latest skills data.
        """
        # 1. Audit Maintenance
        model.last_updated = datetime.now(timezone.utc)  # Ensure timestamp is updated

        # 2. Save Initial Model
        # English Comment: We save first to ensure the object has an ID for the service to process
        model.save()

        # 3. Trigger Logic Service
        # English Comment: Delegate the calculation to the service layer for a single goal
        RoadmapService.calculate_goal_progress(model.id)  # Direct service call