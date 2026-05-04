try:
    from markupsafe import Markup
except ImportError:
    from jinja2 import Markup

from flask import flash, redirect, url_for                     # Core Flask utilities for UI feedback
from flask_admin.actions import action                         # Bulk action decorator
from admin_views.admin_view import ProfessionalModelView       # Base view — handles auto profile assignment
from datetime import datetime, timezone                        # Timezone-aware timestamp utilities


class FeedbackAdminView(ProfessionalModelView):
    """
    Feedback Management View:
    Displays messages submitted by visitors via the public portfolio contact form.
    Admins can review, feature as testimonials, or delete entries.

    Design decisions:
        - can_create = False  : Feedback is submitted by visitors via the public API only.
          Creating fake entries from the admin panel would undermine trust.
        - can_edit   = True   : Admins may toggle is_read / is_featured as part of curation.
        - Bulk actions        : Mark as read, feature, unfeature — for efficient inbox management.
    """

    # --- TEMPLATE CONFIGURATION ---
    create_template = 'admin/model/create.html'                # Full-page premium card layout
    edit_template   = 'admin/model/create.html'                # Full-page premium card layout

    create_modal = False                                       # Disable modal — use full page
    edit_modal   = False                                       # Disable modal — use full page

    # --- PERMISSIONS ---
    can_create = False                                         # Visitors submit feedback — not admins
    can_edit   = True                                          # Allow toggling is_read / is_featured
    can_delete = True                                          # Allow removal of spam or irrelevant entries

    # --- LIST VIEW DISPLAY ---
    column_list = (
        'sender_name',
        'sender_email',
        'company_name',
        'job_title',
        'is_read',
        'is_featured',
        'submitted_at'
    )

    column_labels = {
        'sender_name' : 'From',                               # Human-readable column label
        'sender_email': 'Email',                              # Human-readable column label
        'company_name': 'Company',                            # Human-readable column label
        'job_title'   : 'Role',                               # Human-readable column label
        'is_read'     : 'Read',                               # Human-readable column label
        'is_featured' : 'Featured',                           # Human-readable column label
        'submitted_at': 'Received On'                         # Human-readable column label
    }

    # --- UI INTERACTION ---
    column_searchable_list = ['sender_name', 'sender_email', 'company_name']  # Quick text search
    column_filters         = ['is_read', 'is_featured', 'submitted_at']       # Filter panel options
    column_default_sort    = ('submitted_at', True)            # Newest feedback first

    # Inline-editable toggles — admin can flip these directly from the list without opening edit form
    column_editable_list   = ['is_read', 'is_featured']        # Quick toggles in table row

    # --- FORM CONFIGURATION ---
    # Only fields that an admin may legitimately touch after submission
    # sender_name, sender_email, message are shown read-only context; not editable
    form_columns = (
        'sender_name',                                         # Display only — who sent it
        'sender_email',                                        # Display only — contact info
        'company_name',                                        # Display only — context
        'job_title',                                           # Display only — context
        'message',                                             # Display only — the actual content
        'is_read',                                             # Editable — mark as reviewed
        'is_featured',                                         # Editable — promote to testimonial
    )

    # -------------------------------------------------------------------------
    # LIFECYCLE HOOK
    # -------------------------------------------------------------------------

    def on_model_change(self, form, model, is_created):
        """
        Triggered before saving to MongoDB.
        1. Calls super() to auto-assign the profile via the base class.
        2. Refreshes last_updated on every admin save.
        3. Auto-marks as read when the admin opens and saves the edit form.

        Note:
            submitted_at is intentionally NOT updated here.
            It must always reflect the original visitor submission time.

        Args:
            form      : The submitted WTForms form instance.
            model     : The Feedback document being saved.
            is_created: True if this is a new record (not possible via admin — can_create=False).
        """
        # Step 1: Run base class logic — auto-assigns profile if not set
        super().on_model_change(form, model, is_created)

        # Step 2: Refresh modification timestamp
        model.last_updated = datetime.now(timezone.utc)        # Timezone-aware UTC timestamp

        # Step 3: Editing implies the admin has read the message
        if not is_created:
            model.is_read = True                               # Auto-mark as read on any admin edit

    # -------------------------------------------------------------------------
    # BULK ACTIONS
    # -------------------------------------------------------------------------

    @action('mark_as_read', 'Mark as Read', 'Mark all selected entries as read?')
    def action_mark_as_read(self, ids):
        """
        Bulk action to clear the unread flag on selected feedback entries.
        Useful for quickly processing a batch of new submissions.

        Args:
            ids: List of selected Feedback ObjectIds from the admin checkbox.
        """
        try:
            from App.models.feedback import Feedback           # Local import — avoids circular dependency
            count = 0
            for fid in ids:
                fb              = Feedback.objects.get(id=fid) # Fetch by ID
                fb.is_read      = True                         # Mark as reviewed
                fb.last_updated = datetime.now(timezone.utc)   # Refresh timestamp
                fb.save()
                count += 1
            flash(f'Marked {count} item(s) as read.', 'success')
        except Exception as e:
            flash(f'Error: {str(e)}', 'error')
        return redirect(url_for('.index_view'))

    @action('mark_as_featured', 'Feature on Portfolio', 'Display selected entries as public testimonials?')
    def action_mark_as_featured(self, ids):
        """
        Bulk action to feature selected feedback as public testimonials on the portfolio.
        Also auto-marks entries as read since they have been reviewed for feature selection.

        Args:
            ids: List of selected Feedback ObjectIds from the admin checkbox.
        """
        try:
            from App.models.feedback import Feedback           # Local import — avoids circular dependency
            count = 0
            for fid in ids:
                fb              = Feedback.objects.get(id=fid) # Fetch by ID
                fb.is_featured  = True                         # Promote to public testimonial
                fb.is_read      = True                         # Implied: admin reviewed before featuring
                fb.last_updated = datetime.now(timezone.utc)   # Refresh timestamp
                fb.save()
                count += 1
            flash(f'{count} item(s) are now featured on the portfolio.', 'success')
        except Exception as e:
            flash(f'Error: {str(e)}', 'error')
        return redirect(url_for('.index_view'))

    @action('unfeature', 'Remove from Portfolio', 'Remove selected entries from public display?')
    def action_unfeature(self, ids):
        """
        Bulk action to remove selected feedback from the public testimonials section.

        Args:
            ids: List of selected Feedback ObjectIds from the admin checkbox.
        """
        try:
            from App.models.feedback import Feedback           # Local import — avoids circular dependency
            count = 0
            for fid in ids:
                fb              = Feedback.objects.get(id=fid) # Fetch by ID
                fb.is_featured  = False                        # Remove from public display
                fb.last_updated = datetime.now(timezone.utc)   # Refresh timestamp
                fb.save()
                count += 1
            flash(f'{count} item(s) removed from portfolio display.', 'success')
        except Exception as e:
            flash(f'Error: {str(e)}', 'error')
        return redirect(url_for('.index_view'))