from mongoengine import (
    Document, EmbeddedDocument,           # Base classes for documents
    StringField, IntField, DateTimeField,  # Primitive field types
    ReferenceField, ListField,             # Relational and list field types
    EmbeddedDocumentField                  # ✅ For structured nested objects
)
from datetime import datetime, timezone   # Timezone-aware timestamp utilities


# ============================================================
# LAYER 1: EMBEDDED SCHEMA — Keyword Metadata
# ============================================================

class Keyword(EmbeddedDocument):
    """
    Embedded schema representing a single keyword entry within a SkillType.
    Stores the display name, FontAwesome icon class, and brand color.

    Example document:
        {"name": "Python", "icon": "fab fa-python", "color": "#3776ab"}
    """

    name = StringField(required=True)              # Keyword display name — used for token matching
    icon = StringField(default="fas fa-code")      # FontAwesome icon class — used in UI rendering
    color = StringField(default="#000000")          # Brand hex color — used in UI styling


# ============================================================
# LAYER 2: CLASSIFICATION — SkillType
# ============================================================

class SkillType(Document):
    """
    Represents a category that groups related skills together.
    Examples: 'Backend Development', 'DevOps', 'Soft Skills'.

    Each SkillType contains a list of Keyword objects that serve two purposes:
    1. AI/token-based matching to auto-assign skills to this type.
    2. UI metadata (icon + color) for frontend rendering.
    """

    # --- IDENTITY ---
    name = StringField(required=True, unique=True) # Category name — e.g., "Backend Development"

    # --- KEYWORD METADATA ---
    # ✅ CORRECT: Use EmbeddedDocumentField for schema validation and dot-notation access
    # Each keyword entry: {"name": "Python", "icon": "fab fa-python", "color": "#3776ab"}
    keywords = ListField(
        EmbeddedDocumentField(Keyword)             # Enforces Keyword schema on every list entry
    )

    meta = {
        'collection': 'skill_types',               # MongoDB collection name
        'indexes': ['name']                        # Optimized index for category lookup
    }

    def __str__(self):
        """Returns category name for admin dropdowns and log output."""
        return self.name


# ============================================================
# LAYER 3: CORE SKILL — Individual Skill Document
# ============================================================

class Skill(Document):
    """
    Represents a single professional skill with its proficiency level.
    Skills are auto-created from course/project acquired_skills lists via signals.
    Icon and color are resolved at query time from the linked SkillType's keywords.
    """

    # --- IDENTITY ---
    skill_name = StringField(required=True, unique=True)  # Official skill name — e.g., "Python"
    skill_type = ReferenceField(SkillType)                # Link to parent category

    # --- PROFICIENCY ---
    level = IntField(
        default=0,
        min_value=0,
        max_value=100                                     # 0–100 proficiency percentage for progress bars
    )

    # --- UI OVERRIDE (Optional) ---
    # If set, this overrides the icon from the matched SkillType keyword
    skill_icon = StringField()                            # e.g., "fab fa-python" — optional manual override

    # --- AUDIT ---
    last_updated = DateTimeField(
        default=lambda: datetime.now(timezone.utc)        # Timezone-aware UTC timestamp
    )

    meta = {
        'collection': 'skills',                           # MongoDB collection name
        'ordering': ['-level'],                           # Show strongest skills first in UI
        'indexes': ['skill_name', 'level', 'skill_type']  # Optimized for filtering and grouping
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
            return {
                "icon": self.skill_icon,                  # Manual override icon
                "color": "#2563eb"                        # Default brand color when manually set
            }

        # Step 2: Search parent SkillType keywords for a name match
        if self.skill_type and self.skill_type.keywords:
            skill_lower = self.skill_name.lower()         # Normalize for case-insensitive comparison

            for keyword in self.skill_type.keywords:      # keyword is a Keyword EmbeddedDocument
                if keyword.name.lower() == skill_lower:   # ✅ Dot-notation works with EmbeddedDocument
                    return {
                        "icon": keyword.icon,             # Icon from matched keyword
                        "color": keyword.color            # Color from matched keyword
                    }

        # Step 3: Return safe defaults if nothing matched
        return {
            "icon": "fas fa-code",                        # Generic code icon as fallback
            "color": "#64748b"                            # Neutral slate color as fallback
        }

    def __str__(self):
        """Returns skill name and proficiency level for admin and log display."""
        return f"{self.skill_name} ({self.level}%)"