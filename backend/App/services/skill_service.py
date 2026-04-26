import logging
from datetime import datetime, timezone
from App.models.skills import Skill, SkillType, ProfileSkill


# -------------------------------------------------------------------------
# SCORE WEIGHTS PER SOURCE MODEL
# These weights determine how much each activity type contributes to a score.
# The score is recalculated from scratch each time — editing a record does
# NOT inflate the score because we never increment, always recalculate.
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
    Skill Service.
    Manages the global Skill dictionary and per-profile scores (ProfileSkill).

    Key design decisions:
    1. Skill documents store NAMES only — no score/level field.
    2. ProfileSkill documents store the score per (profile, skill) pair.
    3. Scores are ALWAYS recalculated from scratch — never incremented.
    4. Deleting any source record (Course, Experience, etc.) triggers a full
       recalculation, which correctly lowers or removes the affected scores.
    5. _cleanup_stale_profile_skills() uses case-insensitive comparison to
       reliably detect skills no longer referenced after a deletion.
    """

    # ------------------------------------------------------------------
    # PUBLIC: Recalculate all ProfileSkill scores for a specific profile
    # ------------------------------------------------------------------

    @staticmethod
    def recalculate_profile_scores(profile):
        """
        Recalculates ALL skill scores for a given profile from scratch.

        Process:
        1. Build a fresh {skill_name: total_score} map from all source records.
        2. Upsert a ProfileSkill document for each skill in the map.
        3. Delete ProfileSkill entries for skills no longer in the map.
           This handles the deletion case — if a Course is deleted and it was
           the only source for a skill, that skill's ProfileSkill is removed.
        4. Re-categorize all global Skill documents.

        Args:
            profile (Profile): The profile document to recalculate scores for.

        Returns:
            int: Number of ProfileSkill documents created or updated.
        """
        if not profile:
            return 0

        try:
            # Step 1: Build fresh score map from current source records only.
            # If a Course was just deleted, its skills will NOT appear here.
            score_map = SkillService._build_score_map(profile)

            # Step 2: Upsert ProfileSkill documents for all skills in the map
            updated_count = 0

            for skill_name, total_score in score_map.items():
                skill_doc = SkillService._get_or_create_skill(skill_name)  # Find or create global Skill

                if not skill_doc:
                    continue                                        # Skip if skill creation failed

                final_score = min(round(total_score), 100)         # Cap score at 100

                profile_skill = ProfileSkill.objects(
                    profile=profile,
                    skill=skill_doc
                ).first()                                          # Check if ProfileSkill already exists

                if profile_skill:
                    if profile_skill.score != final_score:         # Only save if score actually changed
                        profile_skill.score        = final_score
                        profile_skill.last_updated = datetime.now(timezone.utc)
                        profile_skill.save()
                        updated_count += 1
                else:
                    ProfileSkill(                                   # Create new ProfileSkill entry
                        profile      = profile,
                        skill        = skill_doc,
                        score        = final_score,
                        last_updated = datetime.now(timezone.utc)
                    ).save()
                    updated_count += 1

            # Step 3: Remove ProfileSkill entries for skills no longer referenced.
            # This is the critical step that handles deletions correctly —
            # if score_map is empty or missing a skill, its ProfileSkill is deleted.
            SkillService._cleanup_stale_profile_skills(profile, score_map.keys())

            # Step 4: Re-categorize all skills in the global dictionary
            SkillService.bulk_update_categories()

            logging.info(
                f"SkillService: Recalculated scores for profile [{profile.id}] "
                f"— {updated_count} ProfileSkill(s) updated, "
                f"{len(score_map)} active skills."
            )
            return updated_count

        except Exception as e:
            logging.error(
                f"SkillService.recalculate_profile_scores failed: {str(e)}",
                exc_info=True
            )
            return 0

    # ------------------------------------------------------------------
    # PRIVATE: Build score map from all profile-owned source records
    # ------------------------------------------------------------------

    @staticmethod
    def _build_score_map(profile):
        """
        Reads ALL current source records belonging to the profile and builds
        a {skill_name: total_score} dictionary.

        Because this reads the database at call time, a deleted record will
        NOT appear in the results — its skills will not be in the returned map,
        which causes _cleanup_stale_profile_skills() to remove them.

        Skill names are stored with their ORIGINAL casing from the source record.
        Deduplication in _cleanup uses case-insensitive comparison to handle
        variations like 'python' vs 'Python' from different records.

        Args:
            profile (Profile): The target profile to build scores for.

        Returns:
            dict: {skill_name (str): total_score (float)}
        """
        from App.models.course      import Course       # Local import — avoids circular dependency
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

        score_map = {}                                             # {skill_name: accumulated_score}

        for model_class, (field_name, weight) in SOURCE_CONFIG.items():
            records = model_class.objects(profile=profile)         # Only records for THIS profile

            for record in records:
                skill_names = getattr(record, field_name, []) or []

                for raw_name in skill_names:
                    name = raw_name.strip()
                    if not name:
                        continue                                    # Skip empty strings

                    score_map[name] = score_map.get(name, 0) + weight  # Accumulate weight

        return score_map                                           # Empty dict if all records deleted

    # ------------------------------------------------------------------
    # PRIVATE: Ensure the global Skill entry exists
    # ------------------------------------------------------------------

    @staticmethod
    def _get_or_create_skill(skill_name):
        """
        Finds an existing Skill by name (case-insensitive) or creates a new one.

        Args:
            skill_name (str): The raw skill name string.

        Returns:
            Skill | None: The Skill document, or None if creation failed.
        """
        try:
            existing = Skill.objects(skill_name__iexact=skill_name).first()  # Case-insensitive lookup

            if existing:
                return existing                                    # Return existing skill document

            new_skill = Skill(
                skill_name   = skill_name,
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
        Deletes ProfileSkill documents for skills that are no longer present
        in the current score map.

        This is the core fix for the deletion bug:
        - When a Course is deleted, _build_score_map() returns a map without
          that course's skills (if they had no other sources).
        - active_skill_names will be empty or missing those skills.
        - This method finds the corresponding ProfileSkill entries and deletes them.

        Case-insensitive comparison prevents mismatch between 'Python' stored
        in ProfileSkill and 'python' coming from a different source record.

        Args:
            profile            : The target profile.
            active_skill_names : Iterable of skill names currently in the score map.
                                 Pass an empty iterable after full deletion to
                                 remove ALL ProfileSkill entries for the profile.
        """
        # Normalize active names to lowercase set for reliable comparison
        active_lower = {name.lower() for name in active_skill_names}

        # Fetch ALL current ProfileSkill entries for this profile
        existing_profile_skills = ProfileSkill.objects(profile=profile)

        deleted_count = 0

        for ps in existing_profile_skills:
            # Delete orphaned references (skill document was manually removed)
            if not ps.skill:
                ps.delete()
                deleted_count += 1
                logging.info(
                    f"SkillService: Removed orphaned ProfileSkill "
                    f"(no skill reference) for profile [{profile.id}]."
                )
                continue

            skill_name_lower = ps.skill.skill_name.lower()        # Normalize stored name to lowercase

            # If this skill is NOT in the active set, it has no source records —
            # delete its ProfileSkill entry to reflect the deletion
            if skill_name_lower not in active_lower:
                skill_name = ps.skill.skill_name                   # Capture before delete for logging
                ps.delete()
                deleted_count += 1
                logging.info(
                    f"SkillService: Removed stale ProfileSkill "
                    f"'{skill_name}' for profile [{profile.id}] — no source records remain."
                )

        if deleted_count > 0:
            logging.info(
                f"SkillService: Cleanup complete — "
                f"{deleted_count} stale ProfileSkill(s) removed for profile [{profile.id}]."
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
        It runs after every recalculation to keep categorization current.

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

            fallback_type = SkillType.objects(name__iexact='Other technologies').first()  # Default category

            for skill in all_skills:
                skill_tokens = set(skill.skill_name.lower().strip().split())

                best_type  = None
                best_score = 0

                for s_type in all_types:
                    if not s_type.keywords:
                        continue

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