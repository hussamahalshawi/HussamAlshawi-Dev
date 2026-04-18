from mongoengine import Document, StringField, ListField, URLField, DateTimeField, ReferenceField
from datetime import datetime, timezone  # Standard utilities for time management
from App.models.category import Category  # Import Category for dynamic linking


class Project(Document):
    """
    Core model for showcasing technical projects and software engineering work.
    Integrates with the skill-sync system and highlights live deployments.
    """

    # --- IDENTIFICATION ---
    project_name = StringField(required=True, unique=True)  # Official title of the software project

    # --- MISSING FIELD: PROJECT TYPE ---
    # English Comment: Categorizes the technical nature for frontend filtering
    project_type = StringField(choices=('Web App', 'Mobile App', 'Desktop', 'CLI Tool', 'API', 'Library'))

    # --- WEB PRESENCE & DEPLOYMENT ---
    github_url = URLField()  # Link to the source code repository
    # English Comment: The production or staging URL where the project is accessible
    live_url = URLField()  # Added: Live demo for production projects

    # --- DESCRIPTION & ROLE ---
    description = StringField(required=True)  # Detailed technical breakdown
    # English Comment: Clarifies personal contribution if it was a team project
    my_role = StringField()  # e.g., "Lead Backend Developer"

    # --- CATEGORIZATION ---
    category = ReferenceField(Category)  # Linked to unified Category system

    # --- MEDIA ASSETS ---
    project_images = ListField(StringField())  # Array of screenshots from Cloudinary
    project_video = StringField()  # URL for a video demo or walkthrough

    # --- PROJECT TIMELINE ---
    start_date = DateTimeField(required=True)  # Development commencement date
    end_date = DateTimeField()  # Completion date (null if ongoing)

    # --- TECH STACK & AUTOMATION ---
    # These tags are processed by signals to update proficiency metrics
    skills_used = ListField(StringField())  # The tech stack used (e.g., Flask, React)

    # --- AUDIT METRICS ---
    last_updated = DateTimeField(default=lambda: datetime.now(timezone.utc))

    meta = {
        'collection': 'projects',  # Database collection name
        'ordering': ['-end_date', '-last_updated'],  # Sort by completion date
        'indexes': [
            'project_name',
            'project_type',
            '-last_updated'  # Performance optimization for listing
        ]
    }

    def __str__(self):
        """Official string representation for admin logs and dropdowns."""
        return self.project_name  # Returns project name