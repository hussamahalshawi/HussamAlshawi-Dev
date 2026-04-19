import logging  # Error tracking and logging
from datetime import datetime, timezone  # Time management
from App.models.skills import Skill  # Importing skills for matching
from App.models.goal import Goal  # Importing goals for updates


class RoadmapService:
    """
    Roadmap Service:
    Manages the synchronization between professional goals and current technical skills.
    """

    @staticmethod
    def calculate_goal_progress(goal_id):
        """
        Calculates a specific goal's progress based on matching skill levels.
        English Comment: Performs token-based matching to find skill levels and update the goal score.
        """
        try:
            goal = Goal.objects.get(id=goal_id)  # Fetch the goal instance

            if not goal.required_skills:
                goal.current_score = 0
                goal.save()
                return 0

            total_progress = 0.0
            weight_per_skill = 100.0 / len(goal.required_skills)
            all_skills = Skill.objects.all()  # Fetch skills once for performance

            for skill_query in goal.required_skills:
                query_tokens = set(skill_query.lower().split())
                matched_levels = []

                for skill_obj in all_skills:
                    skill_tokens = set(skill_obj.skill_name.lower().split())
                    # Intersection logic to find matching skills
                    if query_tokens.intersection(skill_tokens):
                        matched_levels.append(skill_obj.level)

                if matched_levels:
                    # Calculate mean level for multiple matches
                    avg_level = sum(matched_levels) / len(matched_levels)
                    total_progress += (avg_level / 100.0) * weight_per_skill

            # Update Goal metrics
            goal.current_score = min(round(total_progress), goal.target_score)
            goal.last_updated = datetime.now(timezone.utc)

            # Auto-status update
            if goal.current_score >= goal.target_score:
                goal.status = 'Achieved'

            goal.save()  # Persist changes to MongoDB
            return goal.current_score

        except Exception as e:
            logging.error(f"RoadmapService Error for goal {goal_id}: {str(e)}")
            return 0

    @staticmethod
    def sync_all_goals():
        """
        English Comment: Triggers progress calculation for every goal in the system.
        Useful for bulk updates after major skill changes.
        """
        goals = Goal.objects.all()
        for goal in goals:
            RoadmapService.calculate_goal_progress(goal.id)