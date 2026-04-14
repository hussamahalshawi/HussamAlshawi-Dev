# backend/admin_views/profile_views.py

try:
    from markupsafe import Markup
except ImportError:
    from jinja2 import Markup

from flask import flash, redirect, url_for, request
from flask_admin.actions import action
from wtforms import FileField
from admin_views.admin_view import ProfessionalModelView
from App.utils.cloudinary_handler import upload_media_batch # نستخدم نفس الـ Handler لتوحيد الشغل

class ProfileAdminView(ProfessionalModelView):
    """
    Identity Hub Admin: Manages personal branding and global metrics.
    Features: Cloudinary Avatar upload & Metric Refresh Action.
    """

    # --- 1. Templates & Basic Settings ---
    # نستخدم القوالب الاحترافية التي صممناها سابقاً لتوحيد التصميم
    create_template = 'admin/model/create.html'
    edit_template = 'admin/model/create.html'
    create_modal = False
    edit_modal = False

    column_list = ('avatar_preview', 'full_name', 'title', 'experience_years', 'overall_score', 'last_updated')
    column_labels = {
        'avatar_preview': 'Photo',
        'full_name': 'Name',
        'title': 'Job Title',
        'experience_years': 'Exp (Years)',
        'overall_score': 'Score %',
        'last_updated': 'Sync Date',
        'avatar_upload': 'Change Profile Photo'
    }

    # --- 2. Custom Avatar Handling ---
    form_extra_fields = {
        'avatar_upload': FileField('New Avatar Image')
    }

    def on_model_change(self, form, model, is_created):
        """
        English Comment: Handle single avatar upload to Cloudinary.
        """
        file = request.files.get('avatar_upload')
        if file and file.filename != '':
            # نرفعه في مجلد خاص بالبروفايل للحفاظ على التنظيم
            urls = upload_media_batch([file], folder_name="Identity", sub_folder="profile")
            if urls:
                model.primary_avatar = urls[0]

    # --- 3. UI Formatters (Previews) ---
    def _avatar_preview(view, context, model, name):
        if not model.primary_avatar:
            return Markup('<div class="rounded-circle bg-secondary" style="width:40px;height:40px;"></div>')
        return Markup(f'''
            <img src="{model.primary_avatar}" 
                 style="width:45px; height:45px; border-radius: 50%; object-fit: cover; border: 2px solid #2563eb; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        ''')

    column_formatters = {
        'avatar_preview': _avatar_preview
    }

    # --- 4. Global Metrics Action ---
    @action('refresh_profile_metrics', 'Refresh Metrics', 'Are you sure you want to recalculate all experience and scores?')
    def action_refresh_metrics(self, ids):
        """
        English Comment: Bulk action to trigger the logic we wrote in the model.
        """
        try:
            count = 0
            for profile_id in ids:
                profile = self.model.objects.get(id=profile_id)
                profile.refresh_metrics() # استدعاء الميثود اللي جهزناها في الموديل
                count += 1
            flash(f'Successfully synchronized {count} profile(s) with the latest global data.', 'success')
        except Exception as e:
            flash(f'Error during synchronization: {str(e)}', 'error')

        return redirect(url_for('.index_view'))

    # --- 5. Custom Form Logic ---
    # ترتيب الحقول ليكون مريحاً للمستخدم
    form_columns = (
        'full_name', 'title', 'bio', 'email', 'phone',
        'address', 'avatar_upload', 'github_url',
        'linkedin_url', 'medium_url'
    )