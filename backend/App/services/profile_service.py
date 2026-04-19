import logging                                                      # Error tracking and logging
from datetime import datetime, timezone                             # Time management for experience calculation
from App.models.profile import Profile                              # Main profile model
from App.models.experience import Experience                        # Source models for metrics
from App.models.course import Course
from App.models.education import Education
from App.models.project import Project
from App.models.self_study import SelfStudy
from App.models.goal import Goal

class ProfileService:
    """
    Profile Analytics Service:
    Centralizes metric calculations for career experience and overall progress.
    """

    @staticmethod
    def calculate_metrics(profile_id):
        """
        Refreshes all profile metrics including experience years and overall score.
        English Comment: Implements weighted calculation logic across all professional modules.
        """
        try:
            profile = Profile.objects.get(id=profile_id)
            now = datetime.now(timezone.utc)

            # --- 1. EXPERIENCE CALCULATION ---
            # English Comment: Weights reflect real-world career impact
            weights = {
                'Experience': 1.0, 'Project': 0.4, 'Education': 0.2,
                'SelfStudy': 0.3, 'Course': 0.3
            }

            model_map = {
                'Experience': Experience, 'Project': Project,
                'Education': Education, 'SelfStudy': SelfStudy, 'Course': Course
            }

            total_weighted_days = 0
            for label, model in model_map.items():
                weight = weights.get(label, 0.1)
                for item in model.objects.all():
                    if hasattr(item, 'start_date') and item.start_date:
                        # Ensure timezone awareness for start/end dates
                        start = item.start_date.replace(tzinfo=timezone.utc) if not item.start_date.tzinfo else item.start_date
                        end = (item.end_date.replace(tzinfo=timezone.utc) if not item.end_date.tzinfo else item.end_date) if (hasattr(item, 'end_date') and item.end_date) else now

                        duration_days = (end - start).days
                        if duration_days > 0:
                            total_weighted_days += duration_days * weight

            profile.experience_years = round(total_weighted_days / 365.25, 1)

            # --- 2. OVERALL SCORE CALCULATION ---
            # English Comment: Aggregates roadmap progress into a single portfolio score
            goals = Goal.objects.all()
            if goals:
                total_progress = sum([min((g.current_score / (g.target_score or 100)) * 100, 100) for g in goals])
                profile.overall_score = round(total_progress / goals.count(), 1)
            else:
                profile.overall_score = 0.0

            # --- 3. PERSISTENCE ---
            profile.last_updated = datetime.now(timezone.utc)
            profile.save()
            return True

        except Exception as e:
            logging.error(f"ProfileService Metric Failure: {str(e)}")
            return False