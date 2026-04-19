from mongoengine import Document, StringField,BooleanField, FloatField, DateTimeField, EmailField, ListField, URLField
from datetime import datetime, timezone


class Profile(Document):
    """
    HussamAlshawi-Dev: The Central Identity Hub.
    Manages personal data and orchestrates complex global metric calculations.
    """

    # --- IDENTITY & CONTACT ---
    full_name = StringField(required=True, default="Hussam Alshawi")
    title = StringField(required=True, help_text="e.g., Full Stack Developer | AI Enthusiast")
    bio = StringField(required=True)
    email = EmailField(required=True, unique=True)
    phone = StringField()
    address = StringField(help_text="City, Country")

    # --- PROFESSIONAL STATUS ---
    is_available_for_hire = BooleanField(default=True)
    remote_preference = BooleanField(default=True)


    # English Comment: Primary profile picture (Direct link from Cloudinary)
    primary_avatar = StringField(help_text="Primary Cloudinary URL for navigation and hero sections")

    # --- SOCIAL ECOSYSTEM ---
    github_url = URLField(required=False, null=True, default=None)
    linkedin_url = URLField(required=False, null=True, default=None)
    facebook_url = URLField(required=False, null=True, default=None)
    instagram_url = URLField(required=False, null=True, default=None)
    medium_url = URLField(required=False, null=True, default=None)  # English Comment: Added for your technical articles

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


    def __str__(self):
        return f"{self.full_name} - {self.title}"