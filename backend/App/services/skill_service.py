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

            # Step 2: Upsert ProfileSkill documents for all skills in the map.
            # Uses update_one() / direct insert instead of .save() to avoid
            # triggering the post_save signal on ProfileSkill which would cause
            # a secondary recalculation loop before this one finishes.
            updated_count = 0
            now           = datetime.now(timezone.utc)             # Single timestamp for the whole batch

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
                    if profile_skill.score != final_score:         # Only write if score actually changed
                        # update_one() writes directly to MongoDB — no signals fired
                        ProfileSkill.objects(id=profile_skill.id).update_one(
                            __raw__={'$set': {'score': final_score, 'last_updated': now}}
                        )
                        updated_count += 1
                else:
                    # Create new ProfileSkill using insert — bypasses post_save signal
                    new_ps = ProfileSkill(
                        profile      = profile,
                        skill        = skill_doc,
                        score        = final_score,
                        last_updated = now
                    )
                    new_ps.save()                                  # save() needed here to get an id assigned
                    updated_count += 1

            # Step 3: Remove ProfileSkill entries for skills no longer referenced.
            SkillService._cleanup_stale_profile_skills(profile, score_map.keys())

            # Step 4: Re-categorize all global Skill documents (uses update_one — no signals).
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

        Applies aggressive name sanitization to handle dirty data from the admin
        form — trailing Arabic commas (٫), Western commas (,), dots, semicolons,
        and extra whitespace are all stripped before the name is stored.

        Args:
            profile (Profile): The target profile to build scores for.

        Returns:
            dict: {skill_name (str): total_score (float)}
        """
        import re                                                      # Regex for character stripping

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

        score_map = {}                                                 # {skill_name: accumulated_score}

        for model_class, (field_name, weight) in SOURCE_CONFIG.items():
            records = model_class.objects(profile=profile)             # Only records for THIS profile

            for record in records:
                skill_names = getattr(record, field_name, []) or []

                for raw_name in skill_names:
                    if not raw_name:
                        continue                                        # Skip None or empty

                    # Remove trailing/leading: whitespace, commas (EN+AR), dots, semicolons
                    # \u060c = Arabic comma ، | \u066b = Arabic decimal separator ٫
                    name = re.sub(r'[\s,،\u060c\u066b.;]+$', '', raw_name)  # Strip trailing garbage
                    name = re.sub(r'^[\s,،\u060c\u066b.;]+', '', name)      # Strip leading garbage
                    name = ' '.join(name.split())                       # Collapse internal whitespace

                    if not name:
                        continue                                        # Skip if nothing left after clean

                    score_map[name] = score_map.get(name, 0) + weight  # Accumulate weight

        return score_map

    # ------------------------------------------------------------------
    # PRIVATE: Ensure the global Skill entry exists
    # ------------------------------------------------------------------

    @staticmethod
    def _get_or_create_skill(skill_name):
        """
        Finds an existing Skill by name (case-insensitive) or creates a new one.

        Uses mongoengine.signals.post_save.disconnect / reconnect pattern to
        create the Skill document without firing any signals. This prevents the
        Skill save from launching a second full recalculation pipeline while
        the first one is still running — which was causing the infinite loading bug.

        Resolution priority for icon:
            1. Exact keyword name match inside any SkillType      → use that keyword icon
            2. Token intersection match (partial word overlap)    → use best matched keyword icon
            3. No match found                                     → skill_icon left empty

        Args:
            skill_name (str): The raw skill name string.

        Returns:
            Skill | None: The Skill document, or None if creation failed.
        """
        try:
            existing = Skill.objects(skill_name__iexact=skill_name).first()  # Case-insensitive lookup

            if existing:
                return existing                                    # Return existing — no action needed

            # Resolve SkillType and icon before writing to DB
            resolved_type, resolved_icon = SkillService._resolve_type_and_icon(skill_name)

            new_skill = Skill(
                skill_name   = skill_name,                         # Original casing preserved
                skill_type   = resolved_type,                      # Best matching SkillType or None
                skill_icon   = resolved_icon,                      # Icon from matched keyword or empty
                last_updated = datetime.now(timezone.utc)
            )

            # Disconnect the sync signal from Skill before saving to prevent
            # master_sync_signal() from firing and starting a second pipeline.
            # The signal is reconnected in the finally block to restore normal behavior.
            from mongoengine import signals as me_signals           # Local import to avoid circular refs
            from App.utils.signals import master_sync_signal        # The handler to temporarily disconnect

            me_signals.post_save.disconnect(master_sync_signal, sender=Skill)  # Pause signal

            try:
                new_skill.save()                                   # Save without triggering pipeline
            finally:
                me_signals.post_save.connect(master_sync_signal, sender=Skill)  # Always restore signal

            logging.info(
                f"SkillService: Created skill '{skill_name}' "
                f"— type='{resolved_type.name if resolved_type else 'None'}' "
                f"— icon='{resolved_icon or 'none'}'."
            )
            return new_skill

        except Exception as e:
            logging.error(f"SkillService._get_or_create_skill('{skill_name}') failed: {str(e)}")
            return None

    # ------------------------------------------------------------------
    # PRIVATE: Resolve the best SkillType and icon for a skill name
    # ------------------------------------------------------------------

    @staticmethod
    def _resolve_type_and_icon(skill_name):
        """
        Searches all SkillType keywords to find the best match for the given
        skill name and returns both the SkillType document and the icon string.

        Matching strategy:
            Step 1 — Exact match: keyword.name.lower() == skill_name.lower()
                     Returns immediately with the exact keyword icon.
            Step 2 — Token intersection: counts overlapping words between
                     the skill name tokens and all keyword name tokens inside
                     each SkillType. The SkillType with the highest overlap wins.
                     Then searches that SkillType's keywords for the single
                     keyword with the highest individual token overlap to get
                     its icon.
            Step 3 — No match: returns (fallback_type, '') so skill_icon stays
                     empty and get_display_meta() falls back to 'fas fa-code'.

        Args:
            skill_name (str): The skill name to resolve.

        Returns:
            tuple: (SkillType | None, str) — the best SkillType and icon string.
        """
        all_types     = list(SkillType.objects.all())              # Fetch all SkillType documents once
        skill_lower   = skill_name.lower().strip()                 # Normalize skill name to lowercase
        skill_tokens  = set(skill_lower.split())                   # Tokenize for partial matching

        fallback_type = next(                                      # Fallback for unmatched skills
            (t for t in all_types if t.name.lower() == 'other technologies'),
            None
        )

        best_type       = None                                     # Best matching SkillType
        best_type_score = 0                                        # Highest token overlap score
        best_icon       = ''                                       # Icon from the best matched keyword

        for s_type in all_types:
            if not s_type.keywords:
                continue                                           # Skip types with no keywords

            for keyword in s_type.keywords:
                if not keyword.name:
                    continue                                       # Skip empty keyword entries

                keyword_lower = keyword.name.lower().strip()       # Normalize keyword to lowercase

                # --- Step 1: Exact match — highest priority ---
                if keyword_lower == skill_lower:
                    logging.debug(
                        f"SkillService._resolve_type_and_icon: "
                        f"exact match '{skill_name}' → type='{s_type.name}' icon='{keyword.icon}'"
                    )
                    return s_type, keyword.icon                    # Return immediately on exact match

                # --- Step 2: Token intersection scoring ---
                keyword_tokens  = set(keyword_lower.split())       # Tokenize keyword name
                overlap         = len(skill_tokens.intersection(keyword_tokens))  # Count shared tokens

                if overlap > best_type_score:
                    best_type_score = overlap                      # Update best score
                    best_type       = s_type                       # Update best type
                    best_icon       = keyword.icon                 # Copy icon from this keyword

        # Step 3: Return best token-intersection result or fallback
        if best_type_score > 0:
            logging.debug(
                f"SkillService._resolve_type_and_icon: "
                f"token match '{skill_name}' (score={best_type_score}) "
                f"→ type='{best_type.name}' icon='{best_icon}'"
            )
            return best_type, best_icon                            # Return best partial match with icon

        logging.debug(
            f"SkillService._resolve_type_and_icon: "
            f"no match for '{skill_name}' — using fallback type."
        )
        return fallback_type, ''                                   # No match — fallback type, no icon

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
        and syncs the skill_icon from the matched keyword.

        Uses update_one() with __raw__ MongoDB update instead of skill.save()
        to bypass MongoEngine signals entirely. Calling skill.save() here would
        fire the post_save signal on Skill, which triggers recalculate_profile_scores()
        again before the current call finishes — causing the 0 updated count bug.

        Returns:
            int: Number of Skill documents updated.
        """
        updated_count = 0

        try:
            all_skills = list(Skill.objects.all())                 # Materialize to plain list — no live cursor

            if not all_skills:
                return 0                                           # Nothing to process

            now = datetime.now(timezone.utc)                       # Single timestamp for the whole batch

            for skill in all_skills:
                # Resolve the best SkillType and icon using the shared helper
                resolved_type, resolved_icon = SkillService._resolve_type_and_icon(skill.skill_name)

                type_changed = resolved_type and skill.skill_type != resolved_type   # SkillType changed
                icon_changed = resolved_icon and skill.skill_icon != resolved_icon   # Icon changed

                if not (type_changed or icon_changed):
                    continue                                        # Nothing to update — skip this skill

                # Build the MongoDB $set payload with only changed fields
                update_fields = {'last_updated': now}              # Always refresh timestamp

                if type_changed:
                    update_fields['skill_type'] = resolved_type.id  # Store ObjectId reference

                if icon_changed:
                    update_fields['skill_icon'] = resolved_icon     # Store icon string directly

                # Use update_one() with __raw__ to write directly to MongoDB
                # without triggering any MongoEngine pre_save / post_save signals
                Skill.objects(id=skill.id).update_one(__raw__={'$set': update_fields})

                updated_count += 1

                logging.info(
                    f"SkillService.bulk_update_categories: updated '{skill.skill_name}' "
                    f"— type='{resolved_type.name if resolved_type else 'None'}' "
                    f"— icon='{resolved_icon or 'none'}'."
                )

        except Exception as e:
            logging.error(f"SkillService.bulk_update_categories failed: {str(e)}")
            return 0

        return updated_count