import datetime
from mongoengine import Document, StringField, ListField, DateTimeField, URLField, StringField

class MediaVault(Document):
    """
    A unified repository for storing categorized media links.
    Supports bulk storage of image and video URLs returned from Cloudinary.
    """
    # English Comment: Categorize the media (e.g., 'Project_Demo_Videos', 'Certificates_Images')
    vault_name = StringField(required=True, unique=True)
    description = StringField()

    # English Comment: Dynamic list to store multiple URLs (Images or Videos)
    # As per your request, this can hold 20+ links in a single field
    media_links = ListField(URLField())

    # English Comment: Meta information to track the type of content in this vault
    content_type = StringField(choices=('Images', 'Videos', 'Mixed'), default='Mixed')

    # --- TRACKING ---
    created_at = DateTimeField(default=datetime.datetime.utcnow)
    last_updated = DateTimeField(default=datetime.datetime.utcnow)

    meta = {
        'collection': 'media_vaults',
        'ordering': ['-created_at'],
        'indexes': ['vault_name']
    }

    def save(self, *args, **kwargs):
        # English Comment: Ensure the update timestamp is refreshed on every save
        self.last_updated = datetime.datetime.utcnow()
        return super(MediaVault, self).save(*args, **kwargs)