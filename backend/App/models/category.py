from mongoengine import Document, StringField, DateTimeField     # Database field types for MongoDB
from datetime import datetime, timezone                          # Standard utilities for time management

class Category(Document):
    """
    A unified model for all types of classifications (Study Tracks, Project Categories, etc.).
    This keeps the code clean and centralizes category management across the portfolio.
    """

    # --- CATEGORY IDENTITY ---
    name = StringField(required=True, unique=True)               # Unique identifier for the category
    description = StringField()                                  # Brief summary explaining the category purpose

    # --- SYSTEM METADATA ---
    # Tracks the exact moment this category was created
    created_at = DateTimeField(default=lambda: datetime.now(timezone.utc))

    meta = {
        'collection': 'categories',                              # Database collection name
        'ordering': ['name'],                                    # Alphabetical sorting by default
        'indexes': [
            'name'                                               # Optimized for quick category lookup
        ]
    }

    def __str__(self):
        """Returns the official string representation of the category."""
        return self.name              # Display name in admin and logs