from mongoengine import Document, StringField, IntField, DateTimeField, ListField
from datetime import datetime, timezone  # Standard utilities for time management


class Goal(Document):
    """
    Career Roadmap Goal model.
    Tracks proficiency targets and synchronizes progress based on real-time skill levels.
    """

    # --- CORE IDENTITY ---
    goal_name = StringField(required=True, unique=True)  # e.g., "Senior Python Developer"
    sub_title = StringField()  # e.g., "Mastering Scalable Systems"

    # --- STATUS & PRIORITY ---
    # English Comment: Helps in filtering goals by importance and progress status
    status = StringField(choices=('Planned', 'In Progress', 'Achieved', 'Paused'), default='Planned')
    priority = StringField(choices=('Low', 'Medium', 'High', 'Critical'), default='Medium')

    # --- TIMELINE & METRICS ---
    target_year = IntField(required=True)  # The year you aim to hit this milestone
    target_score = IntField(default=95)  # Target proficiency percentage
    current_score = IntField(default=0)  # Automatically calculated score

    # --- RELATIONSHIPS ---
    # English Comment: Skills required to achieve this goal (Mapped to Skill names)
    required_skills = ListField(StringField())  # List of technical tags

    # --- SYSTEM METADATA ---
    last_updated = DateTimeField(default=lambda: datetime.now(timezone.utc))

    meta = {
        'collection': 'goals',  # Database collection name
        'ordering': ['target_year', '-priority'],  # Roadmap order
        'indexes': ['goal_name', 'target_year', 'status']  # Optimized for roadmap filtering
    }

    def __str__(self):
        return f"{self.goal_name} ({self.current_score}%)"