import logging                                                 # Standard library for error tracking
from datetime import datetime, timezone                        # Timezone-aware timestamps for audit fields
from App.models.skills import Skill, SkillType                 # Skill and SkillType model imports


class SkillService:
    """
    Skill Categorization Service:
    Automates skill-to-type assignment using token-based matching against SkillType keywords.
    Supports the updated DictField keyword structure: [{"name": "...", "icon": "...", "color": "..."}]
    """

    @staticmethod
    def _extract_keyword_tokens(skill_type):
        """
        Extracts and tokenizes all keyword names from a SkillType's keywords list.
        Handles the DictField structure: [{"name": "Python", "icon": "...", "color": "..."}]

        Args:
            skill_type (SkillType): The SkillType document to extract tokens from.

        Returns:
            set: A flat set of lowercase word tokens from all keyword names.
        """
        tokens = set()                                         # Initialize empty token set

        for keyword_dict in skill_type.keywords:               # Iterate over each keyword dictionary
            if not isinstance(keyword_dict, dict):             # Guard: skip malformed entries
                continue

            # ✅ FIX: Extract 'name' key from DictField instead of treating as plain string
            keyword_name = keyword_dict.get('name', '')        # Get the skill name from the dict

            if keyword_name:                                   # Only process non-empty names
                # Tokenize: lowercase and split by whitespace for intersection matching
                tokens.update(keyword_name.lower().strip().split())

        return tokens                                          # Return complete token set for this type

    @staticmethod
    def bulk_update_categories():
        """
        Processes all Skill documents and assigns each to the best-matching SkillType.
        Uses token intersection scoring — higher overlap = better match.
        Falls back to 'Other technologies' type when no match is found.

        Returns:
            int: Number of skill documents that were updated in MongoDB.
        """
        updated_count = 0                                      # Track how many skills were modified

        try:
            all_skills = Skill.objects.all()                   # Fetch all skill documents once
            all_types = SkillType.objects.all()                # Fetch all skill type documents once

            if not all_types:
                # Early exit: cannot categorize without any defined types
                logging.warning("SkillService: Categorization aborted — no SkillTypes found in database.")
                return 0

            # Find the fallback type for unmatched skills
            fallback_type = SkillType.objects(name__iexact="Other technologies").first()

            for skill in all_skills:
                # Step 1: Tokenize the skill name for comparison
                skill_tokens = set(skill.skill_name.lower().strip().split())

                best_matched_type = None                       # Reset best match for each skill
                highest_match_score = 0                        # Reset score for each skill

                for s_type in all_types:
                    if not s_type.keywords:                    # Skip types with no keywords defined
                        continue

                    # Step 2: ✅ FIX — Extract tokens from DictField structure using helper method
                    type_tokens = SkillService._extract_keyword_tokens(s_type)

                    if not type_tokens:                        # Skip if no valid tokens were extracted
                        continue

                    # Step 3: Score = number of shared tokens between skill name and type keywords
                    match_score = len(skill_tokens.intersection(type_tokens))

                    # Step 4: Keep track of the highest-scoring type
                    if match_score > highest_match_score:
                        highest_match_score = match_score
                        best_matched_type = s_type

                # Step 5: Assign best match or fall back to 'Other technologies'
                final_type = best_matched_type if highest_match_score > 0 else fallback_type

                # Step 6: Only save if the type actually changed — avoid unnecessary DB writes
                if final_type and skill.skill_type != final_type:
                    skill.skill_type = final_type              # Update the skill's category reference
                    skill.last_updated = datetime.now(timezone.utc)  # Refresh audit timestamp
                    skill.save()                               # Persist the change to MongoDB
                    updated_count += 1                         # Increment the update counter

        except Exception as e:
            # Log full error details for debugging without crashing the signal chain
            logging.error(f"SkillService.bulk_update_categories failed: {str(e)}")
            return 0                                           # Return 0 to signal failure to callers

        return updated_count                                   # Return total number of updated skills