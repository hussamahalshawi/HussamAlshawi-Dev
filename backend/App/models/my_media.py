from datetime import datetime, timezone                        # timezone-aware datetime utilities
from mongoengine import Document, StringField, ListField, DateTimeField, URLField  # MongoDB field types


class MediaVault(Document):
    """
    A unified repository for storing categorized media links.
    Supports bulk storage of image and video URLs returned from Cloudinary.
    All timestamps are timezone-aware UTC to ensure consistency across the system.
    """

    # --- VAULT IDENTITY ---
    vault_name = StringField(required=True, unique=True)       # Unique collection name (e.g., 'Project_Screenshots')
    description = StringField()                                # Optional: explains the purpose of this vault

    # --- MEDIA STORAGE ---
    # Holds 20+ Cloudinary URLs per vault — images or videos in a single flexible list
    media_links = ListField(URLField())                        # Dynamic list of Cloudinary secure URLs

    # --- CONTENT CLASSIFICATION ---
    # Describes the dominant media type stored in this vault for UI filtering
    content_type = StringField(
        choices=('Images', 'Videos', 'Mixed'),                 # Allowed values for dropdown selection
        default='Mixed'                                        # Default: assume mixed content until specified
    )

    # --- AUDIT TRACKING ---
    # ✅ FIX: Use lambda with timezone.utc instead of deprecated datetime.utcnow()
    created_at = DateTimeField(
        default=lambda: datetime.now(timezone.utc)             # Timezone-aware creation timestamp
    )
    last_updated = DateTimeField(
        default=lambda: datetime.now(timezone.utc)             # Timezone-aware last modification timestamp
    )

    meta = {
        'collection': 'media_vaults',                         # MongoDB collection name
        'ordering': ['-created_at'],                          # Sort newest vaults first
        'indexes': ['vault_name']                             # Optimized index for vault name lookups
    }

    def save(self, *args, **kwargs):
        """
        Overrides the default save to refresh last_updated on every write operation.
        Ensures the modification timestamp is always current and timezone-aware.
        """
        # ✅ FIX: timezone-aware UTC instead of deprecated utcnow()
        self.last_updated = datetime.now(timezone.utc)         # Refresh timestamp before every save
        return super(MediaVault, self).save(*args, **kwargs)   # Delegate to MongoEngine's default save