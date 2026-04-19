from mongoengine import Document, StringField, DateTimeField, IntField, ReferenceField, ListField, DictField
from datetime import datetime, timezone  # Standard utilities for time management


# --- CLASSIFICATION LAYER ---
class SkillType(Document):
    """
    Represents the categorization of skills (e.g., Frontend, Backend, Soft Skills).
    Used to group individual skills for better UI/UX filtering in the portfolio.
    """

    # --- IDENTITY ---
    name = StringField(required=True, unique=True)  # e.g., "Web Development"

    # --- UI & SEO ---
    # English Comment: CSS class for Font Awesome icons (e.g., "fas fa-code")
    # keywords = ListField(StringField())  # SEO tags for AI-based skill matching
    """
        Stored as: 
        [
            {"name": "Python", "icon": "fab fa-python", "color": "#3776ab"},
            {"name": "Flask", "icon": "fas fa-flask", "color": "#000000"}
        ]
        """
    keywords = ListField(DictField())


    meta = {
        'collection': 'skill_types',  # Database collection name
        'indexes': ['name']  # Optimized for quick category lookup
    }

    def __str__(self):
        """Official string representation for admin dropdowns."""
        return self.name


# --- CORE DATA LAYER ---
class Skill(Document):
    """
    Core model representing a professional skill and its proficiency level.
    Levels are automatically synchronized via system signals from projects and courses.
    """

    # --- SKILL IDENTITY ---
    skill_name = StringField(required=True, unique=True)  # Official skill name (e.g., Python)
    skill_type = ReferenceField(SkillType)  # Link to the classification layer

    # --- PROFICIENCY METRICS ---
    # Proficiency percentage (0-100), calculated based on proven experience
    level = IntField(default=0, min_value=0, max_value=100)  # Scaled score for UI progress bars

    # --- UI ENHANCEMENT ---
    # English Comment: Specific icon for this skill (e.g., "fab fa-python")
    skill_icon = StringField()  # Dedicated icon for individual skills

    # --- SYSTEM METADATA ---
    # Audit timestamp for tracking synchronization events and manual edits
    last_updated = DateTimeField(default=lambda: datetime.now(timezone.utc))

    meta = {
        'collection': 'skills',  # Database collection name
        'ordering': ['-level'],  # Prioritize strongest skills in the UI
        'indexes': [
            'skill_name',
            'level',
            'skill_type'  # Optimized for grouped skill queries
        ]
    }

    def __str__(self):
        """Returns a readable representation of the skill and its strength."""
        return f"{self.skill_name} ({self.level}%)"