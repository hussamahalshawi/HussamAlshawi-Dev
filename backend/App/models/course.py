from mongoengine import Document, StringField, DateTimeField, ListField, URLField, ReferenceField
from datetime import datetime, timezone                        # Standard utilities for time management
from App.models.category import Category                       # Import Category for classification


class Course(Document):
    """
    Represents professional certifications and training courses.
    Linked to a Profile to scope records to a single portfolio owner.
    Serves as evidence of continuous development and contributes to skill leveling.

    Media fields:
        course_images     — Multiple screenshots or cover photos (Cloudinary URLs list).
        course_video      — Single promo or demo video (Cloudinary URL string).
        certificate_image — Single certificate scan or badge image (Cloudinary URL string).

    Save behavior:
        Each media field is independent. Uploading a certificate does NOT overwrite
        existing course_images, and vice versa. All three can coexist simultaneously.
    """

    # --- OWNERSHIP ---
    # Every course record belongs to exactly one portfolio profile
    profile = ReferenceField('Profile', required=False)        # FK → Profile (lazy string ref avoids circular import)

    # --- COURSE IDENTIFICATION ---
    course_name  = StringField(required=True)                  # Official name of the certification
    organization = StringField()                               # Issuing body (e.g., Google, IBM)

    # --- CLASSIFICATION ---
    # Links the course to a specific study track or category
    category = ReferenceField(Category)                        # Reference to the unified Category model

    # --- PROJECT-BASED LEARNING ---
    project_summary = StringField()                            # Context of hands-on application during the course

    # --- CREDENTIALS & EVIDENCE ---
    credential_url    = URLField()                             # Public link to the digital certificate or badge
    certificate_image = StringField()                          # Cloudinary URL — single uploaded certificate scan

    # --- MEDIA ASSETS ---
    course_images = ListField(StringField())                   # Array of Cloudinary image URLs (screenshots/covers)
    course_video  = StringField()                              # Cloudinary URL — single promo or demo video

    # --- TIMELINE ---
    start_date = DateTimeField(required=True)                  # Commencement date
    end_date   = DateTimeField(required=True)                  # Completion date

    # --- SKILLS ENGINE ---
    # Skills tagged here are synchronized with the master Skill model via signals
    acquired_skills = ListField(StringField())                 # List of skills learned in this course

    # --- AUDIT & SYNC ---
    last_updated = DateTimeField(
        default=lambda: datetime.now(timezone.utc)             # Unique UTC timestamp on every save
    )

    meta = {
        'collection': 'courses',                               # Database collection name
        'ordering'  : ['-start_date'],                         # Displays newest courses first
        'indexes'   : [
            'profile',                                         # Optimized for per-profile queries
            'course_name',
            'organization',
            '-start_date'                                      # Optimized for chronological listing
        ]
    }

    def __str__(self):
        """Official identifier for the course in admin views and logs."""
        return f"{self.course_name} by {self.organization}" if self.organization else self.course_name