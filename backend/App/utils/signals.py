from mongoengine import signals
import logging
import threading                                                       # Run sync pipeline in background thread
from App.models.project     import Project
from App.models.course      import Course
from App.models.experience  import Experience
from App.models.education   import Education
from App.models.self_study  import SelfStudy
from App.models.achievement import Achievement
from App.models.goal        import Goal
from App.models.profile     import Profile

from App.services.skill_service   import SkillService
from App.services.roadmap_service import RoadmapService
from App.services.profile_service import ProfileService


# -------------------------------------------------------------------------
# RECURSION GUARD
# Prevents the same document from being processed more than once at a time.
# goal.save() inside RoadmapService fires post_save again on the same Goal —
# this set detects that and returns early, breaking the loop.
# -------------------------------------------------------------------------
_signal_processing = set()                                             # Active document keys being synced
_signal_lock       = threading.Lock()                                  # Thread-safe access to the set


# -------------------------------------------------------------------------
# MODELS THAT CARRY A profile REFERENCE (ownership-enabled)
# -------------------------------------------------------------------------
PROFILE_OWNED_MODELS = (
    Course, Project, Education, SelfStudy,
    Achievement, Experience, Goal
)


def master_pre_save_signal(sender, document, **kwargs):
    """
    Triggered BEFORE any monitored document is saved.
    Auto-assigns the active Profile to new documents that have a profile field.

    This runs synchronously (before save) so it must stay in the request thread.

    Args:
        sender  : The model class that triggered the signal.
        document: The MongoEngine document about to be saved.
    """
    if not isinstance(document, PROFILE_OWNED_MODELS):
        return                                                         # Skip models without profile ownership

    if document.profile is not None:
        return                                                         # Already assigned — skip

    profile = Profile.objects.first()                                  # Fetch the single active profile

    if profile:
        document.profile = profile                                     # Assign before Flask-Admin saves
        logging.info(
            f"[SIGNAL pre_save] Auto-assigned profile to "
            f"{type(document).__name__}."
        )


def master_sync_signal(sender, document, **kwargs):
    """
    Triggered AFTER any monitored document is saved.

    Spawns a background daemon thread to run the full sync pipeline.
    This returns control to Flask immediately so the HTTP response is sent
    to the browser without waiting for recalculation to finish.

    The background thread runs:
        1. SkillService.recalculate_profile_scores()
        2. RoadmapService.sync_all_goals()
        3. ProfileService.calculate_metrics()

    Args:
        sender  : The model class that triggered the signal.
        document: The saved MongoEngine document instance.
    """
    # Resolve profile synchronously before spawning thread
    profile     = _resolve_profile(document)                           # Must run in request thread
    sender_name = sender.__name__                                      # Capture for logging in thread

    if not profile:
        logging.warning(
            f"[SIGNAL post_save] {sender_name}: no profile found — sync skipped."
        )
        return

    profile_id = profile.id                                            # Capture ID — safe to pass to thread

    # Build unique key to prevent duplicate processing of same document
    doc_key = f"{type(document).__name__}:{document.id}"               # e.g. "Course:507f..."

    with _signal_lock:                                                 # Thread-safe check and add
        if doc_key in _signal_processing:
            logging.debug(f"[SIGNAL GUARD] Skipping re-entrant sync for {doc_key}")
            return                                                     # Already in progress — skip
        _signal_processing.add(doc_key)                                # Mark as in-progress

    def run_pipeline():
        """
        Background thread: runs full recalculation without blocking HTTP response.
        Always clears the guard key in finally block.
        """
        try:
            # Re-fetch profile inside thread to get a fresh MongoDB connection context
            from App.models.profile import Profile as ProfileModel
            fresh_profile = ProfileModel.objects.get(id=profile_id)   # Fresh instance in thread

            # Step 1: Recalculate all ProfileSkill scores from scratch
            SkillService.recalculate_profile_scores(fresh_profile)

            # Step 2: Recalculate all goal progress scores for this profile
            RoadmapService.sync_all_goals(profile=fresh_profile)

            # Step 3: Refresh experience_years and overall_score on Profile
            ProfileService.calculate_metrics(profile_id)

            logging.info(
                f"[SIGNAL BACKGROUND] {sender_name} sync completed "
                f"for profile [{profile_id}]."
            )

        except Exception as e:
            logging.error(
                f"[SIGNAL BACKGROUND ERROR] {sender_name} sync failed "
                f"for profile [{profile_id}]: {str(e)}",
                exc_info=True
            )

        finally:
            with _signal_lock:                                         # Thread-safe removal
                _signal_processing.discard(doc_key)                    # Always clear — even on error

    # daemon=True: thread does not block application shutdown
    thread = threading.Thread(target=run_pipeline, daemon=True)        # Create background thread
    thread.start()                                                     # Launch — request continues immediately


def master_delete_signal(sender, document, **kwargs):
    """
    Triggered AFTER any monitored document is deleted.
    Reuses master_sync_signal so the pipeline runs in background after deletion too.

    Args:
        sender  : The model class that triggered the signal.
        document: The deleted MongoEngine document instance.
    """
    master_sync_signal(sender, document, **kwargs)                     # Same background pipeline
    logging.info(f"[SIGNAL post_delete] {sender.__name__} delete sync dispatched.")


def _resolve_profile(document):
    """
    Resolves the Profile that owns a given document.
    Called synchronously in the request thread before the background thread starts.

    Priority:
        1. document.profile — direct FK on ownership models.
        2. Profile.objects.first() — fallback for global models.

    Args:
        document: Any MongoEngine document instance.

    Returns:
        Profile | None
    """
    if hasattr(document, 'profile') and document.profile is not None:
        try:
            profile = document.profile
            return profile if hasattr(profile, 'full_name') else Profile.objects.get(id=profile.id)
        except Exception:
            pass                                                       # Fall through to fallback

    return Profile.objects.first()                                     # Global fallback


# -------------------------------------------------------------------------
# MONITORED MODELS
# Skill is excluded — its save() is called internally by _get_or_create_skill()
# and must never trigger a new pipeline.
# -------------------------------------------------------------------------
monitored_models = [
    Project, Course, Experience, Education,
    SelfStudy, Achievement, Goal
]


def register_signals():
    """
    Connects pre_save, post_save, and post_delete signals to all monitored models.
    Must be called exactly once inside create_app().
    """
    for model in monitored_models:
        signals.pre_save.connect(master_pre_save_signal,  sender=model)
        signals.post_save.connect(master_sync_signal,     sender=model)
        signals.post_delete.connect(master_delete_signal, sender=model)

    print("✅ All System Signals Registered Successfully.")