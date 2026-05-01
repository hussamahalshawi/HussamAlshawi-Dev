import logging
from datetime import datetime, timezone
from App.models.profile  import Profile
from App.models.skills   import ProfileSkill
from App.models.goal     import Goal
from App.models.experience import Experience
from App.models.course     import Course
from App.models.education  import Education
from App.models.project    import Project
from App.models.self_study import SelfStudy


class ProfileService:
    """
    Profile Analytics Service.
    Calculates experience_years and overall_score in a single pass.
    All data is fetched once and reused — no redundant DB queries.
    """

    @staticmethod
    def calculate_metrics(profile_id):
        """
        Refreshes experience_years and overall_score for a given profile.

        Optimization: all DB queries happen once at the start.
        No model is queried twice.

        overall_score blend:
            60% → average ProfileSkill score  (reflects actual competency)
            40% → average Goal progress        (reflects ambition)

        Args:
            profile_id: MongoDB ObjectId of the target Profile.

        Returns:
            bool: True on success, False on failure.
        """
        try:
            profile = Profile.objects.get(id=profile_id)               # Fetch profile once
            now     = datetime.now(timezone.utc)

            # ---------------------------------------------------------------
            # STEP 1: FETCH ALL DATA IN ONE PASS
            # Each model is queried exactly once — results cached in memory.
            # ---------------------------------------------------------------
            model_config = {
                'Experience': (Experience, 1.0),
                'Project'   : (Project,    0.4),
                'Education' : (Education,  0.2),
                'SelfStudy' : (SelfStudy,  0.3),
                'Course'    : (Course,     0.3),
            }

            # Fetch all records upfront — stored in memory, not re-queried
            fetched_records = {
                label: list(model.objects(profile=profile))            # Profile-scoped query
                for label, (model, _) in model_config.items()
            }

            # ---------------------------------------------------------------
            # STEP 2: EXPERIENCE CALCULATION
            # Uses pre-fetched records — no additional queries.
            # ---------------------------------------------------------------
            total_weighted_days = 0

            for label, (_, weight) in model_config.items():
                for item in fetched_records[label]:                    # Use cached records
                    if not (hasattr(item, 'start_date') and item.start_date):
                        continue

                    start = (
                        item.start_date.replace(tzinfo=timezone.utc)
                        if not item.start_date.tzinfo
                        else item.start_date
                    )

                    has_end = hasattr(item, 'end_date') and item.end_date
                    end     = (
                        (item.end_date.replace(tzinfo=timezone.utc)
                         if not item.end_date.tzinfo
                         else item.end_date)
                        if has_end else now
                    )

                    duration_days = (end - start).days

                    if duration_days > 0:
                        total_weighted_days += duration_days * weight  # Accumulate weighted days

            profile.experience_years = round(total_weighted_days / 365.25, 1)

            # ---------------------------------------------------------------
            # STEP 3: OVERALL SCORE — BLENDED (single query per source)
            # ---------------------------------------------------------------

            # Source A: ProfileSkill average — fetched once
            profile_skills = list(ProfileSkill.objects(profile=profile))
            skills_score   = 0.0

            if profile_skills:
                skills_score = round(
                    sum(ps.score for ps in profile_skills) / len(profile_skills), 1
                )

            # Source B: Goals average — fetched once
            goals       = list(Goal.objects(profile=profile))
            goals_score = 0.0

            if goals:
                total_goal_progress = sum(
                    min((g.current_score / (g.target_score or 100)) * 100, 100)
                    for g in goals
                )
                goals_score = round(total_goal_progress / len(goals), 1)

            # Blend: 60% skills + 40% goals
            profile.overall_score = round(
                (skills_score * 0.6) + (goals_score * 0.4), 1
            )

            # ---------------------------------------------------------------
            # STEP 4: PERSIST — single save at the end
            # ---------------------------------------------------------------
            profile.last_updated = now
            profile.save()

            logging.info(
                f"ProfileService: Updated [{profile_id}] — "
                f"exp={profile.experience_years}y | "
                f"skills={skills_score}% | "
                f"goals={goals_score}% | "
                f"blended={profile.overall_score}%"
            )
            return True

        except Exception as e:
            logging.error(
                f"ProfileService.calculate_metrics failed for [{profile_id}]: {str(e)}"
            )
            return False