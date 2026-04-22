from mongoengine import Document, StringField, DateTimeField, ListField, BooleanField, URLField, ReferenceField
from datetime import datetime, timezone                        # Standard utilities for time management


class Experience(Document):
    """
    Represents professional work history and career milestones.
    Linked to a Profile document to scope all records to a single portfolio owner.
    This model serves as a primary data source for profile metrics and skill tracking.
    """

    # --- OWNERSHIP ---
    # Every experience record belongs to exactly one portfolio profile
    profile = ReferenceField('Profile', required=False)        # FK → Profile (lazy string ref avoids circular import)

    # --- POSITION IDENTITY ---
    job_title    = StringField(required=True)                  # Official designation (e.g., Senior Python Developer)
    company_name = StringField(required=True)                  # Name of the employer or organization

    # --- EMPLOYMENT TYPE ---
    # Categorizes the nature of the role for better frontend filtering
    employment_type = StringField(
        choices=('Full-time', 'Part-time', 'Freelance', 'Contract')  # Allowed employment categories
    )

    # --- LOCATION & WEB PRESENCE ---
    location    = StringField(max_length=100)                  # e.g., "Remote" or "Amman, Jordan"
    company_url = URLField()                                   # Direct link to the company's official website

    # --- JOB CONTEXT ---
    description = StringField()                                # Detailed summary of responsibilities and achievements

    # --- TIMELINE MANAGEMENT ---
    start_date = DateTimeField(required=True)                  # Date when the tenure began
    end_date   = DateTimeField(required=False)                 # Date when the tenure ended (null if current)
    is_current = BooleanField(default=False)                   # Flag to indicate active employment

    # --- SKILL ACQUISITION ---
    # List of skills utilized or mastered during this professional tenure
    skills_acquired = ListField(StringField())                 # Dynamic tags for system signals

    # --- SYSTEM METRICS ---
    last_updated = DateTimeField(
        default=lambda: datetime.now(timezone.utc)             # Tracks the exact moment of the last DB modification
    )

    meta = {
        'collection': 'experience',                            # Database collection name
        'ordering'  : ['-is_current', '-start_date'],          # Prioritizes current roles then latest dates
        'indexes'   : [
            'profile',                                         # Optimized for per-profile queries
            'job_title',
            'company_name',
            'is_current',
            '-start_date'                                      # Optimized for career timeline generation
        ]
    }

    def __str__(self):
        """Official string representation for admin dropdowns and audit logs."""
        status = "(Current)" if self.is_current else ""        # Dynamic status label
        return f"{self.job_title} at {self.company_name} {status}"