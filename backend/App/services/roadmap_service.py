import logging                                                      # Error tracking and logging
from datetime import datetime, timezone                             # Time management
from App.models.skills import Skill                                 # Importing skills for token matching
from App.models.goal import Goal                                    # Importing goals for progress updates


class RoadmapService:
    """
    Roadmap Service:
    Manages the synchronization between professional goals and current technical skills.
    Calculates goal progress using token-based skill matching.
    All goal queries are profile-scoped to ensure data isolation.
    """

    @staticmethod
    def calculate_goal_progress(goal_id):
        """
        Calculates a specific goal's progress based on matching skill levels.
        Uses token intersection to find relevant skills and computes a weighted average.

        Args:
            goal_id: The MongoDB ObjectId of the target Goal document.

        Returns:
            int: The calculated current score (0–target_score).
        """
        try:
            goal = Goal.objects.get(id=goal_id)                     # Fetch the specific goal

            # Guard: if no required skills defined, score is zero
            if not goal.required_skills:
                goal.current_score = 0
                goal.save()
                return 0

            total_progress  = 0.0                                   # Accumulator for weighted progress
            weight_per_skill = 100.0 / len(goal.required_skills)    # Equal weight per required skill
            all_skills       = Skill.objects.all()                  # Fetch all skills once for performance

            for skill_query in goal.required_skills:
                query_tokens  = set(skill_query.lower().split())    # Tokenize the required skill name
                matched_levels = []

                for skill_obj in all_skills:
                    skill_tokens = set(skill_obj.skill_name.lower().split())  # Tokenize stored skill name

                    # Token intersection: any overlap means a relevant skill match
                    if query_tokens.intersection(skill_tokens):
                        matched_levels.append(skill_obj.level)      # Collect the proficiency level

                if matched_levels:
                    # Average the levels of all matched skills
                    avg_level = sum(matched_levels) / len(matched_levels)
                    total_progress += (avg_level / 100.0) * weight_per_skill  # Scale to weight

            # Update goal metrics — cap at target_score
            goal.current_score = min(round(total_progress), goal.target_score)
            goal.last_updated  = datetime.now(timezone.utc)         # Refresh audit timestamp

            # Auto-promote to Achieved if target is reached
            if goal.current_score >= goal.target_score:
                goal.status = 'Achieved'                            # Auto-status update

            goal.save()                                             # Persist changes to MongoDB
            return goal.current_score

        except Exception as e:
            logging.error(f"RoadmapService.calculate_goal_progress failed for goal [{goal_id}]: {str(e)}")
            return 0

    @staticmethod
    def sync_all_goals(profile=None):
        """
        Triggers progress calculation for every goal in the system.
        Useful for bulk updates after major skill changes.
        If a profile is provided, only that profile's goals are recalculated.

        Args:
            profile (Profile | None): Optional profile to scope the sync.
                                      If None, all goals across all profiles are synced.
        """
        # Scope query to the profile if provided, otherwise sync everything
        if profile:
            goals = Goal.objects(profile=profile)                   # Profile-scoped bulk sync
        else:
            goals = Goal.objects.all()                              # Global sync (used by signals)

        for goal in goals:
            RoadmapService.calculate_goal_progress(goal.id)         # Recalculate each goal individually