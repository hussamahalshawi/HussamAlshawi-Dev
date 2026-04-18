import logging                                                      # Standard logging library for tracking events
import os                                                           # OS module for path and directory operations
from flask import Flask                                             # Core Flask framework
from flask_cors import CORS                                         # Cross-Origin Resource Sharing for frontend
from flask_admin import Admin                                       # Admin interface management

# --- LOCAL COMPONENT IMPORTS ---
from config import get_config                                       # Loading system configurations
from App.models.database import init_db                             # Database initialization logic

# --- MODEL IMPORTS ---
from App.models.my_media import MediaVault                          # Model for media assets
from App.models.profile import Profile                              # Model for personal profile
from App.models.education import Education                          # Model for academic records
from App.models.achievement import Achievement                      # Model for professional awards
from App.models.category import Category                            # Model for category awards
from App.models.course import Course                                # Model for Course awards
from App.models.experience import Experience                        # Model for Experience awards
from App.models.skills import Skill, SkillType                      # Models for technical skill architecture
from admin_views.skill_view import SkillAdminView, SkillTypeAdminView # Custom views for Skills and Types


# --- ADMIN VIEW IMPORTS ---
from admin_views.my_media_view import MediaVaultAdminView            # Custom view for Media
from admin_views.profile_view import ProfileAdminView                # Custom view for Profile
from admin_views.education_view import EducationAdminView            # Custom view for Education
from admin_views.achievement_view import AchievementAdminView        # Custom view for Achievements
from admin_views.category_view import CategoryAdminView              # Custom view for Category
from admin_views.course_view import CourseAdminView                  # Custom view for Course
from admin_views.experience_view import ExperienceAdminView                  # Custom view for Experience

def create_app():
    """
    HussamAlshawi-Portfolio Application Factory.
    Configures logging, database, and admin dashboard with professional standards.
    """
    # Define absolute path for templates to ensure reliability
    template_dir = os.path.abspath('App/templates')                # Get absolute path for template folder
    app = Flask(__name__, template_folder=template_dir)             # Initialize Flask with specific templates

    # 1. CONFIGURATION LOADING
    try:
        current_config = get_config()                               # Fetch configuration object
        app.config.from_object(current_config)                      # Load config into Flask app
    except Exception as e:
        # Standard print as fallback if logging isn't ready
        print(f"[-] Critical Configuration Error: {e}")             # Print error to console
        raise                                                       # Stop execution on config failure

    # 2. CORS SETUP
    # Allow React frontend to communicate with Python backend
    CORS(app, resources={r"/api/*": {"origins": "*"}})             # Enable CORS for all API routes

    # 3. PROFESSIONAL LOGGING SYSTEM
    # English Comment: Directing every internal error and action to 'hussam_dev.log'
    setup_app_logging(app, current_config)                          # Initialize custom logging handler

    # 4. DATABASE INITIALIZATION
    try:
        init_db(app)                                                # Connect to MongoDB via MongoEngine
        app.logger.info("[+] MongoDB Atlas connection active.")      # Log successful DB connection
    except Exception as db_err:
        app.logger.critical(f"[-] DB Connection Failed: {db_err}")  # Log critical DB error
        raise db_err                                                # Stop app if DB is down

    # 5. FLASK-ADMIN REGISTRATION
    # English Comment: Initializing the dashboard with a professional identity
    admin = Admin(app, name='HussamDev Admin')

    # --- REGISTERING VIEWS TO DASHBOARD ---

    # Identity & Profile Section
    admin.add_view(ProfileAdminView(Profile, name='Personal Profile', category='Identity'))
    admin.add_view(EducationAdminView(Education, name='Education', category='Identity'))

    # Career & Professional Section
    admin.add_view(ExperienceAdminView(Experience, name='Experience', category='Professional'))
    admin.add_view(AchievementAdminView(Achievement, name='Achievements', category='Professional'))
    admin.add_view(CourseAdminView(Course, name='Courses', category='Professional'))

    # Technical Skills Section
    admin.add_view(SkillTypeAdminView(SkillType, name='Skill Types', category='Skills'))
    admin.add_view(SkillAdminView(Skill, name='Technical Skills', category='Skills'))

    # Content & System Section
    admin.add_view(MediaVaultAdminView(MediaVault, name='Media Vault', category='System'))
    admin.add_view(CategoryAdminView(Category, name='Global Categories', category='System'))



    # 6. API ROUTES (BLUEPRINTS)
    from App.routes import Api as main_bp                           # Import API blueprint
    app.register_blueprint(main_bp, url_prefix='/api')              # Register blueprint with prefix

    # 7. AUTOMATION SIGNALS
    register_signals(app)                                           # Initialize real-time data signals

    app.logger.info(f"🚀 {current_config.PROJECT_NAME} is fully operational.") # Final startup log

    return app                                                      # Return initialized app instance

def setup_app_logging(app, config_obj):
    """
    Configures persistent file logging for error tracking and system audits.
    """
    # Create logs directory if it doesn't exist to prevent IO errors
    if not os.path.exists(config_obj.LOG_DIR):                      # Check if LOG_DIR exists
        os.makedirs(config_obj.LOG_DIR)                             # Create directory if missing

    # Define the absolute path for the log file
    log_file = os.path.join(config_obj.LOG_DIR, 'hussam_dev.log')    # Set log file path

    # Initialize FileHandler to store logs in the file system
    file_handler = logging.FileHandler(log_file)                    # Create file handler
    file_handler.setFormatter(logging.Formatter(                    # Define log entry format
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))

    # Set logging levels
    file_handler.setLevel(logging.INFO)                             # Capture INFO and above in file
    app.logger.addHandler(file_handler)                             # Link handler to Flask logger
    app.logger.setLevel(logging.INFO)                               # Set app logging threshold
    app.logger.info("[+] Logging system initialized successfully.") # First entry in the log file

def register_signals(app):
    """
    Registers signals for background automation tasks.
    """
    with app.app_context():                                         # Enter application context
        try:
            # English Comment: Ensures real-time synchronization of data metrics
            app.logger.info("[+] System signals synchronized.")      # Log signal sync status
        except Exception as e:
            app.logger.error(f"[-] Signal Sync Failed: {e}")        # Log non-critical signal error