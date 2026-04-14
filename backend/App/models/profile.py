from mongoengine import Document, StringField, FloatField, DateTimeField, EmailField, ListField, URLField
from datetime import datetime, timezone


class Profile(Document):
    """
    HussamAlshawi-Portfolio: The Central Identity Hub.
    Manages personal data and orchestrates complex global metric calculations.
    """

    # --- IDENTITY & CONTACT ---
    full_name = StringField(required=True, default="Hussam Alshawi")
    title = StringField(required=True, help_text="e.g., Full Stack Developer | AI Enthusiast")
    bio = StringField(required=True)
    email = EmailField(required=True, unique=True)
    phone = StringField()
    address = StringField(help_text="City, Country")

    # English Comment: Primary profile picture (Direct link from Cloudinary)
    primary_avatar = StringField(help_text="Primary Cloudinary URL for navigation and hero sections")

    # --- SOCIAL ECOSYSTEM ---
    github_url = URLField()
    linkedin_url = URLField()
    facebook_url = URLField()
    instagram_url = URLField()
    medium_url = URLField()  # English Comment: Added for your technical articles

    # --- ASSETS & GALLERY ---
    # English Comment: Additional images for the 'About Me' gallery
    profile_gallery = ListField(StringField())
    last_updated = DateTimeField(default=lambda: datetime.now(timezone.utc))

    # PERSISTED METRICS (Automated via refresh_metrics)
    experience_years = FloatField(default=0.0)
    overall_score = FloatField(default=0.0)

    meta = {
        'collection': 'profile',
        'indexes': ['email'],
        'strict': False
    }

    # --- LOGIC: METRIC CALCULATIONS ---

    # def calculate_total_experience(self):
    #     """
    #     English Comment: Aggregates experience from various modules with importance weighting.
    #     """
    #     from App.models.experience import Experience
    #     from App.models.course import Course
    #     from App.models.education import Education
    #     from App.models.project import Project
    #     from App.models.self_study import SelfStudy
    #
    #     total_weighted_days = 0
    #     now = datetime.now(timezone.utc)
    #
    #     # Weights reflect real-world career impact
    #     weights = {
    #         'Experience': 1.0,  # Real jobs = 100%
    #         'Project': 0.4,  # Projects = 40%
    #         'Education': 0.2,  # Academic = 20%
    #         'SelfStudy': 0.3,  # Self-learning = 30%
    #         'Course': 0.3  # Certificates = 30%
    #     }
    #
    #     model_map = {
    #         'Experience': Experience,
    #         'Project': Project,
    #         'Education': Education,
    #         'SelfStudy': SelfStudy,
    #         'Course': Course
    #     }
    #
    #     for label, model in model_map.items():
    #         weight = weights.get(label, 0.1)
    #         for item in model.objects.all():
    #             if hasattr(item, 'start_date') and item.start_date:
    #                 start = item.start_date.replace(
    #                     tzinfo=timezone.utc) if not item.start_date.tzinfo else item.start_date
    #
    #                 if hasattr(item, 'end_date') and item.end_date:
    #                     end = item.end_date.replace(tzinfo=timezone.utc) if not item.end_date.tzinfo else item.end_date
    #                 else:
    #                     end = now
    #
    #                 duration_days = (end - start).days
    #                 if duration_days > 0:
    #                     total_weighted_days += duration_days * weight
    #
    #     return round(total_weighted_days / 365.25, 1)
    #
    # def calculate_overall_score(self):
    #     """
    #     English Comment: Calculates overall progress based on goals completion rate.
    #     """
    #     from App.models.goal import Goal
    #     goals = Goal.objects.all()
    #     if not goals: return 0.0
    #
    #     total_progress = sum([min((g.current_score / (g.target_score or 100)) * 100, 100) for g in goals])
    #     return round(total_progress / goals.count(), 1)
    #
    # def refresh_metrics(self):
    #     """
    #     English Comment: Unified trigger to update and persist calculated fields.
    #     """
    #     self.experience_years = self.calculate_total_experience()
    #     self.overall_score = self.calculate_overall_score()
    #     self.last_updated = datetime.now(timezone.utc)
    #     self.save()
    #
    # def __str__(self):
    #     return f"{self.full_name} - {self.title}"