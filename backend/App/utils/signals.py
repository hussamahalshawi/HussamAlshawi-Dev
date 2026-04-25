from mongoengine import signals
import logging
from App.models.project     import Project
from App.models.course      import Course
from App.models.experience  import Experience
from App.models.education   import Education
from App.models.self_study  import SelfStudy
from App.models.achievement import Achievement
from App.models.goal        import Goal
from App.models.skills      import Skill
from App.models.profile     import Profile

from App.services.skill_service   import SkillService
from App.services.roadmap_service import RoadmapService
from App.services.profile_service import ProfileService


# -------------------------------------------------------------------------
# MODELS THAT CARRY A profile REFERENCE (ownership-enabled)
# -------------------------------------------------------------------------
PROFILE_OWNED_MODELS = (
    Course, Project, Education, SelfStudy,
    Achievement, Experience, Goal
)


def master_pre_save_signal(sender, document, **kwargs):
    """
    Triggered before any monitored document is saved to MongoDB.
    Automatically assigns the active portfolio profile to new documents
    that have a 'profile' field but haven't been assigned one yet.

    This ensures every new record is owned by a profile without
    requiring the admin user to select one manually in the form.

    Args:
        sender: The model class that triggered the signal.
        document: The MongoEngine document about to be saved.
    """
    # Only handle models that support profile ownership
    if not isinstance(document, PROFILE_OWNED_MODELS):
        return

    # Skip if profile is already assigned (edit scenario — don't overwrite)
    if document.profile is not None:
        return

    # Fetch the single active portfolio profile
    profile = Profile.objects.first()

    if profile:
        document.profile = profile                             # Assign ownership before save
        logging.info(
            f"[SIGNAL pre_save] Auto-assigned profile to new "
            f"{type(document).__name__} document."
        )


def master_sync_signal(sender, document, **kwargs):
    """
    Triggered after any monitored document is saved to MongoDB.

    Runs a full recalculation pipeline for the profile that owns this document:
    1. Recalculate all ProfileSkill scores from scratch (NEVER increment).
    2. Recalculate all goal progress scores.
    3. Refresh profile-level metrics (experience_years, overall_score).

    Because scores are recalculated from scratch on every trigger,
    editing any field without changing skill lists produces the same scores.
    No score inflation occurs on repeated saves.

    Args:
        sender: The model class that triggered the signal.
        document: The saved MongoEngine document instance.
    """
    try:
        # Step 1: Determine the owning profile for this document
        profile = _resolve_profile(document)

        if not profile:
            logging.warning(
                f"[SIGNAL post_save] {sender.__name__}: no profile found — sync skipped."
            )
            return

        # Step 2: Recalculate all ProfileSkill scores for this profile from scratch
        SkillService.recalculate_profile_scores(profile)

        # Step 3: Recalculate all goal progress scores scoped to this profile
        RoadmapService.sync_all_goals(profile=profile)

        # Step 4: Refresh profile-level metrics (experience_years, overall_score)
        ProfileService.calculate_metrics(profile.id)

        logging.info(
            f"[SIGNAL post_save] {sender.__name__} sync completed "
            f"for profile [{profile.id}]."
        )

    except Exception as e:
        logging.error(
            f"[SIGNAL ERROR] {sender.__name__} post_save failed: {str(e)}",
            exc_info=True
        )


def master_delete_signal(sender, document, **kwargs):
    """
    Triggered after any monitored document is deleted from MongoDB.
    Runs the same recalculation pipeline as post_save so that
    removing a record correctly decreases skill scores.

    Args:
        sender: The model class that triggered the signal.
        document: The deleted MongoEngine document instance.
    """
    master_sync_signal(sender, document, **kwargs)
    logging.info(f"[SIGNAL post_delete] {sender.__name__} deletion sync completed.")


def _resolve_profile(document):
    """
    Resolves the Profile that owns a given document.

    Priority:
    1. document.profile — direct reference on ownership-enabled models.
    2. Profile.objects.first() — fallback for global models (Skill, etc.).

    Args:
        document: Any MongoEngine document instance.

    Returns:
        Profile | None: The resolved profile, or None if not found.
    """
    # For models with a direct profile reference
    if hasattr(document, 'profile') and document.profile is not None:
        try:
            profile = document.profile
            # Return as-is if it's a full Profile document, otherwise dereference
            return profile if hasattr(profile, 'full_name') else Profile.objects.get(id=profile)
        except Exception:
            pass

    # Fallback for global models like Skill
    return Profile.objects.first()


# -------------------------------------------------------------------------
# MONITORED MODELS
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
        signals.pre_save.connect(master_pre_save_signal,   sender=model)
        signals.post_save.connect(master_sync_signal,      sender=model)
        signals.post_delete.connect(master_delete_signal,  sender=model)

    print("✅ All System Signals Registered Successfully.")