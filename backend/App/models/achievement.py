from mongoengine import Document, StringField, DateTimeField, ListField, URLField
from datetime import datetime, timezone

class Achievement(Document):
    """
    Represents professional awards, recognitions, and major career milestones.
    This model highlights exceptional performance and validation of high-level skills.
    """

    # --- RECOGNITION IDENTITY ---
    title = StringField(required=True)  # Name of the award or recognition
    issuing_organization = StringField()  # Entity that granted the award
    category = StringField()  # e.g., Professional, Academic, Competition

    # --- VALIDATION & EVIDENCE ---
    # URL to the digital certificate or official announcement
    evidence_url = URLField()  # Link to verify the achievement authenticity

    # --- TIMELINE & CONTEXT ---
    date_obtained = DateTimeField(required=True)  # Date the award was received
    description = StringField()  # Detailed summary of the accomplishment

    # --- SKILL CORRELATION ---
    # Skills utilized or proven to attain this milestone
    skills_demonstrated = ListField(StringField())  # List of relevant tags

    # --- SYSTEM METADATA ---
    # Tracks the last time this record was modified
    last_updated = DateTimeField(default=lambda: datetime.now(timezone.utc))

    meta = {
        'collection': 'achievements',  # Database collection name
        'ordering': ['-date_obtained'],  # Sorted by date descending
        'indexes': [
            'title',
            'issuing_organization',
            '-date_obtained'  # Optimized for chronological queries
        ]
    }

    def __str__(self):
        """Official string representation for admin logs and displays."""
        # Dynamic string construction based on available data
        org = f" from {self.issuing_organization}" if self.issuing_organization else ""
        return f"{self.title}{org}"