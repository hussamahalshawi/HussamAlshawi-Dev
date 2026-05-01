import logging                                                      # Error tracking and logging
from datetime import datetime, timezone                             # Time management for experience calculation
from App.models.profile import Profile                              # Main profile model
from App.models.experience import Experience                        # Source model for metrics
from App.models.course import Course                                # Source model for metrics
from App.models.education import Education                          # Source model for metrics
from App.models.project import Project                              # Source model for metrics
from App.models.self_study import SelfStudy                         # Source model for metrics
from App.models.goal import Goal                                    # Source model for overall score
from App.models.skills import ProfileSkill                          # Source for skill-based score fallback


class ProfileService:
    """
    Profile Analytics Service:
    Centralizes metric calculations for career experience and overall portfolio score.
    All queries are scoped to the specific profile to ensure data isolation.
    """

    @staticmethod
    def calculate_metrics(profile_id):
        """
        Refreshes all profile metrics including experience years and overall score.

        overall_score logic (two-source blend):
            - Primary  : Average goal progress across all roadmap goals (0–100).
            - Secondary: Average ProfileSkill score across all active skills (0–100).
            - Final    : Weighted blend — 60% skills average + 40% goals average.
              This ensures the score reflects real competency even when Goals
              are not yet fully defined or their required_skills don't match.

        Args:
            profile_id: The MongoDB ObjectId of the target Profile document.

        Returns:
            bool: True on success, False on failure.
        """
        try:
            profile = Profile.objects.get(id=profile_id)           # Fetch the target profile
            now     = datetime.now(timezone.utc)                    # Current UTC time

            # ---------------------------------------------------------------
            # STEP 1: WEIGHTED EXPERIENCE CALCULATION
            # ---------------------------------------------------------------
            weights = {
                'Experience' : 1.0,
                'Project'    : 0.4,
                'Education'  : 0.2,
                'SelfStudy'  : 0.3,
                'Course'     : 0.3,
            }

            model_map = {
                'Experience' : Experience,
                'Project'    : Project,
                'Education'  : Education,
                'SelfStudy'  : SelfStudy,
                'Course'     : Course,
            }

            total_weighted_days = 0

            for label, model in model_map.items():
                weight = weights.get(label, 0.1)
                items  = model.objects(profile=profile)             # Profile-scoped query

                for item in items:
                    if not (hasattr(item, 'start_date') and item.start_date):
                        continue

                    start = (
                        item.start_date.replace(tzinfo=timezone.utc)
                        if not item.start_date.tzinfo
                        else item.start_date
                    )

                    has_end = hasattr(item, 'end_date') and item.end_date
                    end = (
                        (item.end_date.replace(tzinfo=timezone.utc) if not item.end_date.tzinfo else item.end_date)
                        if has_end
                        else now
                    )

                    duration_days = (end - start).days

                    if duration_days > 0:
                        total_weighted_days += duration_days * weight

            profile.experience_years = round(total_weighted_days / 365.25, 1)

            # ---------------------------------------------------------------
            # STEP 2: OVERALL SCORE — BLENDED CALCULATION
            # Source A: Roadmap Goals average
            # Source B: ProfileSkill scores average
            # Final   : 40% Goals + 60% Skills
            # ---------------------------------------------------------------

            # --- Source A: Goals-based score ---
            goals          = Goal.objects(profile=profile)          # Profile-scoped goals
            goals_score    = 0.0                                    # Default if no goals exist

            if goals.count() > 0:
                total_goal_progress = sum([
                    min((g.current_score / (g.target_score or 100)) * 100, 100)
                    for g in goals
                ])
                goals_score = round(total_goal_progress / goals.count(), 1)

            # --- Source B: ProfileSkill-based score ---
            profile_skills = ProfileSkill.objects(profile=profile)  # All skill scores for this profile
            skills_score   = 0.0                                    # Default if no skills exist

            if profile_skills.count() > 0:
                total_skill_score = sum([ps.score for ps in profile_skills])  # Sum all scores
                skills_score      = round(total_skill_score / profile_skills.count(), 1)  # Average

            # --- Blend: 60% skills + 40% goals ---
            # Goals reflect ambition; Skills reflect actual competency.
            # Skills get higher weight because they're calculated from real activity data.
            blended_score        = (skills_score * 0.6) + (goals_score * 0.4)
            profile.overall_score = round(blended_score, 1)

            # ---------------------------------------------------------------
            # STEP 3: PERSIST
            # ---------------------------------------------------------------
            profile.last_updated = datetime.now(timezone.utc)
            profile.save()

            logging.info(
                f"ProfileService: Updated profile [{profile_id}] — "
                f"exp={profile.experience_years}y, "
                f"skills_avg={skills_score}%, "
                f"goals_avg={goals_score}%, "
                f"blended={profile.overall_score}%"
            )
            return True

        except Exception as e:
            logging.error(f"ProfileService.calculate_metrics failed for [{profile_id}]: {str(e)}")
            return False