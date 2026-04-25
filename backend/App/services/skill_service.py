import logging
from datetime import datetime, timezone
from App.models.skills import Skill, SkillType, ProfileSkill


# -------------------------------------------------------------------------
# SCORE WEIGHTS PER SOURCE MODEL
# These weights determine how much each activity type contributes to a score.
# The score is recalculated from scratch each time using these weights,
# so editing a record does NOT inflate the score.
# -------------------------------------------------------------------------
SKILL_LEVEL_WEIGHTS = {
    'Experience' : 25,   # Real job experience — highest value
    'Project'    : 20,   # Hands-on project application
    'Course'     : 15,   # Guided structured learning
    'Achievement': 12,   # Proven external validation
    'SelfStudy'  : 10,   # Self-directed learning
    'Education'  : 8,    # Academic theoretical exposure
}


class SkillService:
    """
    Skill Service:
    Manages the global Skill dictionary and per-profile scores (ProfileSkill).

    Key design decisions:
    1. Skill documents store NAMES only — no score/level field.
    2. ProfileSkill documents store the score per (profile, skill) pair.
    3. Scores are ALWAYS recalculated from scratch — never incremented.
       This means editing a course description does not change any score.
    4. Recalculation only reads records that belong to the target profile.
    """

    # ------------------------------------------------------------------
    # PUBLIC: Recalculate all ProfileSkill scores for a specific profile
    # ------------------------------------------------------------------

    @staticmethod
    def recalculate_profile_scores(profile):
        """
        Recalculates ALL skill scores for a given profile from scratch.

        Process:
        1. Collect all skill names mentioned in this profile's records.
        2. For each skill name, sum the weights of all source records that mention it.
        3. Cap the total at 100.
        4. Upsert a ProfileSkill document for each (profile, skill) pair.
        5. Remove ProfileSkill entries for skills no longer referenced.

        Args:
            profile (Profile): The profile document to recalculate scores for.

        Returns:
            int: Number of ProfileSkill documents created or updated.
        """
        if not profile:
            return 0

        try:
            # Step 1: Collect all (skill_name → total_score) for this profile
            score_map = SkillService._build_score_map(profile)

            # Step 2: Upsert ProfileSkill documents for all found skills
            updated_count = 0

            for skill_name, total_score in score_map.items():
                # Find or create the global Skill entry (name dictionary)
                skill_doc = SkillService._get_or_create_skill(skill_name)

                if not skill_doc:
                    continue                                    # Skip if skill creation failed

                # Cap score at 100
                final_score = min(round(total_score), 100)

                # Upsert: update if exists, create if not
                profile_skill = ProfileSkill.objects(
                    profile=profile,
                    skill=skill_doc
                ).first()

                if profile_skill:
                    # Update existing ProfileSkill
                    if profile_skill.score != final_score:     # Only save if score actually changed
                        profile_skill.score        = final_score
                        profile_skill.last_updated = datetime.now(timezone.utc)
                        profile_skill.save()
                        updated_count += 1
                else:
                    # Create new ProfileSkill
                    ProfileSkill(
                        profile      = profile,
                        skill        = skill_doc,
                        score        = final_score,
                        last_updated = datetime.now(timezone.utc)
                    ).save()
                    updated_count += 1

            # Step 3: Remove ProfileSkill entries for skills no longer referenced
            SkillService._cleanup_stale_profile_skills(profile, score_map.keys())

            # Step 4: Re-categorize all skills in the global dictionary
            SkillService.bulk_update_categories()

            logging.info(
                f"SkillService: Recalculated scores for profile [{profile.id}] "
                f"— {updated_count} ProfileSkill(s) updated."
            )
            return updated_count

        except Exception as e:
            logging.error(f"SkillService.recalculate_profile_scores failed: {str(e)}", exc_info=True)
            return 0

    # ------------------------------------------------------------------
    # PRIVATE: Build score map from all profile-owned source records
    # ------------------------------------------------------------------

    @staticmethod
    def _build_score_map(profile):
        """
        Reads all source records belonging to the profile and builds
        a {skill_name: total_score} dictionary.

        Each skill name found in a record contributes its source weight
        to the total. The total reflects the CURRENT state of all records
        — not a running accumulation from previous saves.

        Args:
            profile (Profile): The target profile to build scores for.

        Returns:
            dict: {skill_name (str): total_score (float)}
        """
        # Import here to avoid circular imports at module level
        from App.models.course      import Course
        from App.models.project     import Project
        from App.models.education   import Education
        from App.models.self_study  import SelfStudy
        from App.models.achievement import Achievement
        from App.models.experience  import Experience

        # Map: model class → (skill field name, source weight)
        SOURCE_CONFIG = {
            Experience : ('skills_acquired',    SKILL_LEVEL_WEIGHTS['Experience']),
            Project    : ('skills_used',         SKILL_LEVEL_WEIGHTS['Project']),
            Course     : ('acquired_skills',     SKILL_LEVEL_WEIGHTS['Course']),
            Achievement: ('skills_demonstrated', SKILL_LEVEL_WEIGHTS['Achievement']),
            SelfStudy  : ('skills_learned',      SKILL_LEVEL_WEIGHTS['SelfStudy']),
            Education  : ('skills_learned',      SKILL_LEVEL_WEIGHTS['Education']),
        }

        score_map = {}                                         # {skill_name: accumulated_score}

        for model_class, (field_name, weight) in SOURCE_CONFIG.items():
            # Only read records that belong to THIS profile
            records = model_class.objects(profile=profile)

            for record in records:
                skill_names = getattr(record, field_name, []) or []

                for raw_name in skill_names:
                    name = raw_name.strip()
                    if not name:
                        continue                               # Skip empty strings

                    # Accumulate weight — this represents total exposure to this skill
                    # from all records of this source type
                    score_map[name] = score_map.get(name, 0) + weight

        return score_map

    # ------------------------------------------------------------------
    # PRIVATE: Ensure the global Skill entry exists
    # ------------------------------------------------------------------

    @staticmethod
    def _get_or_create_skill(skill_name):
        """
        Finds an existing Skill by name (case-insensitive) or creates a new one.
        Skill documents store names only — no score or level.

        Args:
            skill_name (str): The raw skill name string.

        Returns:
            Skill | None: The Skill document, or None if creation failed.
        """
        try:
            # Case-insensitive lookup to avoid "python" vs "Python" duplicates
            existing = Skill.objects(skill_name__iexact=skill_name).first()

            if existing:
                return existing                               # Return existing skill

            # Create new entry in the global skill dictionary
            new_skill = Skill(
                skill_name   = skill_name,                   # Store with original casing
                last_updated = datetime.now(timezone.utc)
            )
            new_skill.save()
            logging.info(f"SkillService: Created new global skill '{skill_name}'.")
            return new_skill

        except Exception as e:
            logging.error(f"SkillService._get_or_create_skill('{skill_name}') failed: {str(e)}")
            return None

    # ------------------------------------------------------------------
    # PRIVATE: Remove ProfileSkill entries for skills no longer referenced
    # ------------------------------------------------------------------

    @staticmethod
    def _cleanup_stale_profile_skills(profile, active_skill_names):
        """
        Deletes ProfileSkill documents for skills that are no longer mentioned
        in any of the profile's source records.

        This ensures that removing a skill name from a course also removes
        the corresponding ProfileSkill entry after recalculation.

        Args:
            profile (Profile): The target profile.
            active_skill_names (iterable): Skill names that are currently active.
        """
        # Normalize active names to lowercase for comparison
        active_lower = {name.lower() for name in active_skill_names}

        # Fetch all current ProfileSkill entries for this profile
        existing_profile_skills = ProfileSkill.objects(profile=profile)

        for ps in existing_profile_skills:
            if not ps.skill:
                ps.delete()                                   # Clean up orphaned references
                continue

            if ps.skill.skill_name.lower() not in active_lower:
                ps.delete()                                   # Remove stale skill
                logging.info(
                    f"SkillService: Removed stale ProfileSkill "
                    f"'{ps.skill.skill_name}' for profile [{profile.id}]."
                )

    # ------------------------------------------------------------------
    # PUBLIC: Re-categorize all skills in the global dictionary
    # ------------------------------------------------------------------

    @staticmethod
    def bulk_update_categories():
        """
        Assigns each global Skill document to the best-matching SkillType
        using token intersection scoring.

        This operates on the global Skill dictionary only — not on ProfileSkill.
        It runs after every recalculation to keep categorization fresh.

        Returns:
            int: Number of Skill documents updated.
        """
        updated_count = 0

        try:
            all_skills = Skill.objects.all()
            all_types  = SkillType.objects.all()

            if not all_types:
                logging.warning("SkillService: No SkillTypes found — categorization skipped.")
                return 0

            # Fallback category for unmatched skills
            fallback_type = SkillType.objects(name__iexact='Other technologies').first()

            for skill in all_skills:
                skill_tokens = set(skill.skill_name.lower().strip().split())

                best_type  = None
                best_score = 0

                for s_type in all_types:
                    if not s_type.keywords:
                        continue

                    # Extract tokens from all keyword names in this SkillType
                    type_tokens = set()
                    for keyword in s_type.keywords:
                        if hasattr(keyword, 'name') and keyword.name:
                            type_tokens.update(keyword.name.lower().strip().split())

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