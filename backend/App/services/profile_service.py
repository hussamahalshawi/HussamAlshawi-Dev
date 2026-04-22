import logging                                                      # Error tracking and logging
from datetime import datetime, timezone                             # Time management for experience calculation
from App.models.profile import Profile                              # Main profile model
from App.models.experience import Experience                        # Source model for metrics
from App.models.course import Course                                # Source model for metrics
from App.models.education import Education                          # Source model for metrics
from App.models.project import Project                              # Source model for metrics
from App.models.self_study import SelfStudy                         # Source model for metrics
from App.models.goal import Goal                                    # Source model for overall score


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
        Queries are filtered by profile to support multi-profile data isolation.

        Args:
            profile_id: The MongoDB ObjectId of the target Profile document.

        Returns:
            bool: True on success, False on failure.
        """
        try:
            profile = Profile.objects.get(id=profile_id)           # Fetch the target profile
            now     = datetime.now(timezone.utc)                    # Current UTC time for open-ended durations

            # ---------------------------------------------------------------
            # STEP 1: WEIGHTED EXPERIENCE CALCULATION
            # Weights reflect real-world career impact of each activity type
            # ---------------------------------------------------------------
            weights = {
                'Experience' : 1.0,                                 # Real job experience — highest weight
                'Project'    : 0.4,                                 # Hands-on project work
                'Education'  : 0.2,                                 # Academic background
                'SelfStudy'  : 0.3,                                 # Self-directed learning
                'Course'     : 0.3,                                 # Guided course learning
            }

            # Map label → model class for iteration
            model_map = {
                'Experience' : Experience,
                'Project'    : Project,
                'Education'  : Education,
                'SelfStudy'  : SelfStudy,
                'Course'     : Course,
            }

            total_weighted_days = 0                                 # Accumulator for all weighted durations

            for label, model in model_map.items():
                weight = weights.get(label, 0.1)                    # Get weight for this model type

                # Filter by profile — only count records belonging to THIS profile
                items = model.objects(profile=profile)              # Profile-scoped query (not .all())

                for item in items:
                    if not (hasattr(item, 'start_date') and item.start_date):
                        continue                                     # Skip items without a start date

                    # Ensure timezone-awareness for start date
                    start = (
                        item.start_date.replace(tzinfo=timezone.utc)
                        if not item.start_date.tzinfo
                        else item.start_date
                    )

                    # Use end_date if available, otherwise use now (open-ended)
                    has_end = hasattr(item, 'end_date') and item.end_date
                    end = (
                        (item.end_date.replace(tzinfo=timezone.utc) if not item.end_date.tzinfo else item.end_date)
                        if has_end
                        else now
                    )

                    duration_days = (end - start).days              # Total days for this activity

                    if duration_days > 0:
                        total_weighted_days += duration_days * weight  # Apply weight and accumulate

            # Convert total weighted days to years (rounded to 1 decimal)
            profile.experience_years = round(total_weighted_days / 365.25, 1)

            # ---------------------------------------------------------------
            # STEP 2: OVERALL SCORE CALCULATION
            # Aggregates roadmap goal progress into a single portfolio score
            # ---------------------------------------------------------------

            # Filter goals by THIS profile only
            goals = Goal.objects(profile=profile)                   # Profile-scoped query

            if goals:
                # Calculate average progress across all goals (capped at 100 per goal)
                total_progress = sum([
                    min((g.current_score / (g.target_score or 100)) * 100, 100)
                    for g in goals
                ])
                profile.overall_score = round(total_progress / goals.count(), 1)
            else:
                profile.overall_score = 0.0                         # No goals → score is zero

            # ---------------------------------------------------------------
            # STEP 3: PERSIST UPDATED METRICS
            # ---------------------------------------------------------------
            profile.last_updated = datetime.now(timezone.utc)       # Refresh modification timestamp
            profile.save()                                          # Persist changes to MongoDB

            logging.info(
                f"ProfileService: Updated profile [{profile_id}] — "
                f"exp={profile.experience_years}y, score={profile.overall_score}%"
            )
            return True

        except Exception as e:
            logging.error(f"ProfileService.calculate_metrics failed for [{profile_id}]: {str(e)}")
            return False