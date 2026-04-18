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

    def sync_progress(self):
        """
        Advanced Logic: Calculates goal progress based on current skill levels.
        """
        from App.models.skills import Skill  # Local import to avoid circular dependency

        if not self.required_skills:
            self.current_score = 0
            return 0

        total_progress = 0.0
        weight_per_skill = 100.0 / len(self.required_skills)

        for skill_query in self.required_skills:
            query_tokens = set(skill_query.lower().split())
            matched_levels = []

            # English Comment: Fetch all skills once if performance is an issue in large datasets
            all_skills = Skill.objects.all()
            for skill_obj in all_skills:
                skill_tokens = set(skill_obj.skill_name.lower().split())
                if query_tokens.intersection(skill_tokens):
                    matched_levels.append(skill_obj.level)

            if matched_levels:
                avg_level = sum(matched_levels) / len(matched_levels)
                total_progress += (avg_level / 100.0) * weight_per_skill

        # Final score calculation capped by target_score
        self.current_score = min(round(total_progress), self.target_score)
        self.last_updated = datetime.now(timezone.utc)

        # English Comment: Automatically mark as Achieved if score hits target
        if self.current_score >= self.target_score:
            self.status = 'Achieved'

        return self.current_score

    def __str__(self):
        return f"{self.goal_name} ({self.current_score}%)"