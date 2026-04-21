from mongoengine import signals                                # MongoEngine signal system
import logging                                                 # Standard error tracking
from App.models.project     import Project                     # Monitored model
from App.models.course      import Course                      # Monitored model
from App.models.experience  import Experience                  # Monitored model
from App.models.education   import Education                   # Monitored model
from App.models.self_study  import SelfStudy                   # Monitored model
from App.models.achievement import Achievement                 # Monitored model
from App.models.goal        import Goal                        # Monitored model
from App.models.skills      import Skill                       # Monitored model
from App.models.profile     import Profile                     # For metrics refresh

from App.services.skill_service   import SkillService          # Skill creation + categorization
from App.services.roadmap_service import RoadmapService        # Goal progress calculation
from App.services.profile_service import ProfileService        # Profile metrics refresh


# Mapping: each model class → the field name that holds its skill name strings
SKILL_FIELD_MAP = {
    Course     : 'acquired_skills',        # Course.acquired_skills
    Project    : 'skills_used',            # Project.skills_used
    Education  : 'skills_learned',         # Education.skills_learned
    SelfStudy  : 'skills_learned',         # SelfStudy.skills_learned
    Achievement: 'skills_demonstrated',    # Achievement.skills_demonstrated
    Experience : 'skills_acquired',        # Experience.skills_acquired
}


def master_sync_signal(sender, document, **kwargs):
    """
    Central post-save coordinator.
    Triggered after any monitored model is saved to MongoDB.
    """
    try:
        # Step 1: Find the skill field name for this sender model
        skill_field = SKILL_FIELD_MAP.get(sender)

        if skill_field:
            skill_names = getattr(document, skill_field, [])   # Read skill list from document

            if skill_names:
                # ✅ FIXED: pass source_model_name to apply correct weight
                SkillService.sync_skills_from_source(
                    skill_names,
                    source_model_name=sender.__name__           # 'Course' → weight=15
                )
            else:
                SkillService.bulk_update_categories()           # No skills — just re-categorize

        else:
            SkillService.bulk_update_categories()               # Goal/Skill — just re-categorize

        # Step 2: Recalculate goal progress scores
        RoadmapService.sync_all_goals()

        # Step 3: Refresh profile metrics
        profile = Profile.objects.first()
        if profile:
            ProfileService.calculate_metrics(profile.id)

        logging.info(f"[SIGNAL] {sender.__name__} sync completed successfully.")

    except Exception as e:
        logging.error(f"[SIGNAL ERROR] {sender.__name__}: {str(e)}", exc_info=True)  # ✅ exc_info يطبع الـ traceback كاملاً


def master_delete_signal(sender, document, **kwargs):
    """Central post-delete coordinator."""
    master_sync_signal(sender, document, **kwargs)
    logging.info(f"[SIGNAL] {sender.__name__} deletion sync completed.")


monitored_models = [
    Project, Course, Experience, Education,
    SelfStudy, Achievement, Goal, Skill
]


def register_signals():
    """
    Connects post_save and post_delete signals to all monitored models.
    Called once inside create_app() in App/__init__.py.
    """
    for model in monitored_models:
        signals.post_save.connect(master_sync_signal,    sender=model)
        signals.post_delete.connect(master_delete_signal, sender=model)

    print("✅ All System Signals Registered Successfully.")