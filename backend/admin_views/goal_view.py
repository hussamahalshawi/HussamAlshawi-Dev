from flask import flash, redirect, url_for  # Core web utilities
from flask_admin import expose  # Route exposure for custom actions
from admin_views.admin_view import ProfessionalModelView  # Base UI configuration
from datetime import datetime, timezone  # Time utilities


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

    @expose('/sync_all/')
    def sync_goals(self):
        """
        English Comment: Custom admin action to trigger progress calculation for all goals.
        """
        goals = self.model.objects.all()
        for goal in goals:
            goal.sync_progress()
            goal.save()

        flash("Successfully synchronized all goals with current skill levels.", "success")
        return redirect(url_for('.index_view'))

    def on_model_change(self, form, model, is_created):
        """
        English Comment: Trigger sync automatically when a goal is created or modified.
        """
        model.sync_progress()
        model.last_updated = datetime.now(timezone.utc)