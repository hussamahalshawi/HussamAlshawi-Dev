from flask import request  # Handle incoming request data
from wtforms import FileField, MultipleFileField  # Standard form fields for uploads
from admin_views.admin_view import ProfessionalModelView  # Base view for consistent UI
from App.utils.cloudinary_handler import upload_media_batch  # Utility for cloud storage integration


class AchievementAdminView(ProfessionalModelView):
    """
    Achievement Management View:
    Handles professional recognitions and milestones with support for
    evidence document uploads and skill tagging.
    """

    # --- TEMPLATE CONFIGURATION ---
    # English Comment: Use the universal custom template for a premium look
    create_template = 'admin/model/create.html'  # Path to custom creation template
    edit_template = 'admin/model/create.html'  # Path to custom editing template

    create_modal = False  # Disable modal to use full page design
    edit_modal = False  # Disable modal to use full page design

    # --- LIST VIEW DISPLAY ---
    # English Comment: Columns visible in the main table view
    column_list = ('title', 'issuing_organization', 'date_obtained')

    column_labels = {
        'title': 'Achievement Title',  # Label for recognition name
        'issuing_organization': 'Issued By',  # Label for the granting entity
        'date_obtained': 'Date Received'  # Label for the milestone date
    }

    # --- FORM CONFIGURATION ---
    # English Comment: Extra field to upload certificates or photos of the award
    form_extra_fields = {
        'evidence_files': MultipleFileField('Upload Achievement Photos or PDF Certificates')
    }

    # English Comment: Map HTML5 date picker format to Python datetime
    form_args = {
        'date_obtained': {'format': '%Y-%m-%d'}  # Ensure sync between UI and Backend
    }

    # English Comment: Define the exact sequence of fields in the form
    form_columns = (
        'title',  # Milestone name
        'issuing_organization',  # Granting organization
        'description',  # Context and details
        'evidence_url',  # Direct link to evidence
        'date_obtained',  # Timeline
        'evidence_files',  # Bulk file uploader
        'skills_demonstrated'  # Dynamic list of skills
    )

    # --- LOGICAL HOOKS ---
    def on_model_change(self, form, model, is_created):
        """
        English Comment: Triggered before database save.
        Processes uploaded files and updates system timestamps.
        """

        # A. Handle File Uploads (Evidence/Certificates)
        # English Comment: Batch upload files to the 'Achievements' cloud folder
        files = request.files.getlist('evidence_files')  # Get files from current request
        valid_files = [f for f in files if f and f.filename != '']  # Filter empty inputs

        if valid_files:
            # 2. Upload to Cloudinary
            # English Comment: Upload files to a specific folder in the cloud
            uploaded_urls = upload_media_batch(valid_files, folder_name="Achievements", sub_folder="evidence")

            if uploaded_urls:
                # 3. Save URLs to the model field
                # English Comment: Sync the returned Cloudinary URLs with the database field
                model.evidence_photos = uploaded_urls

                # English Comment: Also update the single evidence_url for quick access if empty
                if not model.evidence_url:
                    model.evidence_url = uploaded_urls[0]
        # B. Audit Metadata
        # English Comment: Update the last modified timestamp on every save
        from datetime import datetime, timezone
        model.last_updated = datetime.now(timezone.utc)  # Ensure timezone-aware UTC time

    # --- UI INTERACTION ---
    # English Comment: Configuration for search and filters in the sidebar
    column_searchable_list = ['title', 'issuing_organization']  # Enable quick text search
    column_filters = ['date_obtained']  # Enable dropdown/date filtering