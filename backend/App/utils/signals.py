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
from App.models.profile     import Profile                     # Used for profile injection + metrics refresh

from App.services.skill_service   import SkillService          # Skill creation + categorization
from App.services.roadmap_service import RoadmapService        # Goal progress calculation
from App.services.profile_service import ProfileService        # Profile metrics refresh


# -------------------------------------------------------------------------
# SKILL FIELD MAPPING
# Maps each model class → the field name that holds its skill name strings
# -------------------------------------------------------------------------
SKILL_FIELD_MAP = {
    Course     : 'acquired_skills',        # Course.acquired_skills
    Project    : 'skills_used',            # Project.skills_used
    Education  : 'skills_learned',         # Education.skills_learned
    SelfStudy  : 'skills_learned',         # SelfStudy.skills_learned
    Achievement: 'skills_demonstrated',    # Achievement.skills_demonstrated
    Experience : 'skills_acquired',        # Experience.skills_acquired
}

# Models that support the 'profile' ownership field
PROFILE_OWNED_MODELS = (
    Course, Project, Education, SelfStudy,
    Achievement, Experience, Goal
)


def _inject_profile_if_missing(document):
    """
    Ensures every new document is assigned to the active portfolio profile.
    Called from pre_save to guarantee the profile reference exists before the record is written.

    Args:
        document: Any MongoEngine document being saved.
    """
    # Check: does this document support profile ownership?
    if not isinstance(document, PROFILE_OWNED_MODELS):
        return                                                 # Skip models that don't have a profile field

    # Check: profile already assigned (edit scenario — don't overwrite)
    if document.profile is not None:
        return                                                 # Profile already set — do nothing

    # Fetch the single active portfolio profile
    profile = Profile.objects.first()

    if profile:
        document.profile = profile                             # Assign ownership before save
        logging.info(
            f"[SIGNAL] Auto-assigned profile to new {type(document).__name__} document."
        )


def master_sync_signal(sender, document, **kwargs):
    """
    Central post-save coordinator.
    Triggered after any monitored model is saved to MongoDB.
    Runs: skill sync → goal progress → profile metrics.

    Args:
        sender: The model class that triggered the signal.
        document: The saved MongoEngine document instance.
    """
    try:
        # ------------------------------------------------------------------
        # STEP 1: SKILL SYNCHRONIZATION
        # ------------------------------------------------------------------
        skill_field = SKILL_FIELD_MAP.get(sender)              # Find the skill field name for this model

        if skill_field:
            skill_names = getattr(document, skill_field, [])   # Read skill list from saved document

            if skill_names:
                # Create or increment skill levels based on source model weight
                SkillService.sync_skills_from_source(
                    skill_names,
                    source_model_name=sender.__name__           # e.g., 'Course' → weight=15
                )
            else:
                SkillService.bulk_update_categories()           # No skills — just re-categorize existing
        else:
            SkillService.bulk_update_categories()               # Goal/Skill — just re-categorize

        # ------------------------------------------------------------------
        # STEP 2: GOAL PROGRESS RECALCULATION
        # ------------------------------------------------------------------
        RoadmapService.sync_all_goals()                         # Recalculate all goal scores

        # ------------------------------------------------------------------
        # STEP 3: PROFILE METRICS REFRESH
        # ------------------------------------------------------------------
        profile = Profile.objects.first()                       # Fetch the active portfolio profile

        if profile:
            ProfileService.calculate_metrics(profile.id)       # Refresh experience_years + overall_score

        logging.info(f"[SIGNAL] {sender.__name__} sync completed successfully.")

    except Exception as e:
        logging.error(
            f"[SIGNAL ERROR] {sender.__name__} sync failed: {str(e)}",
            exc_info=True                                       # Full traceback in logs
        )


def master_pre_save_signal(sender, document, **kwargs):
    """
    Central pre-save coordinator.
    Ensures every new document is linked to the active profile before being written.

    Args:
        sender: The model class that triggered the signal.
        document: The MongoEngine document about to be saved.
    """
    _inject_profile_if_missing(document)                       # Auto-assign profile if not set


def master_delete_signal(sender, document, **kwargs):
    """
    Central post-delete coordinator.
    Triggered after a document is deleted — recalculates metrics to reflect the removal.

    Args:
        sender: The model class that triggered the signal.
        document: The deleted MongoEngine document instance.
    """
    master_sync_signal(sender, document, **kwargs)              # Same sync pipeline as post-save
    logging.info(f"[SIGNAL] {sender.__name__} deletion sync completed.")


# -------------------------------------------------------------------------
# MONITORED MODELS
# These models trigger the synchronization and profile-injection engine
# -------------------------------------------------------------------------
monitored_models = [
    Project, Course, Experience, Education,
    SelfStudy, Achievement, Goal, Skill
]


def register_signals():
    """
    Connects pre_save, post_save, and post_delete signals to all monitored models.
    Must be called exactly once inside create_app() in App/__init__.py.
    """
    for model in monitored_models:
        signals.pre_save.connect(master_pre_save_signal,   sender=model)   # Profile injection before save
        signals.post_save.connect(master_sync_signal,      sender=model)   # Full sync after save
        signals.post_delete.connect(master_delete_signal,  sender=model)   # Full sync after delete

    print("✅ All System Signals Registered Successfully.")