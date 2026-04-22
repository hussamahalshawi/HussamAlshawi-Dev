from mongoengine import Document, StringField, ListField, URLField, DateTimeField, ReferenceField
from datetime import datetime, timezone                        # Standard utilities for time management
from App.models.category import Category                       # Import Category for dynamic linking


class Project(Document):
    """
    Core model for showcasing technical projects and software engineering work.
    Linked to a Profile to scope records to a single portfolio owner.
    Integrates with the skill-sync system and highlights live deployments.
    """

    # --- OWNERSHIP ---
    # Every project record belongs to exactly one portfolio profile
    profile = ReferenceField('Profile', required=False)        # FK → Profile (lazy string ref avoids circular import)

    # --- IDENTIFICATION ---
    project_name = StringField(required=True, unique=True)     # Official title of the software project

    # --- PROJECT TYPE ---
    # Categorizes the technical nature for frontend filtering
    project_type = StringField(
        choices=('Web App', 'Mobile App', 'Desktop', 'CLI Tool', 'API', 'Library')  # Allowed project types
    )

    # --- WEB PRESENCE & DEPLOYMENT ---
    github_url = URLField()                                    # Link to the source code repository
    live_url   = URLField()                                    # Live demo URL for production projects

    # --- DESCRIPTION & ROLE ---
    description = StringField(required=True)                   # Detailed technical breakdown of the project
    my_role     = StringField()                                # Personal contribution (e.g., "Lead Backend Developer")

    # --- CATEGORIZATION ---
    category = ReferenceField(Category)                        # Linked to the unified Category system

    # --- MEDIA ASSETS ---
    project_images = ListField(StringField())                  # Array of screenshot URLs from Cloudinary
    project_video  = StringField()                             # URL for a video demo or walkthrough

    # --- PROJECT TIMELINE ---
    start_date = DateTimeField(required=True)                  # Development commencement date
    end_date   = DateTimeField()                               # Completion date (null if ongoing)

    # --- TECH STACK & AUTOMATION ---
    # These tags are processed by signals to update proficiency metrics
    skills_used = ListField(StringField())                     # The tech stack used (e.g., Flask, React)

    # --- AUDIT METRICS ---
    last_updated = DateTimeField(
        default=lambda: datetime.now(timezone.utc)             # Refresh on every save
    )

    meta = {
        'collection': 'projects',                              # Database collection name
        'ordering'  : ['-end_date', '-last_updated'],          # Sort by completion date
        'indexes'   : [
            'profile',                                         # Optimized for per-profile queries
            'project_name',
            'project_type',
            '-last_updated'                                    # Performance optimization for listing
        ]
    }

    def __str__(self):
        """Official string representation for admin logs and dropdowns."""
        return self.project_name                               # Returns project name