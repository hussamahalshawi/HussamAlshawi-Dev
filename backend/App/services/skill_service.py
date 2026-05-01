import logging
import re
from datetime import datetime, timezone
from App.models.skills import Skill, SkillType, ProfileSkill


# -------------------------------------------------------------------------
# SCORE WEIGHTS PER SOURCE MODEL
# -------------------------------------------------------------------------
SKILL_LEVEL_WEIGHTS = {
    'Experience' : 25,
    'Project'    : 20,
    'Course'     : 15,
    'Achievement': 12,
    'SelfStudy'  : 10,
    'Education'  : 8,
}


class SkillService:
    """
    Skill Service — manages global Skill dictionary and per-profile scores.

    Normalization contract:
        Every skill name is stored in Title Case (e.g., "Machine Learning").
        All lookups use case-insensitive matching.
        Duplicates are merged before any write operation.
    """

    # ------------------------------------------------------------------
    # PUBLIC: Deduplicate existing Skill documents (run once to fix DB)
    # ------------------------------------------------------------------

    @staticmethod
    def deduplicate_skills():
        """
        Finds and merges duplicate Skill documents caused by case variations.
        For each group of duplicates, keeps the Title Case version and
        migrates all ProfileSkill references to the surviving document.

        Returns:
            int: Number of duplicate Skill documents removed.
        """
        all_skills    = list(Skill.objects.all())                      # Fetch all skills once
        seen          = {}                                             # {normalized_name: canonical_skill}
        duplicates    = []                                             # Skills to remove

        for skill in all_skills:
            key = skill.skill_name.strip().lower()                     # Normalize key for comparison

            if key in seen:
                duplicates.append((skill, seen[key]))                  # (duplicate, canonical)
            else:
                seen[key] = skill                                      # First occurrence = canonical

        removed_count = 0

        for duplicate, canonical in duplicates:
            try:
                # Migrate all ProfileSkill references from duplicate → canonical
                ProfileSkill.objects(skill=duplicate).update(
                    __raw__={'$set': {'skill': canonical.id}}          # Point to canonical skill
                )

                logging.info(
                    f"SkillService.deduplicate: merged '{duplicate.skill_name}' "
                    f"→ '{canonical.skill_name}'"
                )

                duplicate.delete()                                     # Remove the duplicate
                removed_count += 1

            except Exception as e:
                logging.error(
                    f"SkillService.deduplicate: failed to merge "
                    f"'{duplicate.skill_name}': {str(e)}"
                )

        # After merge, there may be duplicate ProfileSkills pointing to same (profile, skill)
        # Clean those up too
        SkillService._deduplicate_profile_skills()

        logging.info(f"SkillService.deduplicate: removed {removed_count} duplicate Skill documents.")
        return removed_count

    @staticmethod
    def _deduplicate_profile_skills():
        """
        After skill deduplication, some profiles may have two ProfileSkill
        documents for the same (profile, skill) pair.
        Keeps the one with the higher score and deletes the rest.
        """
        all_ps    = list(ProfileSkill.objects.all())                   # Fetch all ProfileSkill docs
        seen_pairs = {}                                                # {(profile_id, skill_id): ps}

        for ps in all_ps:
            if not ps.profile or not ps.skill:
                ps.delete()                                            # Remove orphaned references
                continue

            pair = (str(ps.profile.id), str(ps.skill.id))             # Unique pair key

            if pair in seen_pairs:
                existing = seen_pairs[pair]

                # Keep the higher score, delete the lower
                if ps.score >= existing.score:
                    existing.delete()                                  # Delete old lower score
                    seen_pairs[pair] = ps                              # Replace with higher
                else:
                    ps.delete()                                        # Delete new lower score

                logging.info(
                    f"SkillService: Removed duplicate ProfileSkill "
                    f"for skill [{ps.skill.skill_name}]"
                )
            else:
                seen_pairs[pair] = ps                                  # First occurrence — keep

    # ------------------------------------------------------------------
    # PUBLIC: Recalculate all ProfileSkill scores for a specific profile
    # ------------------------------------------------------------------

    @staticmethod
    def recalculate_profile_scores(profile):
        """
        Recalculates ALL skill scores for a given profile from scratch.

        Process:
        1. Build fresh {normalized_name: total_score} map from all source records.
        2. Fetch all existing ProfileSkill docs in ONE query.
        3. Upsert only changed scores.
        4. Delete stale ProfileSkill entries using pre-fetched map.
        5. Re-categorize all global Skill documents.

        Args:
            profile: The Profile document to recalculate scores for.

        Returns:
            int: Number of ProfileSkill documents created or updated.
        """
        if not profile:
            return 0

        try:
            # Step 1: Build score map — all calculation in memory first
            score_map = SkillService._build_score_map(profile)
            now       = datetime.now(timezone.utc)
            updated_count = 0

            # Step 2: Fetch all existing ProfileSkill in ONE query
            # Map: {skill_name_lower: ProfileSkill}
            existing_ps_map = {}

            for ps in ProfileSkill.objects(profile=profile).select_related():
                if ps.skill:
                    key = ps.skill.skill_name.strip().lower()
                    if key in existing_ps_map:
                        # Duplicate found — keep higher score, delete lower
                        existing = existing_ps_map[key]
                        if ps.score >= existing.score:
                            existing.delete()
                            existing_ps_map[key] = ps
                        else:
                            ps.delete()
                    else:
                        existing_ps_map[key] = ps

            # Step 3: Upsert scores
            active_keys = set()                                        # Track processed skills

            for skill_name, total_score in score_map.items():
                normalized = SkillService._normalize_name(skill_name)  # Title Case
                key        = normalized.lower()                        # Lookup key
                final_score = min(round(total_score), 100)             # Cap at 100
                active_keys.add(key)

                skill_doc = SkillService._get_or_create_skill(normalized)  # Find or create

                if not skill_doc:
                    continue

                if key in existing_ps_map:
                    existing_ps = existing_ps_map[key]

                    if existing_ps.score != final_score:               # Only write if changed
                        ProfileSkill.objects(id=existing_ps.id).update_one(
                            __raw__={'$set': {
                                'score'       : final_score,
                                'last_updated': now
                            }}
                        )
                        updated_count += 1
                else:
                    # Create new ProfileSkill
                    new_ps = ProfileSkill(
                        profile      = profile,
                        skill        = skill_doc,
                        score        = final_score,
                        last_updated = now
                    )
                    new_ps.save()
                    updated_count += 1

            # Step 4: Remove stale ProfileSkill entries
            deleted_count = 0

            for key, ps in existing_ps_map.items():
                if key not in active_keys:
                    skill_name = ps.skill.skill_name if ps.skill else key
                    ps.delete()
                    deleted_count += 1
                    logging.info(
                        f"SkillService: Removed stale ProfileSkill "
                        f"'{skill_name}' for profile [{profile.id}]."
                    )

            # Step 5: Re-categorize global Skill documents
            SkillService.bulk_update_categories()

            logging.info(
                f"SkillService: Recalculated profile [{profile.id}] "
                f"— {updated_count} updated, {deleted_count} removed, "
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
    # PRIVATE: Normalize skill name to Title Case
    # ------------------------------------------------------------------

    @staticmethod
    def _normalize_name(raw_name):
        """
        Normalizes a skill name to Title Case after stripping garbage characters.
        Ensures 'python', 'PYTHON', 'Python ' all become 'Python'.

        Args:
            raw_name (str): Raw skill name from any source.

        Returns:
            str: Normalized Title Case skill name, or empty string if invalid.
        """
        if not raw_name:
            return ''

        # Strip trailing/leading garbage: commas, Arabic punctuation, dots, spaces
        name = re.sub(r'[\s,،\u060c\u066b.;]+$', '', str(raw_name))   # Remove from end
        name = re.sub(r'^[\s,،\u060c\u066b.;]+', '', name)             # Remove from start
        name = ' '.join(name.split())                                  # Collapse internal spaces

        return name.title() if name else ''                            # Title Case

    # ------------------------------------------------------------------
    # PRIVATE: Build score map from all source records
    # ------------------------------------------------------------------

    @staticmethod
    def _build_score_map(profile):
        """
        Reads all source records for the profile and builds
        {normalized_skill_name: total_score} in memory.

        All skill names are normalized to Title Case before accumulation
        so 'python' and 'Python' map to the same key 'Python'.

        Args:
            profile: The target profile.

        Returns:
            dict: {skill_name_title_case: accumulated_score}
        """
        from App.models.course      import Course
        from App.models.project     import Project
        from App.models.education   import Education
        from App.models.self_study  import SelfStudy
        from App.models.achievement import Achievement
        from App.models.experience  import Experience

        SOURCE_CONFIG = {
            Experience : ('skills_acquired',    SKILL_LEVEL_WEIGHTS['Experience']),
            Project    : ('skills_used',         SKILL_LEVEL_WEIGHTS['Project']),
            Course     : ('acquired_skills',     SKILL_LEVEL_WEIGHTS['Course']),
            Achievement: ('skills_demonstrated', SKILL_LEVEL_WEIGHTS['Achievement']),
            SelfStudy  : ('skills_learned',      SKILL_LEVEL_WEIGHTS['SelfStudy']),
            Education  : ('skills_learned',      SKILL_LEVEL_WEIGHTS['Education']),
        }

        score_map = {}                                                 # {title_case_name: score}

        for model_class, (field_name, weight) in SOURCE_CONFIG.items():
            records = model_class.objects(profile=profile)             # Profile-scoped query

            for record in records:
                skill_names = getattr(record, field_name, []) or []

                for raw_name in skill_names:
                    normalized = SkillService._normalize_name(raw_name)

                    if not normalized:
                        continue

                    # Use lowercase as dict key to merge case variants
                    key = normalized.lower()

                    # Store the Title Case name, accumulate score
                    if key not in score_map:
                        score_map[key] = {'name': normalized, 'score': 0}

                    score_map[key]['score'] += weight                  # Accumulate weight

        # Return {title_case_name: score} — key is the display name
        return {v['name']: v['score'] for v in score_map.values()}

    # ------------------------------------------------------------------
    # PRIVATE: Find or create a Skill document (normalized name)
    # ------------------------------------------------------------------

    @staticmethod
    def _get_or_create_skill(normalized_name):
        """
        Finds an existing Skill by name (case-insensitive) or creates a new one.
        Always stores the skill in Title Case.
        Disconnects signals before saving to prevent recursive pipeline.

        Args:
            normalized_name (str): Title Case skill name.

        Returns:
            Skill | None
        """
        if not normalized_name:
            return None

        try:
            # Case-insensitive lookup
            existing = Skill.objects(
                skill_name__iexact=normalized_name
            ).first()

            if existing:
                # If found with different casing, normalize it
                if existing.skill_name != normalized_name:
                    Skill.objects(id=existing.id).update_one(
                        __raw__={'$set': {'skill_name': normalized_name}}
                    )
                return existing

            # Create new Skill with normalized name
            resolved_type, resolved_icon = SkillService._resolve_type_and_icon(normalized_name)

            new_skill = Skill(
                skill_name   = normalized_name,                        # Always Title Case
                skill_type   = resolved_type,
                skill_icon   = resolved_icon,
                last_updated = datetime.now(timezone.utc)
            )

            # Disconnect signal to prevent recursive pipeline trigger
            from mongoengine import signals as me_signals
            from App.utils.signals import master_sync_signal

            me_signals.post_save.disconnect(master_sync_signal, sender=Skill)

            try:
                new_skill.save()
            finally:
                me_signals.post_save.connect(master_sync_signal, sender=Skill)

            logging.info(
                f"SkillService: Created skill '{normalized_name}' "
                f"— type='{resolved_type.name if resolved_type else 'None'}'"
            )
            return new_skill

        except Exception as e:
            logging.error(
                f"SkillService._get_or_create_skill('{normalized_name}') failed: {str(e)}"
            )
            return None

    # ------------------------------------------------------------------
    # PUBLIC: Re-categorize all skills (from old SkillService you shared)
    # ------------------------------------------------------------------

    @staticmethod
    def bulk_update_categories():
        """
        Updates skill categories based on token matching against SkillType keywords.
        Uses __raw__ update to bypass signals entirely.
        Zero-Score protection: unmatched skills fall back to 'Other Technologies'.

        Returns:
            int: Number of Skill documents updated.
        """
        updated_count = 0

        try:
            all_skills    = list(Skill.objects.all())
            all_types     = list(SkillType.objects.all())
            other_tech    = next(                                      # Fallback type
                (t for t in all_types if t.name.lower() == 'other technologies'),
                None
            )
            now = datetime.now(timezone.utc)

            if not all_types:
                logging.error("bulk_update_categories: No SkillTypes found.")
                return 0

            for skill in all_skills:
                skill_tokens      = set(skill.skill_name.lower().strip().split())  # Tokenize skill name
                best_type         = None
                highest_score     = 0

                for s_type in all_types:
                    if not s_type.keywords:
                        continue

                    # Tokenize all keywords in this SkillType
                    type_tokens = set()
                    for kw in s_type.keywords:
                        kw_name = kw.name if hasattr(kw, 'name') else str(kw)
                        type_tokens.update(kw_name.lower().strip().split())

                    # Intersection: count matching tokens
                    match_score = len(skill_tokens.intersection(type_tokens))

                    if match_score > highest_score:
                        highest_score = match_score
                        best_type     = s_type

                # Zero-score fallback
                final_type = best_type if highest_score > 0 else other_tech

                if final_type and skill.skill_type != final_type:
                    Skill.objects(id=skill.id).update_one(
                        __raw__={'$set': {
                            'skill_type'  : final_type.id,
                            'last_updated': now
                        }}
                    )
                    updated_count += 1

        except Exception as e:
            logging.error(f"SkillService.bulk_update_categories failed: {str(e)}")
            return 0

        return updated_count

    # ------------------------------------------------------------------
    # PRIVATE: Resolve SkillType and icon for a skill name
    # ------------------------------------------------------------------

    @staticmethod
    def _resolve_type_and_icon(skill_name):
        """
        Searches all SkillType keywords to find the best match.
        Step 1: Exact match → return immediately.
        Step 2: Token intersection → return best score.
        Step 3: Fallback → 'Other Technologies', no icon.

        Args:
            skill_name (str): Normalized skill name.

        Returns:
            tuple: (SkillType | None, str icon)
        """
        all_types    = list(SkillType.objects.all())
        skill_lower  = skill_name.lower().strip()
        skill_tokens = set(skill_lower.split())

        fallback_type = next(
            (t for t in all_types if t.name.lower() == 'other technologies'),
            None
        )

        best_type       = None
        best_score      = 0
        best_icon       = ''

        for s_type in all_types:
            if not s_type.keywords:
                continue

            for keyword in s_type.keywords:
                kw_name = keyword.name if hasattr(keyword, 'name') else str(keyword)
                kw_lower = kw_name.lower().strip()

                if kw_lower == skill_lower:                            # Exact match
                    icon = keyword.icon if hasattr(keyword, 'icon') else ''
                    return s_type, icon

                kw_tokens = set(kw_lower.split())
                overlap   = len(skill_tokens.intersection(kw_tokens))

                if overlap > best_score:
                    best_score = overlap
                    best_type  = s_type
                    best_icon  = keyword.icon if hasattr(keyword, 'icon') else ''

        if best_score > 0:
            return best_type, best_icon

        return fallback_type, ''