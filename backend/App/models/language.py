from mongoengine import Document, StringField, DateTimeField, ReferenceField
from datetime import datetime, timezone                        # Standard utilities for time management


class Language(Document):
    """
    Represents a spoken or written language and its proficiency level.
    Linked to a Profile to scope records to a single portfolio owner.
    Displayed on the portfolio to highlight multilingual communication capabilities.
    """

    # --- OWNERSHIP ---
    # Every language record belongs to exactly one portfolio profile
    profile = ReferenceField('Profile', required=False)        # FK → Profile (lazy string ref avoids circular import)

    # --- LANGUAGE IDENTITY ---
    language_name = StringField(required=True)                 # e.g., Arabic, English, French

    # --- PROFICIENCY LEVEL ---
    # Follows the CEFR and professional industry standard scale
    proficiency = StringField(
        required=True,
        choices=(
            'Native',                                          # Mother tongue — no limitations
            'Fluent',                                          # Near-native — professional level
            'Advanced',                                        # C1 — complex topics handled comfortably
            'Intermediate',                                    # B1/B2 — everyday communication
            'Beginner',                                        # A1/A2 — basic understanding only
        ),
        default='Intermediate'                                 # Default if not specified
    )

    # --- AUDIT METRICS ---
    created_at   = DateTimeField(default=lambda: datetime.now(timezone.utc))  # Record creation timestamp
    last_updated = DateTimeField(default=lambda: datetime.now(timezone.utc))  # Last modification timestamp

    meta = {
        'collection': 'languages',                             # MongoDB collection name
        'ordering'  : ['language_name'],                       # Alphabetical ordering by default
        'indexes'   : [
            'profile',                                         # Optimized for per-profile queries
            'language_name',                                   # Fast lookup by name
            'proficiency'                                      # Optimized for filtering by level
        ]
    }

    def __str__(self):
        """String representation for the admin interface and debugging."""
        return f"{self.language_name} — {self.proficiency}"   # e.g., "Arabic — Native"