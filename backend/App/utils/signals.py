from mongoengine import signals
import logging
from App.models.project import Project
from App.models.course import Course
from App.models.experience import Experience
from App.models.education import Education
from App.models.self_study import SelfStudy
from App.models.achievement import Achievement
from App.models.goal import Goal
from App.models.skills import Skill
from App.models.profile import Profile

# --- IMPORT SERVICES ---
from App.services.skill_service import SkillService
from App.services.roadmap_service import RoadmapService
from App.services.profile_service import ProfileService


def master_sync_signal(sender, document, **kwargs):
    """
    Central Coordinator:
    Triggered after any save operation to keep skills, goals, and profile in sync.
    """
    try:
        # 1. Update Skill Categorization
        # English Comment: Ensure all skills are correctly typed based on keywords
        SkillService.bulk_update_categories()

        # 2. Update Goal Progress
        # English Comment: Recalculate roadmap progress since skill levels might have changed
        RoadmapService.sync_all_goals()

        # 3. Update Profile Analytics
        # English Comment: Finalize by updating total experience years and overall score
        profile = Profile.objects.first()
        if profile:
            ProfileService.calculate_metrics(profile.id)

        logging.info(f"🚀 [SIGNAL] {sender.__name__} sync completed successfully.")

    except Exception as e:
        logging.error(f"❌ [SIGNAL ERROR] Master sync failed: {str(e)}")


def master_delete_signal(sender, document, **kwargs):
    """
    Cleanup Coordinator:
    Triggered after a document is deleted to ensure metrics decrease accordingly.
    """
    master_sync_signal(sender, document, **kwargs)
    logging.info(f"🗑️ [SIGNAL] {sender.__name__} deletion sync completed.")


# --- REGISTRATION ---
# Models that trigger the synchronization engine
monitored_models = [
    Project, Course, Experience, Education,
    SelfStudy, Achievement, Goal, Skill
]


def register_signals():
    """
    Connects signals to the specified models.
    This function must be called in the application factory (App/__init__.py).
    """
    for model in monitored_models:
        signals.post_save.connect(master_sync_signal, sender=model)
        signals.post_delete.connect(master_delete_signal, sender=model)

    print("✅ All System Signals Registered Successfully.")