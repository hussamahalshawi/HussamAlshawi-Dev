from mongoengine import Document, StringField, DateTimeField, ListField, URLField, ReferenceField
from datetime import datetime, timezone  # Standard utilities for time management
from App.models.category import Category  # Import Category for relationship


class Course(Document):
    """
    Represents professional certifications and training courses.
    Serves as evidence of continuous development and contributes to skill leveling.
    """

    # --- COURSE IDENTIFICATION ---
    course_name = StringField(required=True)  # Official name of the certification
    organization = StringField()  # Issuing body (e.g., Google, IBM)

    # --- CLASSIFICATION ---
    # English Comment: Links the course to a specific study track or category
    category = ReferenceField(Category)  # Reference to the Category model

    # --- PROJECT-BASED LEARNING ---
    # Briefly describes the practical project completed during the course
    project_summary = StringField()  # Context of hands-on application

    # --- CREDENTIALS & EVIDENCE ---
    # English Comment: URL to the digital certificate or badge for verification
    credential_url = URLField()  # Public link to the certificate

    # --- TIMELINE ---
    start_date = DateTimeField(required=True)  # Commencement date
    end_date = DateTimeField(required=True)  # Completion date

    # --- SKILLS ENGINE ---
    # Skills tagged here will be synchronized with the master Skill model
    acquired_skills = ListField(StringField())  # List of skills learned

    # --- AUDIT & SYNC ---
    # Using lambda to ensure a unique UTC timestamp is generated on every save
    last_updated = DateTimeField(default=lambda: datetime.now(timezone.utc))

    meta = {
        'collection': 'courses',  # Database collection name
        'ordering': ['-start_date'],  # Displays newest courses first
        'indexes': [
            'course_name',
            'organization',
            '-start_date'  # Optimized for chronological listing
        ]
    }

    def __str__(self):
        """Official identifier for the course in admin views and logs."""
        return f"{self.course_name} by {self.organization}" if self.organization else self.course_name