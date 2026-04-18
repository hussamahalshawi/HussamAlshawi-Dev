from mongoengine import Document, StringField, DateTimeField, ListField, BooleanField, URLField
from datetime import datetime, timezone  # Standard utilities for time management


class Experience(Document):
    """
    Represents professional work history and career milestones.
    This model serves as a primary data source for profile metrics and skill tracking.
    """

    # --- POSITION IDENTITY ---
    job_title = StringField(required=True)  # Official designation (e.g., Senior Python Developer)
    company_name = StringField(required=True)  # Name of the employer or organization

    # --- MISSING FIELD: EMPLOYMENT TYPE ---
    # English Comment: Categorizes the nature of the role for better frontend filtering
    employment_type = StringField(choices=('Full-time', 'Part-time', 'Freelance', 'Contract'))

    # --- LOCATION & WEB PRESENCE ---
    location = StringField(max_length=100)  # e.g., "Remote" or "Amman, Jordan"
    # English Comment: Direct link to the company's official website or LinkedIn page
    company_url = URLField()  # Added to provide evidence of company existence

    # --- JOB CONTEXT ---
    description = StringField()  # Detailed summary of responsibilities and achievements

    # --- TIMELINE MANAGEMENT ---
    start_date = DateTimeField(required=True)  # Date when the tenure began
    end_date = DateTimeField(required=False)  # Date when the tenure ended (null if current)
    is_current = BooleanField(default=False)  # Flag to indicate active employment

    # --- SKILL ACQUISITION ---
    # List of skills utilized or mastered during this professional tenure.
    skills_acquired = ListField(StringField())  # Dynamic tags for system signals

    # --- SYSTEM METRICS ---
    # Tracks the exact moment of the last database modification
    last_updated = DateTimeField(default=lambda: datetime.now(timezone.utc))

    meta = {
        'collection': 'experience',  # Database collection name
        'ordering': ['-is_current', '-start_date'],  # Prioritizes current roles then latest dates
        'indexes': [
            'job_title',
            'company_name',
            'is_current',
            '-start_date'  # Optimized for career timeline generation
        ]
    }

    def __str__(self):
        """Official string representation for admin dropdowns and audit logs."""
        status = "(Current)" if self.is_current else ""  # Dynamic status label
        return f"{self.job_title} at {self.company_name} {status}"