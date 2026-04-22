from mongoengine import Document, StringField, IntField, DateTimeField, ListField, ReferenceField
from datetime import datetime, timezone                        # Standard utilities for time management


class Goal(Document):
    """
    Career Roadmap Goal model.
    Linked to a Profile to scope records to a single portfolio owner.
    Tracks proficiency targets and synchronizes progress based on real-time skill levels.
    """

    # --- OWNERSHIP ---
    # Every goal record belongs to exactly one portfolio profile
    profile = ReferenceField('Profile', required=False)        # FK → Profile (lazy string ref avoids circular import)

    # --- CORE IDENTITY ---
    goal_name = StringField(required=True, unique=True)        # e.g., "Senior Python Developer"
    sub_title = StringField()                                  # e.g., "Mastering Scalable Systems"

    # --- STATUS & PRIORITY ---
    # Helps in filtering goals by importance and progress status
    status   = StringField(
        choices=('Planned', 'In Progress', 'Achieved', 'Paused'),  # Allowed status values
        default='Planned'                                      # Default to planned for new goals
    )
    priority = StringField(
        choices=('Low', 'Medium', 'High', 'Critical'),         # Allowed priority levels
        default='Medium'                                       # Default to medium priority
    )

    # --- TIMELINE & METRICS ---
    target_year   = IntField(required=True)                    # The year to hit this milestone
    target_score  = IntField(default=95)                       # Target proficiency percentage
    current_score = IntField(default=0)                        # Automatically calculated score via RoadmapService

    # --- RELATIONSHIPS ---
    # Skills required to achieve this goal — mapped to Skill names for token matching
    required_skills = ListField(StringField())                 # List of technical skill tags

    # --- SYSTEM METADATA ---
    last_updated = DateTimeField(
        default=lambda: datetime.now(timezone.utc)             # Tracks last modification time
    )

    meta = {
        'collection': 'goals',                                 # Database collection name
        'ordering'  : ['target_year', '-priority'],            # Roadmap order: soonest + highest priority first
        'indexes'   : [
            'profile',                                         # Optimized for per-profile queries
            'goal_name',
            'target_year',
            'status'                                           # Optimized for roadmap filtering
        ]
    }

    def __str__(self):
        """Returns goal name and current progress for admin display."""
        return f"{self.goal_name} ({self.current_score}%)"