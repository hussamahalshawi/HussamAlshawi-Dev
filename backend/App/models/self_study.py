from mongoengine import Document, StringField, DateTimeField, ListField, ReferenceField, URLField
from datetime import datetime, timezone                        # Standard utilities for time management
from App.models.category import Category                       # Import Category for classification


class SelfStudy(Document):
    """
    Represents independent learning activities including books, online courses, or articles.
    Linked to a Profile to scope records to a single portfolio owner.
    Tracks personal growth and serves as evidence of self-driven expertise.
    """

    # --- OWNERSHIP ---
    # Every self-study record belongs to exactly one portfolio profile
    profile = ReferenceField('Profile', required=False)        # FK → Profile (lazy string ref avoids circular import)

    # --- CORE INFORMATION ---
    title         = StringField(required=True)                 # Title of the book, course, or article
    platform_name = StringField(required=True)                 # e.g., O'Reilly, Coursera, Physical Book

    # --- LEARNING TYPE ---
    # Categorizes the source type for specialized UI icons
    learning_type = StringField(
        choices=('Book', 'Course', 'Article', 'Workshop', 'Other'),  # Allowed learning formats
        default='Course'                                       # Default to course if unspecified
    )

    # --- DYNAMIC LINKING ---
    # Links the study activity to a professional track (e.g., Python, DevOps)
    track = ReferenceField(Category)                           # Reference to the unified Category model

    # --- CONTENT & MEDIA ---
    summary     = StringField()                                # Brief overview of key takeaways
    source_url  = URLField()                                   # Link to the book, repo, or course page
    cover_image = StringField()                                # Thumbnail or book cover URL

    # --- TIMELINE ---
    start_date = DateTimeField(required=True)                  # When the learning activity started
    end_date   = DateTimeField(required=False)                 # When it ended (optional for ongoing reading)

    # --- SKILLS ACQUISITION ---
    # List of skills learned — processed by the master sync signal
    skills_learned = ListField(StringField())                  # Dynamic tags for proficiency tracking

    # --- AUDIT METRICS ---
    created_at   = DateTimeField(default=lambda: datetime.now(timezone.utc))  # Creation timestamp
    last_updated = DateTimeField(default=lambda: datetime.now(timezone.utc))  # Last modification timestamp

    meta = {
        'collection': 'self_study',                            # Database collection name
        'ordering'  : ['-created_at'],                         # Show most recent activities first
        'indexes'   : [
            'profile',                                         # Optimized for per-profile queries
            'title',
            'platform_name',
            'learning_type',
            '-created_at'                                      # Optimized for timeline queries
        ]
    }

    def __str__(self):
        """String representation for the admin interface and debugging."""
        return f"[{self.learning_type}] {self.title} via {self.platform_name}"