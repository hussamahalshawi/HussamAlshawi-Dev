import logging
from datetime import datetime, timezone
from App.models.skills import Skill, SkillType


# Increment weights per source model — reflects real-world skill value
SKILL_LEVEL_WEIGHTS = {
    'Experience' : 25,   # Real job experience — highest value
    'Project'    : 20,   # Hands-on application
    'Course'     : 15,   # Guided learning
    'Achievement': 12,   # Proven competency
    'SelfStudy'  : 10,   # Self-directed learning
    'Education'  : 8,    # Academic exposure
}


class SkillService:
    """
    Skill Categorization Service:
    - Creates new Skill documents from source model skill lists.
    - Increments skill level based on source model weight.
    - Assigns each Skill to the best-matching SkillType via token matching.
    """

    @staticmethod
    def sync_skills_from_source(skill_names: list, source_model_name: str):
        """
        Accepts a list of skill name strings from a source model and:
        1. Creates the Skill if it doesn't exist (level = starter weight).
        2. Increments the level if it already exists (level += weight, max 100).
        3. Runs bulk categorization to assign skill_type to all skills.

        Args:
            skill_names (list): Raw list of skill name strings from the source.
            source_model_name (str): Class name of the sender e.g. 'Course', 'Project'.
        """
        if not skill_names:                                        # Guard: nothing to process
            return

        # Get the weight for this source — default 10 if unknown
        weight = SKILL_LEVEL_WEIGHTS.get(source_model_name, 10)    # Lookup increment value

        for name in skill_names:
            name = name.strip()                                    # Clean whitespace
            if not name:                                           # Skip empty strings
                continue

            # Case-insensitive lookup to avoid duplicates like "python" vs "Python"
            existing = Skill.objects(skill_name__iexact=name).first()

            if not existing:
                # ✅ First time — create with starter level = weight
                skill = Skill(
                    skill_name   = name,                           # Store with original casing
                    level        = weight,                         # Start at source weight
                    last_updated = datetime.now(timezone.utc)
                )
                skill.save()
                logging.info(f"SkillService: Created '{name}' at level {weight} from {source_model_name}")

            else:
                # ✅ Already exists — increment level, cap at 100
                new_level = min(existing.level + weight, 100)      # Never exceed 100

                if new_level != existing.level:                    # Only save if actually changed
                    existing.level        = new_level
                    existing.last_updated = datetime.now(timezone.utc)
                    existing.save()
                    logging.info(
                        f"SkillService: Updated '{name}' "
                        f"{existing.level - weight}% → {new_level}% from {source_model_name}"
                    )

        # After create/update — assign correct SkillType to all skills
        SkillService.bulk_update_categories()

    @staticmethod
    def _extract_keyword_tokens(skill_type):
        """
        Extracts lowercase word tokens from a SkillType's Keyword EmbeddedDocuments.

        Args:
            skill_type (SkillType): The SkillType to tokenize.

        Returns:
            set: Flat set of lowercase tokens from all keyword names.
        """
        tokens = set()

        for keyword in skill_type.keywords:                        # Iterate EmbeddedDocuments
            if not hasattr(keyword, 'name') or not keyword.name:   # Guard malformed entries
                continue
            tokens.update(keyword.name.lower().strip().split())    # Tokenize keyword name

        return tokens

    @staticmethod
    def bulk_update_categories():
        """
        Assigns each Skill document to the best-matching SkillType
        using token intersection scoring.

        Returns:
            int: Number of skills updated.
        """
        updated_count = 0

        try:
            all_skills = Skill.objects.all()
            all_types  = SkillType.objects.all()

            if not all_types:
                logging.warning("SkillService: No SkillTypes found — categorization skipped.")
                return 0

            fallback_type = SkillType.objects(name__iexact="Other technologies").first()

            for skill in all_skills:
                skill_tokens = set(skill.skill_name.lower().strip().split())

                best_type  = None
                best_score = 0

                for s_type in all_types:
                    if not s_type.keywords:
                        continue

                    type_tokens = SkillService._extract_keyword_tokens(s_type)
                    match_score = len(skill_tokens.intersection(type_tokens))

                    if match_score > best_score:
                        best_score = match_score
                        best_type  = s_type

                final_type = best_type if best_score > 0 else fallback_type

                if final_type and skill.skill_type != final_type:
                    skill.skill_type   = final_type
                    skill.last_updated = datetime.now(timezone.utc)
                    skill.save()
                    updated_count += 1

        except Exception as e:
            logging.error(f"SkillService.bulk_update_categories failed: {str(e)}")
            return 0

        return updated_count