from mongoengine import Document, StringField, DateTimeField, ListField, ReferenceField, URLField
from datetime import datetime, timezone  # Standard utilities for time management
from App.models.category import Category  # Import Category for classification


class SelfStudy(Document):
    """
    Represents independent learning activities including books, online courses, or articles.
    This model tracks personal growth and serves as evidence of self-driven expertise.
    """

    # --- CORE INFORMATION ---
    title = StringField(required=True)  # Title of the book, course, or article
    platform_name = StringField(required=True)  # e.g., O'Reilly, Coursera, Physical Book

    # --- LEARNING TYPE ---
    # English Comment: Categorizes the source type for specialized UI icons
    learning_type = StringField(choices=('Book', 'Course', 'Article', 'Workshop', 'Other'), default='Course')

    # --- DYNAMIC LINKING ---
    # English Comment: Links the study activity to a professional track (e.g., Python, DevOps)
    track = ReferenceField(Category)  # Reference to the unified Category model

    # --- CONTENT & MEDIA ---
    summary = StringField()  # Brief overview of key takeaways
    source_url = URLField()  # Link to the book, repo, or course page
    cover_image = StringField()  # Thumbnail or book cover URL

    # --- TIMELINE ---
    start_date = DateTimeField(required=True)  # When the learning started
    end_date = DateTimeField(required=False)  # When it ended (optional for ongoing reading)

    # --- SKILLS ACQUISITION ---
    # List of skills learned to be processed by the master sync signal
    skills_learned = ListField(StringField())  # Dynamic tags for proficiency tracking

    # --- AUDIT METRICS ---
    created_at = DateTimeField(default=lambda: datetime.now(timezone.utc))
    last_updated = DateTimeField(default=lambda: datetime.now(timezone.utc))

    meta = {
        'collection': 'self_study',  # Database collection name
        'ordering': ['-created_at'],  # Show most recent activities first
        'indexes': [
            'title',
            'platform_name',
            'learning_type',
            '-created_at'  # Optimized for timeline queries
        ]
    }

    def __str__(self):
        """String representation for the admin interface and debugging."""
        return f"[{self.learning_type}] {self.title} via {self.platform_name}"