from flask import flash, redirect, url_for                     # Core Flask utilities for UI feedback
from flask_admin import expose                                  # Decorator to expose custom admin routes
from admin_views.admin_view import ProfessionalModelView       # Base view for consistent UI styling
from datetime import datetime, timezone                        # Timezone-aware timestamp utilities
from App.services.roadmap_service import RoadmapService        # Centralized goal progress calculation service


class GoalAdminView(ProfessionalModelView):
    """
    Goal Management View:
    Manages career roadmap milestones and triggers skill-based progress synchronization.
    Uses RoadmapService as the single source of truth for score calculations.
    """

    # --- Template Configuration ---
    create_template = 'admin/model/create.html'                # Premium card-based creation layout
    edit_template = 'admin/model/create.html'                  # Premium card-based editing layout

    create_modal = False                                       # Force full-page design for complex forms
    edit_modal = False                                         # Force full-page design for complex forms

    # --- List View Display ---
    column_list = ('goal_name', 'target_year', 'priority', 'status', 'current_score')  # Table columns
    column_editable_list = ['status', 'priority']              # Allow quick inline edits from table

    column_labels = {
        'goal_name': 'Milestone',                             # Human-readable label for goal name
        'target_year': 'Target Year',                         # Human-readable label for year field
        'current_score': 'Progress %'                         # Human-readable label for score field
    }

    # --- Form Configuration ---
    form_columns = (
        'goal_name',                                          # Required: unique milestone name
        'sub_title',                                          # Optional: descriptive subtitle
        'status',                                             # Dropdown: Planned / In Progress / Achieved
        'priority',                                           # Dropdown: Low / Medium / High / Critical
        'target_year',                                        # Required: year to achieve this goal
        'target_score',                                       # Target proficiency percentage (default: 95)
        'required_skills'                                     # Dynamic list: skills needed for this goal
    )

    # --- Custom Admin Routes ---
    @expose('/sync_all/')
    def sync_goals(self):
        """
        Manual trigger endpoint to recalculate progress for all goals at once.
        Accessible from the admin toolbar as a custom action button.
        """
        RoadmapService.sync_all_goals()                        # Delegate bulk update to the service layer
        flash("Successfully synchronized all goals using RoadmapService.", "success")
        return redirect(url_for('.index_view'))                # Redirect back to the goals list

    # --- Lifecycle Hooks ---
    def on_model_change(self, form, model, is_created):
        """
        Triggered by Flask-Admin before the model is saved to MongoDB.
        Updates the audit timestamp only — score calculation happens after save via signal.

        Note: Do NOT call model.save() here — Flask-Admin handles the save automatically.
        Calling save() here would cause a double save and fire signals twice.
        """
        # Step 1: Refresh the audit timestamp before Flask-Admin persists the document
        model.last_updated = datetime.now(timezone.utc)        # Ensure modification time is current

        # ✅ FIX: Removed model.save() — Flask-Admin saves automatically after this hook
        # ✅ FIX: Removed RoadmapService.calculate_goal_progress(model.id) — model has no ID yet if is_created
        # Score calculation is handled by the post_save signal in signals.py

    def after_model_change(self, form, model, is_created):
        """
        Triggered by Flask-Admin after the model is successfully saved to MongoDB.
        Safe to call RoadmapService here because the model now has a valid database ID.
        """
        try:
            # Recalculate this specific goal's progress using the latest skill data
            RoadmapService.calculate_goal_progress(model.id)   # Uses model.id safely after save

        except Exception as e:
            import logging                                     # Local import to avoid top-level dependency
            logging.error(f"GoalAdminView after_model_change: Score sync failed — {str(e)}")