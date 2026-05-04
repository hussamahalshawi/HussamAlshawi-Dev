from mongoengine import Document, StringField, BooleanField, DateTimeField, EmailField, ReferenceField
from datetime import datetime, timezone                        # Standard utilities for time management


class Feedback(Document):
    """
    Represents a message submitted by a portfolio visitor via the public contact form.
    No authentication required — open to any visitor.
    Stores only the essential information: identity, professional context, and message.
    Includes admin workflow flags (is_read, is_featured) for portfolio testimonial curation.
    """

    # --- OWNERSHIP ---
    # Every feedback entry is linked to the portfolio profile it was submitted for
    profile = ReferenceField('Profile', required=False)        # FK → Profile (lazy string ref avoids circular import)

    # --- SENDER IDENTITY ---
    sender_name  = StringField(required=True, max_length=100)  # Full name of the visitor
    sender_email = EmailField(required=True)                   # Contact email — format validated by MongoEngine

    # --- PROFESSIONAL CONTEXT ---
    # Optional: helps the portfolio owner understand who is reaching out
    company_name = StringField(max_length=150)                 # Company or organization the sender represents
    job_title    = StringField(max_length=100)                 # Sender's professional title or role

    # --- MESSAGE ---
    message = StringField(required=True)                       # The actual feedback or inquiry text

    # --- ADMIN WORKFLOW FLAGS ---
    is_read     = BooleanField(default=False)                  # True once the admin has reviewed this entry
    is_featured = BooleanField(default=False)                  # True to display this as a public testimonial

    # --- AUDIT METRICS ---
    submitted_at = DateTimeField(default=lambda: datetime.now(timezone.utc))  # Submission timestamp — never modified
    last_updated = DateTimeField(default=lambda: datetime.now(timezone.utc))  # Updated on every admin save

    meta = {
        'collection': 'feedback',                              # MongoDB collection name
        'ordering'  : ['-submitted_at'],                       # Newest entries appear first
        'indexes'   : [
            'profile',                                         # Optimized for per-profile queries
            'is_read',                                         # Fast unread count query
            'is_featured',                                     # Fast featured testimonials query
            '-submitted_at'                                    # Optimized for chronological listing
        ]
    }

    def __str__(self):
        """String representation for the admin interface and debugging."""
        company = f" @ {self.company_name}" if self.company_name else ""  # Optional company suffix
        return f"{self.sender_name}{company}"                  # e.g., "Ahmad Khalid @ Google"