import logging
from datetime import datetime, timezone
from App.models.skills import ProfileSkill
from App.models.goal import Goal


class RoadmapService:
    """
    Roadmap Service:
    Calculates goal progress using the same token-based matching strategy
    as the goals API route — first match wins, score counted once per skill.
    """

    @staticmethod
    def calculate_goal_progress(goal_id):
        """
        Calculates a specific goal's progress based on matching ProfileSkill scores.

        Matching strategy (identical to goals route):
            1. Build token_score_map from all ProfileSkill names.
            2. For each required_skill, tokenize and find first matching token.
            3. Break after first match — score counted once per required_skill.
            4. Final score = average across all required_skills scaled to target_score.

        Args:
            goal_id: The MongoDB ObjectId of the target Goal document.

        Returns:
            int: The calculated current_score (0 — target_score).
        """
        try:
            goal = Goal.objects.get(id=goal_id)                        # Fetch the specific goal

            # Guard: no required skills = no progress
            if not goal.required_skills:
                goal.current_score = 0
                goal.save()
                return 0

            # Step 1: Pre-fetch ALL ProfileSkill docs in ONE query
            # Build token map: {token: best_score}
            # Identical to goals route — ensures consistent scoring
            token_score_map = {}                                       # {token_str: best_score}

            for ps in ProfileSkill.objects(profile=goal.profile).select_related():
                if not ps.skill:
                    continue                                           # Skip orphaned references

                tokens = ps.skill.skill_name.strip().lower().split()  # Tokenize skill name

                for token in tokens:
                    # Keep highest score per token across all ProfileSkill docs
                    if token not in token_score_map or ps.score > token_score_map[token]:
                        token_score_map[token] = ps.score             # Map token → best score

            if not token_score_map:
                goal.current_score = 0
                goal.save()
                return 0

            # Step 2: Calculate score for each required skill
            total_progress = 0.0                                       # Accumulator
            skill_count    = 0                                         # Denominator

            for skill_name in goal.required_skills:
                if not skill_name:
                    continue                                           # Skip empty entries

                # Tokenize the required skill name
                req_tokens = skill_name.strip().lower().split()        # e.g. "Linear Algebra" → ["linear", "algebra"]

                best_score = 0                                         # Default: no match

                for token in req_tokens:
                    if token in token_score_map:
                        best_score = token_score_map[token]            # First match wins
                        break                                          # ← score counted once

                total_progress += best_score                           # Accumulate score
                skill_count    += 1                                    # Count all skills including unmatched

                logging.debug(
                    f"RoadmapService: '{skill_name}' "
                    f"→ score={best_score}"
                )

            if skill_count == 0:
                goal.current_score = 0
                goal.save()
                return 0

            # Step 3: Calculate average and scale to target_score
            avg_progress = total_progress / skill_count                # Mean score 0-100
            scaled_score = (avg_progress / 100.0) * goal.target_score # Scale to target
            final_score  = min(round(scaled_score), goal.target_score) # Cap at target

            # Step 4: Auto-promote status if target reached
            if final_score >= goal.target_score:
                goal.status = 'Achieved'                               # Auto-status update

            goal.current_score = final_score
            goal.last_updated  = datetime.now(timezone.utc)
            goal.save()

            logging.info(
                f"RoadmapService: Goal [{goal_id}] — "
                f"avg={avg_progress:.1f}%, "
                f"final={final_score}/{goal.target_score}"
            )
            return final_score

        except Exception as e:
            logging.error(
                f"RoadmapService.calculate_goal_progress failed "
                f"for goal [{goal_id}]: {str(e)}"
            )
            return 0

    @staticmethod
    def sync_all_goals(profile=None):
        """
        Triggers progress calculation for every goal in the system.
        Scoped to a specific profile if provided.

        Args:
            profile (Profile | None): If provided, only syncs goals for this profile.
        """
        goals = (
            Goal.objects(profile=profile) if profile
            else Goal.objects.all()                                    # Global sync fallback
        )

        for goal in goals:
            RoadmapService.calculate_goal_progress(goal.id)            # Recalculate each goal