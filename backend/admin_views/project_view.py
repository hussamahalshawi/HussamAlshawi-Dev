from flask import request
from wtforms import MultipleFileField, FileField
from admin_views.admin_view import ProfessionalModelView
from App.utils.cloudinary_handler import upload_media_batch
from datetime import datetime, timezone


class ProjectAdminView(ProfessionalModelView):

    create_template = 'admin/model/create.html'
    edit_template   = 'admin/model/create.html'
    create_modal    = False
    edit_modal      = False

    column_list = ('project_name', 'project_type', 'category', 'end_date')

    column_labels = {
        'project_name': 'Project Title',
        'project_type': 'Type',
        'category'    : 'Track',
        'end_date'    : 'Finished On'
    }

    form_extra_fields = {
        'image_uploads': MultipleFileField('Upload New Project Screenshots'),
        'video_upload' : FileField('Upload Project Demo Video')
    }

    form_args = {
        'start_date': {'format': '%Y-%m-%d'},
        'end_date'  : {'format': '%Y-%m-%d'}
    }

    form_columns = (
        'project_name', 'project_type', 'category',
        'github_url', 'live_url', 'description', 'my_role',
        'start_date', 'end_date',
        'image_uploads', 'video_upload',
        'skills_used'
    )

    # ── KEY ADD: حقن الصور المحفوظة في الفورم قبل الـ render ──────────────
    def edit_form(self, obj=None):
        """
        يحمّل الصور المحفوظة ويحطها على الفورم كـ _media_galleries
        حتى الـ template يعرضها في Gallery Viewer.
        """
        form = super().edit_form(obj)                      # بناء الفورم العادي

        galleries = []                                     # قائمة الـ galleries

        # project_images — قائمة صور المشروع
        if obj and obj.project_images:
            galleries.append({
                'field_name': 'project_images',            # اسم الحقل في المودل
                'label'     : 'Project Screenshots',       # العنوان في الـ UI
                'urls'      : list(obj.project_images),    # الـ URLs الحقيقية
            })

        form._media_galleries = galleries                  # ربط الـ galleries بالفورم
        return form

    def on_model_change(self, form, model, is_created):
        """
        1. super() — تعيين الـ profile تلقائياً
        2. معالجة الصور المحزوفة من الـ Gallery Viewer
        3. رفع الصور الجديدة وإضافتها
        4. رفع الفيديو
        5. تحديث الـ timestamp
        """
        super().on_model_change(form, model, is_created)

        # ── حذف الصور اللي اتحزفت من الـ Gallery Viewer ──────────────────
        keep_images = request.form.get('_keep_project_images', None)

        if keep_images is not None:
            # المستخدم فتح Edit — نأخذ فقط الـ URLs اللي اختار يخليها
            if keep_images.strip():
                model.project_images = [u.strip() for u in keep_images.split(',') if u.strip()]
            else:
                model.project_images = []                  # حزف كل الصور

        # ── رفع الصور الجديدة ─────────────────────────────────────────────
        img_files    = request.files.getlist('image_uploads')
        valid_images = [f for f in img_files if f and f.filename != '']

        if valid_images:
            img_urls = upload_media_batch(
                valid_images,
                folder_name='Projects',
                sub_folder='screenshots'
            )
            if img_urls:
                if not model.project_images:
                    model.project_images = img_urls
                else:
                    model.project_images.extend(img_urls)  # إضافة للموجودة

        # ── رفع الفيديو ───────────────────────────────────────────────────
        video_file = request.files.get('video_upload')
        if video_file and video_file.filename != '':
            video_urls = upload_media_batch(
                [video_file],
                folder_name='Projects',
                sub_folder='videos'
            )
            if video_urls:
                model.project_video = video_urls[0]

        model.last_updated = datetime.now(timezone.utc)