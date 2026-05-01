from mongoengine import signals
import logging
import threading
import queue
import time
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
# QUEUE + COOLDOWN SYSTEM
# Single worker thread processes one profile at a time.
# Cooldown merges rapid consecutive saves into one pipeline run.
# -------------------------------------------------------------------------
_pipeline_queue   = queue.Queue()                                      # FIFO queue for sync jobs
_pending_profiles = set()                                              # Profiles waiting in queue
_pending_lock     = threading.Lock()                                   # Thread-safe set access
_worker_started   = False                                              # Single worker guard
_worker_lock      = threading.Lock()                                   # Thread-safe worker start

COOLDOWN_SECONDS  = 2                                                  # Wait 2s after job before next


def _pipeline_worker():
    """
    Single background daemon thread.
    Processes one profile sync at a time with a cooldown between jobs.
    Cooldown allows rapid consecutive saves to merge into one pipeline run.
    """
    while True:
        try:
            profile_id = _pipeline_queue.get(timeout=5)               # Block until job arrives

            # Cooldown: wait briefly to absorb any rapid follow-up saves
            # Any additional saves during this window are deduplicated and skipped
            time.sleep(COOLDOWN_SECONDS)                               # Merge window

            try:
                from App.models.profile import Profile as ProfileModel
                fresh_profile = ProfileModel.objects.get(id=profile_id)

                logging.info(f"[QUEUE WORKER] Starting pipeline for profile [{profile_id}]")

                # Step 1: Recalculate all ProfileSkill scores
                SkillService.recalculate_profile_scores(fresh_profile)

                # Step 2: Sync all goal progress scores
                RoadmapService.sync_all_goals(profile=fresh_profile)

                # Step 3: Refresh experience_years and overall_score
                ProfileService.calculate_metrics(profile_id)

                logging.info(f"[QUEUE WORKER] Pipeline completed for profile [{profile_id}]")

            except Exception as e:
                logging.error(
                    f"[QUEUE WORKER ERROR] Pipeline failed for profile [{profile_id}]: {str(e)}",
                    exc_info=True
                )
            finally:
                with _pending_lock:
                    _pending_profiles.discard(str(profile_id))         # Release dedup lock
                _pipeline_queue.task_done()

        except queue.Empty:
            continue                                                    # No jobs — loop and wait


def _ensure_worker_running():
    """Starts the background worker thread exactly once."""
    global _worker_started

    with _worker_lock:
        if not _worker_started:
            worker = threading.Thread(target=_pipeline_worker, daemon=True)
            worker.start()
            _worker_started = True
            logging.info("[QUEUE WORKER] Background pipeline worker started.")


def _enqueue_pipeline(profile_id):
    """
    Adds a profile sync job to the queue if not already pending.
    Deduplication: same profile queued twice → only runs once.
    """
    _ensure_worker_running()

    str_id = str(profile_id)

    with _pending_lock:
        if str_id in _pending_profiles:
            logging.debug(f"[QUEUE] Profile [{str_id}] already queued — skipping duplicate.")
            return

        _pending_profiles.add(str_id)
        _pipeline_queue.put(profile_id)
        logging.debug(f"[QUEUE] Profile [{str_id}] enqueued for pipeline.")


PROFILE_OWNED_MODELS = (
    Course, Project, Education, SelfStudy,
    Achievement, Experience, Goal
)


def master_pre_save_signal(sender, document, **kwargs):
    """Auto-assigns the active Profile to new documents before save."""
    if not isinstance(document, PROFILE_OWNED_MODELS):
        return

    if document.profile is not None:
        return

    profile = Profile.objects.first()

    if profile:
        document.profile = profile
        logging.info(f"[SIGNAL pre_save] Auto-assigned profile to {type(document).__name__}.")


def master_sync_signal(sender, document, **kwargs):
    """Enqueues a pipeline sync job after any monitored document is saved."""
    profile = _resolve_profile(document)

    if not profile:
        logging.warning(f"[SIGNAL post_save] {sender.__name__}: no profile — sync skipped.")
        return

    _enqueue_pipeline(profile.id)


def master_delete_signal(sender, document, **kwargs):
    """Enqueues a pipeline sync job after any monitored document is deleted."""
    profile = _resolve_profile(document)

    if not profile:
        logging.warning(f"[SIGNAL post_delete] {sender.__name__}: no profile — sync skipped.")
        return

    logging.info(f"[SIGNAL post_delete] {sender.__name__} deleted — enqueuing pipeline.")
    _enqueue_pipeline(profile.id)


def _resolve_profile(document):
    """Resolves the Profile that owns a given document."""
    if hasattr(document, 'profile') and document.profile is not None:
        try:
            profile = document.profile
            return profile if hasattr(profile, 'full_name') else Profile.objects.get(id=profile.id)
        except Exception:
            pass

    return Profile.objects.first()


monitored_models = [
    Project, Course, Experience, Education,
    SelfStudy, Achievement, Goal
]


def register_signals():
    """
    Connects signals to all monitored models and starts the worker thread.
    Must be called exactly once inside create_app().
    """
    for model in monitored_models:
        signals.pre_save.connect(master_pre_save_signal,  sender=model)
        signals.post_save.connect(master_sync_signal,     sender=model)
        signals.post_delete.connect(master_delete_signal, sender=model)

    _ensure_worker_running()
    print("✅ All System Signals Registered Successfully.")