from flask_admin.contrib.mongoengine import ModelView
from flask import redirect, url_for, request


# English Comment: Base Admin View to enforce global standards across all models
class ProfessionalModelView(ModelView):
    """
    Customized ModelView to provide a consistent look and feel.
    Includes pagination, search, and detailed view by default.
    """
    extra_css = [
        'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css'
    ]
    # English Comment: Display 20 items per page
    page_size = 20

    # English Comment: Enable common features for high productivity
    can_create = True
    can_edit = True
    can_delete = True
    can_view_details = True

    # English Comment: Professional UI settings
    create_modal = True
    edit_modal = True
    details_modal = True