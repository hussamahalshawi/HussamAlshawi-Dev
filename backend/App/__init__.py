import logging                                                        # Error tracking
import os                                                             # OS environment utilities
from datetime import timedelta                                        # Session duration configuration
from flask import Flask                                               # Core Flask framework
from flask_cors import CORS                                           # Cross-Origin Resource Sharing
from flask_admin import Admin           # Admin dashboard framework
from flask_caching import Cache  # Server-side RAM cache library

cache = Cache()  # Create instance — attached to app later




from config import get_config                                         # Environment configuration factory
from App.models.database import init_db                              # MongoDB connection initializer

# --- MODEL IMPORTS ---
from App.models.my_media    import MediaVault                         # Media storage model
from App.models.profile     import Profile                            # Portfolio identity model
from App.models.education   import Education                          # Academic records model
from App.models.achievement import Achievement                        # Awards and recognition model
from App.models.category    import Category                           # Unified classification model
from App.models.course      import Course                             # Certifications model
from App.models.experience  import Experience                         # Work history model
from App.models.skills      import Skill, SkillType, ProfileSkill    # Skill system models
from App.models.self_study  import SelfStudy                          # Independent learning model
from App.models.project     import Project                            # Portfolio projects model
from App.models.goal        import Goal                               # Career roadmap model
from App.models.language import Language                      # Human language proficiency model
from App.models.feedback import Feedback                      # Visitor feedback and testimonials model

# --- ADMIN VIEW IMPORTS ---
from admin_views.my_media_view       import MediaVaultAdminView       # Media gallery view
from admin_views.profile_view        import ProfileAdminView          # Identity hub view
from admin_views.education_view      import EducationAdminView        # Academic records view
from admin_views.achievement_view    import AchievementAdminView      # Achievements view
from admin_views.category_view       import CategoryAdminView         # Category management view
from admin_views.course_view         import CourseAdminView           # Course records view
from admin_views.experience_view     import ExperienceAdminView       # Career history view
from admin_views.self_study_view     import SelfStudyAdminView        # Self-study tracker view
from admin_views.project_view        import ProjectAdminView          # Project portfolio view
from admin_views.goal_view           import GoalAdminView             # Career roadmap view
from admin_views.skill_view          import SkillAdminView, SkillTypeAdminView  # Skill management views
from admin_views.profile_skill_view  import ProfileSkillAdminView     # Read-only skill scores view
from admin_views.language_view import LanguageAdminView       # Language management view
from admin_views.feedback_view import FeedbackAdminView       # Feedback inbox and testimonials view

# --- AUTH IMPORTS ---
from admin_views.dashboard_view import DashboardIndexView             # New analytics dashboard index
from auth.routes       import auth_bp                                 # Login/logout route blueprint
from auth.cli          import cli_bp                                  # CLI commands (create-admin)


