import logging
from datetime import datetime, timezone
from App.models.skills import Skill, ProfileSkill
from App.models.goal import Goal


class RoadmapService:
    """
    Roadmap Service:
    Calculates goal progress using fuzzy token-based skill matching.
    Profile-scoped to ensure data isolation between multiple profiles.
    """

    @staticmethod
    def calculate_goal_progress(goal_id):
        """
        Calculates a specific goal's progress based on matching ProfileSkill scores.

        Matching strategy:
            - Tokenizes each required_skill and each ProfileSkill name.
            - Any token overlap = match (partial match allowed).
            - If multiple skills match one required_skill → takes the highest score.
            - Final score = average across all required_skills, scaled to target_score.

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

            # Pre-fetch ALL ProfileSkill docs for this profile in ONE query
            # Avoids N+1 queries inside the matching loop
            all_profile_skills = list(
                ProfileSkill.objects(profile=goal.profile).select_related()
            )

            if not all_profile_skills:
                goal.current_score = 0
                goal.save()
                return 0

            # Build lookup: {token: best_score} for fast matching
            # Each ProfileSkill contributes its tokens with its score
            token_score_map = {}                                       # {token_str: max_score}

            for ps in all_profile_skills:
                if not ps.skill:
                    continue

                skill_tokens = ps.skill.skill_name.lower().strip().split()  # Tokenize skill name

                for token in skill_tokens:
                    # Keep the highest score for each token across all skills
                    if token not in token_score_map or ps.score > token_score_map[token]:
                        token_score_map[token] = ps.score              # Store best score per token

            # Calculate progress for each required skill
            total_progress   = 0.0
            matched_count    = 0

            for required_skill in goal.required_skills:
                if not required_skill:
                    continue

                # Tokenize the required skill name
                req_tokens = set(required_skill.lower().strip().split())

                # Find all matching tokens from ProfileSkill map
                matched_scores = []

                for token in req_tokens:
                    if token in token_score_map:
                        matched_scores.append(token_score_map[token])  # Collect all matching scores

                if matched_scores:
                    # Use best matching score for this required skill
                    best_score     = max(matched_scores)               # Take the highest match
                    total_progress += best_score                       # Accumulate
                    matched_count  += 1
                    logging.debug(
                        f"RoadmapService: '{required_skill}' matched "
                        f"→ best_score={best_score}"
                    )
                else:
                    # No match found — this skill is not yet in ProfileSkill
                    # Counts as 0 contribution but still included in denominator
                    matched_count += 1
                    logging.debug(f"RoadmapService: '{required_skill}' — no match in ProfileSkill")

            if matched_count == 0:
                goal.current_score = 0
                goal.save()
                return 0

            # Average progress across all required skills
            avg_progress = total_progress / matched_count              # Mean score 0-100

            # Scale to target_score
            scaled_score = (avg_progress / 100.0) * goal.target_score
            final_score  = min(round(scaled_score), goal.target_score) # Cap at target

            # Auto-promote status if target reached
            if final_score >= goal.target_score:
                goal.status = 'Achieved'                               # Auto-status update

            goal.current_score = final_score
            goal.last_updated  = datetime.now(timezone.utc)
            goal.save()

            logging.info(
                f"RoadmapService: Goal [{goal_id}] — "
                f"avg_progress={avg_progress:.1f}%, "
                f"final_score={final_score}/{goal.target_score}"
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
            else Goal.objects.all()
        )

        for goal in goals:
            RoadmapService.calculate_goal_progress(goal.id)            # Recalculate each goal