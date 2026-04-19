import logging                                                      # Logging for error tracking
from datetime import datetime, timezone                             # Time management for audit fields
from App.models.skills import Skill, SkillType                      # Importing the new professional models

class SkillService:
    """
    Skill Categorization Service:
    Automates the assignment of skills to their respective types using
    token-based matching and intersection logic.
    """

    @staticmethod
    def bulk_update_categories():
        """
        Processes all skills and matches them with SkillTypes based on keywords.
        English Comment: Implements a 'best match' algorithm with a fallback safety net.
        """
        updated_count = 0                                           # Counter for database modifications

        try:
            all_skills = Skill.objects.all()                        # Retrieve all master skills
            all_types = SkillType.objects.all()                     # Retrieve all classification types

            if not all_types:
                logging.warning("Categorization Aborted: No SkillTypes defined in database.")
                return 0

            # English Comment: Find the 'Other' category to act as a global fallback
            fallback_type = SkillType.objects(name__iexact="Other technologies").first()

            for skill in all_skills:
                # 1. TOKENIZATION
                # English Comment: Split skill name into lowercase words for comparison
                skill_tokens = set(skill.skill_name.lower().strip().split())

                best_matched_type = None
                highest_match_score = 0

                for s_type in all_types:
                    if not s_type.keywords:
                        continue

                    # 2. KEYWORD MATCHING
                    # English Comment: Check intersection between skill name and category keywords
                    type_tokens = set()
                    for keyword in s_type.keywords:
                        type_tokens.update(keyword.lower().strip().split())

                    match_score = len(skill_tokens.intersection(type_tokens))

                    # 3. RANKING LOGIC
                    if match_score > highest_match_score:
                        highest_match_score = match_score
                        best_matched_type = s_type

                # 4. ASSIGNMENT & VALIDATION
                # English Comment: Determine final type (Best Match or Fallback or None)
                final_type = best_matched_type if highest_match_score > 0 else fallback_type

                if final_type and skill.skill_type != final_type:
                    skill.skill_type = final_type                   # Update relationship
                    skill.last_updated = datetime.now(timezone.utc) # Refresh audit timestamp
                    skill.save()                                    # Commit changes to MongoDB
                    updated_count += 1

        except Exception as e:
            logging.error(f"SkillService Failure: {str(e)}")        # Log errors for debugging
            return 0

        return updated_count