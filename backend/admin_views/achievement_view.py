from flask import request                                      # Access multipart file uploads
from wtforms import MultipleFileField                          # Virtual file upload field
from admin_views.admin_view import ProfessionalModelView       # Base view — handles auto profile assignment
from App.utils.cloudinary_handler import upload_media_batch    # Cloudinary batch upload utility
from datetime import datetime, timezone                        # Timezone-aware timestamp utilities


class AchievementAdminView(ProfessionalModelView):
    """
    Achievement Management View:
    Handles professional recognitions and milestones with evidence upload support.
    Profile ownership is automatically assigned via the base class on every save.
    """

    # --- TEMPLATE CONFIGURATION ---
    create_template = 'admin/model/create.html'                # Full-page premium card layout
    edit_template   = 'admin/model/create.html'                # Full-page premium card layout

    create_modal = False                                       # Disable modal — use full page
    edit_modal   = False                                       # Disable modal — use full page

    # --- LIST VIEW DISPLAY ---
    column_list = ('title', 'issuing_organization', 'date_obtained')

    column_labels = {
        'title'               : 'Achievement Title',          # Human-readable column label
        'issuing_organization': 'Issued By',                  # Human-readable column label
        'date_obtained'       : 'Date Received'               # Human-readable column label
    }

    # --- FORM CONFIGURATION ---
    # Virtual upload field — not stored in DB directly, processed in on_model_change
    form_extra_fields = {
        'evidence_files': MultipleFileField('Upload Achievement Photos or PDF Certificates')
    }

    form_args = {
        'date_obtained': {'format': '%Y-%m-%d'}               # Sync with HTML5 native date picker
    }

    # 'profile' is intentionally excluded — assigned automatically by the base class
    form_columns = (
        'title',
        'issuing_organization',
        'description',
        'evidence_url',                                        # Manual URL to online certificate
        'date_obtained',
        'evidence_files',                                      # Virtual: bulk file uploader
        'skills_demonstrated'
    )

    # --- UI INTERACTION ---
    column_searchable_list = ['title', 'issuing_organization']  # Enable quick text search
    column_filters         = ['date_obtained']                  # Enable date range filtering

    # --- LOGIC HOOKS ---
    def on_model_change(self, form, model, is_created):
        """
        Triggered before saving to MongoDB.
        1. Calls super() to auto-assign the profile via the base class.
        2. Uploads evidence files to Cloudinary and stores returned URLs.
        3. Sets evidence_url to the first uploaded file if not already set.
        4. Refreshes the audit timestamp.

        Args:
            form: The submitted WTForms form instance.
            model: The Achievement document being saved.
            is_created (bool): True if this is a new record.
        """
        # Step 1: Run base class logic — auto-assigns profile if not set
        super().on_model_change(form, model, is_created)

        # Step 2: Retrieve and filter uploaded evidence files from the request
        files       = request.files.getlist('evidence_files')             # Get all uploaded files
        valid_files = [f for f in files if f and f.filename != '']        # Filter out empty inputs

        if valid_files:
            # Step 3: Upload valid files to Cloudinary under 'evidence/Achievements'
            uploaded_urls = upload_media_batch(
                valid_files,
                folder_name='Achievements',                    # Cloudinary folder name
                sub_folder='evidence'                          # Sub-folder for achievement evidence
            )

            if uploaded_urls:
                # Step 4: Store all uploaded URLs in the evidence_photos list field
                model.evidence_photos = uploaded_urls

                # Step 5: Set the primary evidence_url to the first file if not already defined
                if not model.evidence_url:
                    model.evidence_url = uploaded_urls[0]      # Quick-access URL for the first file

        # Step 6: Refresh the audit timestamp
        model.last_updated = datetime.now(timezone.utc)       # Ensure timezone-aware UTC timestamp