def create_app():
    """
    HussamAlshawi-Portfolio Application Factory.
    Configures authentication, logging, database, signals, and admin dashboard.
    All admin routes are protected by SecureAdminIndexView and SecureModelView.
    """

    # Step 1: Resolve template directory path
    template_dir = os.path.abspath('App/templates')                   # Absolute path to templates
    app = Flask(__name__, template_folder=template_dir)               # Initialize Flask app

    # -------------------------------------------------------------------------
    # STEP 2: CONFIGURATION
    # -------------------------------------------------------------------------
    try:
        current_config = get_config()                                  # Load and validate environment config
        app.config.from_object(current_config)                        # Apply to Flask app
    except Exception as e:
        print(f"[-] Critical Configuration Error: {e}")
        raise

    # -------------------------------------------------------------------------
    # STEP 3: SESSION SECURITY
    # -------------------------------------------------------------------------
    app.config['SECRET_KEY']           = app.config.get('SECRET_KEY')       # Required for session encryption
    app.config['SESSION_COOKIE_HTTPONLY'] = True                            # Prevent JS access to cookie
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'                          # CSRF protection
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=8)           # Session expires after 8 hours

    # Use Secure cookies in production (HTTPS only)
    if not app.config.get('DEBUG', True):
        app.config['SESSION_COOKIE_SECURE'] = True                          # HTTPS-only cookies in production

    # -------------------------------------------------------------------------
    # STEP 4: CORS
    # -------------------------------------------------------------------------
    CORS(app, resources={r'/api/*': {'origins': '*'}})
    # ── Server-side RAM Cache ─────────────────────────────────
    app.config['CACHE_TYPE'] = 'SimpleCache'  # Store in server RAM
    app.config['CACHE_DEFAULT_TIMEOUT'] = 300  # Expire after 5 minutes
    app.config['CACHE_THRESHOLD'] = 500  # Max 500 items in RAM
    cache.init_app(app)  # Attach cache to Flask app
    # Allow API access from any origin

    # -------------------------------------------------------------------------
    # STEP 5: LOGGING
    # -------------------------------------------------------------------------
    setup_app_logging(app, current_config)                            # Initialize file logging

    # -------------------------------------------------------------------------
    # STEP 6: DATABASE
    # -------------------------------------------------------------------------
    try:
        init_db(app)                                                   # Connect to MongoDB Atlas
        app.logger.info('[+] MongoDB Atlas connection active.')
    except Exception as db_err:
        app.logger.critical(f'[-] DB Connection Failed: {db_err}')
        raise db_err

    # -------------------------------------------------------------------------
    # STEP 7: AUTH BLUEPRINTS
    # -------------------------------------------------------------------------
    app.register_blueprint(auth_bp)                                   # Register /admin/login and /admin/logout
    app.register_blueprint(cli_bp)                                    # Register flask cli create-admin command

    # -------------------------------------------------------------------------
    # STEP 8: FLASK-ADMIN (Protected by SecureAdminIndexView)
    # -------------------------------------------------------------------------
    admin = Admin(
        app,
        name='HussamDev Admin',
        index_view=DashboardIndexView()  # ← Dashboard replaces blank index
    )

    # Identity & Profile
    admin.add_view(ProfileAdminView(Profile,     name='Personal Profile', category='Identity'))
    admin.add_view(EducationAdminView(Education, name='Education',        category='Identity'))
    admin.add_view(SelfStudyAdminView(SelfStudy, name='Self Study',       category='Identity'))
    admin.add_view(GoalAdminView(Goal,           name='Roadmap',          category='Identity'))
    admin.add_view(LanguageAdminView(Language, name='Languages', category='Identity'))
    admin.add_view(FeedbackAdminView(Feedback, name='Feedback Inbox', category='Engagement'))

    # Career & Professional
    admin.add_view(ExperienceAdminView(Experience,   name='Experience',   category='Professional'))
    admin.add_view(AchievementAdminView(Achievement, name='Achievements', category='Professional'))
    admin.add_view(CourseAdminView(Course,           name='Courses',      category='Professional'))

    # Technical Skills
    admin.add_view(SkillTypeAdminView(SkillType,       name='Skill Types',      category='Skills'))
    admin.add_view(SkillAdminView(Skill,               name='Skill Dictionary', category='Skills'))
    admin.add_view(ProfileSkillAdminView(ProfileSkill, name='Skill Scores',     category='Skills'))

    # Content & System
    admin.add_view(MediaVaultAdminView(MediaVault, name='Media Vault',       category='System'))
    admin.add_view(CategoryAdminView(Category,     name='Global Categories', category='System'))
    admin.add_view(ProjectAdminView(Project,       name='Projects',          category='Content'))

    # -------------------------------------------------------------------------
    # STEP 9: API ROUTES
    # -------------------------------------------------------------------------
    from App.routes.admin import Api as main_bp  # Dev cache-status route
    from App.routes.admin.dashboard_api import dashboard_bp  # Admin dashboard routes

    from App.routes.public.profile_api import portfolio_profile_bp  # GET /portfolio/profile
    from App.routes.public.skills_api import skills_public_bp  # GET /portfolio/skills
    from App.routes.public.feedback_api import feedback_bp  # POST/GET /feedback
    from App.routes.public.goals_api import goals_public_bp  # GET /portfolio/goals
    from App.routes.public.languages_api import languages_public_bp  # GET /portfolio/languages
    from App.routes.public.education_api import education_public_bp  # GET /portfolio/education
    from App.routes.public.courses_api import courses_public_bp  # GET /portfolio/courses
    from App.routes.public.achievements_api import achievements_public_bp  # GET /portfolio/achievements
    from App.routes.public.self_study_api import self_study_public_bp  # GET /portfolio/self-study
    from App.routes.public.experience_api import experience_public_bp  # GET /portfolio/experience
    from App.routes.public.projects_api import projects_public_bp  # GET /portfolio/projects

    from App.routes.charts.skills_charts_api import skills_charts_bp  # /api/charts/skills/*
    from App.routes.charts.career_charts_api import career_charts_bp  # /api/charts/career/*
    from App.routes.charts.learning_charts_api import learning_charts_bp  # /api/charts/learning/*
    from App.routes.charts.goals_charts_api import goals_charts_bp  # /api/charts/goals/*
    from App.routes.charts.analytics_api import analytics_public_bp  # /api/portfolio/analytics/*

    # ── Register all blueprints ────────────────────────────────────────────────
    app.register_blueprint(main_bp, url_prefix='/api')  # Dev routes
    app.register_blueprint(dashboard_bp, url_prefix='/api')  # Admin dashboard
    app.register_blueprint(portfolio_profile_bp, url_prefix='/api')  # Public profile
    app.register_blueprint(skills_public_bp, url_prefix='/api')  # Public skills
    app.register_blueprint(feedback_bp, url_prefix='/api')  # Feedback/contact
    app.register_blueprint(goals_public_bp, url_prefix='/api')  # Public goals
    app.register_blueprint(languages_public_bp, url_prefix='/api')  # Public languages
    app.register_blueprint(education_public_bp, url_prefix='/api')  # Public education
    app.register_blueprint(courses_public_bp, url_prefix='/api')  # Public courses
    app.register_blueprint(achievements_public_bp, url_prefix='/api')  # Public achievements
    app.register_blueprint(self_study_public_bp, url_prefix='/api')  # Public self-study
    app.register_blueprint(experience_public_bp, url_prefix='/api')  # Public experience
    app.register_blueprint(projects_public_bp, url_prefix='/api')  # Public projects
    app.register_blueprint(skills_charts_bp, url_prefix='/api')  # Charts: skills
    app.register_blueprint(career_charts_bp, url_prefix='/api')  # Charts: career
    app.register_blueprint(learning_charts_bp, url_prefix='/api')  # Charts: learning
    app.register_blueprint(goals_charts_bp, url_prefix='/api')  # Charts: goals
    app.register_blueprint(analytics_public_bp, url_prefix='/api')  # Charts: analytics

    # ── Suppress favicon 404 noise in logs ────────────────────────────────────
    from flask import send_file                                               # File serving utility
    import io                                                                 # In-memory byte stream

    @app.route('/favicon.ico')
    def favicon():
        """Returns an empty 1x1 transparent ICO — silences browser favicon 404 logs."""
        return send_file(
            io.BytesIO(bytes([                                                # Minimal valid ICO file bytes
                0,0,1,0,1,0,1,1,0,0,1,0,1,0,40,0,
                0,0,22,0,0,0,40,0,0,0,1,0,0,0,2,0,
                0,0,1,0,1,0,0,0,0,0,4,0,0,0,0,0,
                0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,
                255,0,0,0,0,0,0,0,0,0,0,0
            ])),
            mimetype='image/x-icon',                                          # ICO MIME type
            max_age=86400                                                      # Cache in browser for 24 hours
        )

    # -------------------------------------------------------------------------
    # STEP 10: SIGNALS (MongoEngine automation)
    # -------------------------------------------------------------------------
    register_signals(app)                                             # Connect all post_save signals

    app.logger.info(f'🚀 {current_config.PROJECT_NAME} is fully operational.')
    return app

