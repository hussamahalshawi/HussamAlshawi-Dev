from mongoengine import Document, StringField, DateTimeField, ListField, URLField, ReferenceField
from datetime import datetime, timezone                        # Standard utilities for time management


class Achievement(Document):
    """
    Represents professional awards, recognitions, and major career milestones.
    Linked to a Profile to scope records to a single portfolio owner.
    Highlights exceptional performance and validation of high-level skills.

    Media fields:
        evidence_photos   — Multiple evidence photos or PDF certificates (Cloudinary URLs list).
        evidence_video    — Single video walkthrough or acceptance speech (Cloudinary URL string).
        certificate_image — Single official certificate or award scan (Cloudinary URL string).

    Save behavior:
        Each media field is independent. Uploading a certificate does NOT overwrite
        existing evidence_photos, and vice versa. All three can coexist simultaneously.
    """

    # --- OWNERSHIP ---
    # Every achievement record belongs to exactly one portfolio profile
    profile = ReferenceField('Profile', required=False)        # FK → Profile (lazy string ref avoids circular import)

    # --- RECOGNITION IDENTITY ---
    title                = StringField(required=True)          # Name of the award or recognition
    issuing_organization = StringField()                       # Entity that granted the award

    # --- MEDIA EVIDENCE ---
    certificate_image = StringField()                          # Cloudinary URL — single official certificate scan
    evidence_photos   = ListField(StringField())               # List of Cloudinary URLs — photos and PDF evidence
    evidence_video    = StringField()                          # Cloudinary URL — single video walkthrough

    # --- VALIDATION & EVIDENCE ---
    evidence_url = URLField()                                  # Link to verify the achievement authenticity

    # --- TIMELINE & CONTEXT ---
    date_obtained = DateTimeField(required=True)               # Date the award was received
    description   = StringField()                              # Detailed summary of the accomplishment

    # --- SKILL CORRELATION ---
    # Skills utilized or proven to attain this milestone
    skills_demonstrated = ListField(StringField())             # List of relevant skill tags

    # --- SYSTEM METADATA ---
    last_updated = DateTimeField(
        default=lambda: datetime.now(timezone.utc)             # Tracks the last time this record was modified
    )

    meta = {
        'collection': 'achievements',                          # Database collection name
        'ordering'  : ['-date_obtained'],                      # Sorted by date descending
        'indexes'   : [
            'profile',                                         # Optimized for per-profile queries
            'title',
            'issuing_organization',
            '-date_obtained'                                   # Optimized for chronological queries
        ]
    }

    def __str__(self):
        """Official string representation for admin logs and displays."""
        org = f" from {self.issuing_organization}" if self.issuing_organization else ""  # Dynamic org suffix
        return f"{self.title}{org}"