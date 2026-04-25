from mongoengine import (
    Document, EmbeddedDocument,
    StringField, IntField, DateTimeField,
    ReferenceField, ListField, EmbeddedDocumentField
)
from datetime import datetime, timezone


# ============================================================
# LAYER 1: EMBEDDED SCHEMA — Keyword Metadata (for SkillType UI)
# ============================================================

class Keyword(EmbeddedDocument):
    """
    Embedded keyword entry inside a SkillType document.
    Stores display name, FontAwesome icon class, and brand color.
    Used for: token-based skill matching + frontend UI rendering.

    Example: {"name": "Python", "icon": "fab fa-python", "color": "#3776ab"}
    """
    name  = StringField(required=True)             # Keyword display name — used for token matching
    icon  = StringField(default='fas fa-code')     # FontAwesome class — used in UI rendering
    color = StringField(default='#000000')         # Hex brand color — used in UI styling


# ============================================================
# LAYER 2: CLASSIFICATION — SkillType (shared, global)
# ============================================================

class SkillType(Document):
    """
    Represents a shared global category that groups related skills.
    Examples: 'Backend Development', 'DevOps', 'Soft Skills'.

    SkillType is NOT profile-specific — it is a global taxonomy shared
    across all profiles. Each entry contains keyword metadata for
    auto-categorization and frontend rendering.
    """

    # --- IDENTITY ---
    name = StringField(required=True, unique=True) # Category name — e.g., "Backend Development"

    # --- KEYWORD METADATA ---
    # Each keyword: {"name": "Python", "icon": "fab fa-python", "color": "#3776ab"}
    keywords = ListField(
        EmbeddedDocumentField(Keyword)             # Enforces Keyword schema on every entry
    )

    meta = {
        'collection': 'skill_types',               # MongoDB collection name
        'indexes'   : ['name']                     # Optimized index for category lookup
    }

    def __str__(self):
        """Returns category name for admin dropdowns and log output."""
        return self.name


# ============================================================
# LAYER 3: SKILL — Shared global skill dictionary (names only)
# ============================================================

class Skill(Document):
    """
    Represents a skill NAME in the global shared dictionary.
    This document does NOT store any score or level.

    The score/level is stored separately in ProfileSkill, scoped
    to each profile. This ensures:
    - Skill names are defined once (no duplication)
    - Each profile has independent scores for the same skill
    - Editing a course does NOT inflate anyone's score

    Icon and color are resolved from the linked SkillType keywords.
    """

    # --- IDENTITY ---
    skill_name = StringField(required=True, unique=True)  # Official skill name — e.g., "Python"
    skill_type = ReferenceField(SkillType)                # Link to parent category for grouping

    # --- UI OVERRIDE (Optional) ---
    # If set, overrides the icon resolved from the linked SkillType keyword
    skill_icon = StringField()                            # e.g., "fab fa-python" — manual override

    # --- AUDIT ---
    last_updated = DateTimeField(
        default=lambda: datetime.now(timezone.utc)        # Timezone-aware UTC timestamp
    )

    meta = {
        'collection': 'skills',                           # MongoDB collection name
        'ordering'  : ['skill_name'],                     # Alphabetical order in admin
        'indexes'   : ['skill_name', 'skill_type']        # Optimized for filtering and grouping
    }

    def get_display_meta(self):
        """
        Resolves the icon and color for this skill from its parent SkillType keywords.
        Falls back to defaults if no matching keyword is found.

        Returns:
            dict: {"icon": "fab fa-python", "color": "#3776ab"}
        """
        # Step 1: Use manual override if set directly on the skill
        if self.skill_icon:
            return {'icon': self.skill_icon, 'color': '#2563eb'}

        # Step 2: Search parent SkillType keywords for a name match
        if self.skill_type and self.skill_type.keywords:
            skill_lower = self.skill_name.lower()

            for keyword in self.skill_type.keywords:
                if keyword.name.lower() == skill_lower:
                    return {'icon': keyword.icon, 'color': keyword.color}

        # Step 3: Safe defaults if nothing matched
        return {'icon': 'fas fa-code', 'color': '#64748b'}

    def __str__(self):
        """Returns skill name for admin dropdowns and log display."""
        return self.skill_name


# ============================================================
# LAYER 4: PROFILE SKILL — Per-profile score (the key addition)
# ============================================================

class ProfileSkill(Document):
    """
    Stores the calculated proficiency score for a specific skill
    scoped to a specific profile.

    This is the JOIN TABLE between Profile and Skill.
    It replaces the old 'level' field that was stored directly on Skill.

    Design principles:
    - score is ALWAYS recalculated from scratch (never incremented)
    - recalculation reads only the records belonging to THIS profile
    - editing any record triggers a full recalculate, not an increment
    - this prevents score inflation on every save

    Example:
        Profile(hussam) → ProfileSkill(Python, score=75)
        Profile(other)  → ProfileSkill(Python, score=30)
    """

    # --- OWNERSHIP (the two sides of the join) ---
    profile = ReferenceField('Profile', required=True)    # Which portfolio owner
    skill   = ReferenceField(Skill,     required=True)    # Which skill (from global dictionary)

    # --- SCORE ---
    # Recalculated from scratch on every sync — never incremented directly
    score = IntField(default=0, min_value=0, max_value=100)  # 0–100 proficiency percentage

    # --- AUDIT ---
    last_updated = DateTimeField(
        default=lambda: datetime.now(timezone.utc)        # Timezone-aware UTC timestamp
    )

    meta = {
        'collection': 'profile_skills',                   # MongoDB collection name
        'ordering'  : ['-score'],                         # Show strongest skills first
        'indexes'   : [
            ('profile', 'skill'),                         # Compound index — fast per-profile skill lookup
            'profile',                                    # For fetching all skills of a profile
            'skill'                                       # For fetching all profiles that have a skill
        ]
    }

    def __str__(self):
        """Returns a readable representation for admin logs."""
        profile_name = self.profile.full_name if self.profile else 'Unknown'
        skill_name   = self.skill.skill_name  if self.skill   else 'Unknown'
        return f"{profile_name} → {skill_name} ({self.score}%)"