def setup_app_logging(app, config_obj):
    """
    Configures persistent file logging for error tracking and system audits.
    Writes all INFO+ events to a local log file (never pushed to GitHub).

    Args:
        app: The Flask application instance.
        config_obj: The loaded configuration object with LOG_DIR defined.
    """
    if not os.path.exists(config_obj.LOG_DIR):
        os.makedirs(config_obj.LOG_DIR)                               # Create logs directory if missing

    log_file     = os.path.join(config_obj.LOG_DIR, 'hussam_dev.log')  # Log file path
    file_handler = logging.FileHandler(log_file)                       # Write logs to file
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'  # Detailed format
    ))

    logging.basicConfig(level=logging.INFO)                           # Set root logger level
    file_handler.setLevel(logging.INFO)                               # File handler logs INFO+
    app.logger.addHandler(file_handler)                               # Attach handler to Flask logger
    app.logger.setLevel(logging.INFO)                                 # Flask app logs INFO+
    app.logger.info('[+] Logging system initialized successfully.')


def register_signals(app):
    """
    Registers MongoEngine post_save signals for background automation.
    Must be called exactly once inside create_app() within app context.

    Args:
        app: The Flask application instance.
    """
    with app.app_context():                                           # Ensure app context is active
        try:
            from App.utils.signals import register_signals as start_system_signals
            start_system_signals()                                    # ← FIX: actually call the function
            app.logger.info('[+] System signals synchronized and listeners active.')
        except Exception as e:
            app.logger.error(f'[-] Signal Sync Failed: {e}')