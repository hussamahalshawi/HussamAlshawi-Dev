import logging
import os
from flask import Flask
from flask_cors import CORS

# English Comment: Core application components
from config import get_config
from App.models.database import init_db

# 1. External Imports
from flask_admin import Admin

# 2. Local Imports from your new structure
# Import the Model from: backend/App/models/my_media.py
from App.models.my_media import MediaVault

# Import the Model from: backend/App/models/my_media.py
from App.models.profile import Profile

# Import the View from: backend/admin_views/my_media_views.py
from admin_views.my_media_views import MediaVaultAdminView

# Import the View from: backend/admin_views/profile_views.py
from admin_views.profile_views import ProfileAdminView




def create_app():
    """
    HussamAlshawi-Dev Application Factory.
    Integrates professional logging, API security, database connectivity, and Admin UI.
    """
    # Get the absolute path to the templates folder
    # This ensures Flask knows exactly where to look
    template_dir = os.path.abspath('App/templates')

    app = Flask(__name__, template_folder=template_dir)

    # 1. Configuration Loading & Validation
    try:
        current_config = get_config()
        app.config.from_object(current_config)
    except Exception as e:
        # Standard logging as per your requirement
        print(f"[-] Critical Configuration Error: {e}")
        raise

    # 2. Enable CORS for React Frontend Integration
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # 3. Logging System Setup (Recording every step in hussam_dev.log)
    setup_app_logging(app, current_config)

    # 4. Database Connection (MongoDB Atlas via MongoEngine)
    try:
        init_db(app)
        app.logger.info("[+] MongoDB Atlas connection established.")
    except Exception as db_err:
        app.logger.critical(f"[-] Database Initialization Failed: {db_err}")
        raise db_err

    # 5. Flask-Admin Setup
    # Initialize the Admin interface with a professional bootstrap4 theme
    admin = Admin(app, name='HussamDev Admin')

    # Register the MediaVault view instead of Profile
    # This connects the Model with the specialized View we created
    admin.add_view(MediaVaultAdminView(MediaVault, name='Media Library', category='Content'))
    admin.add_view(ProfileAdminView(Profile, name='Personal Profile', category='Identity'))

    # 6. Blueprint Registration (API Routes)
    # English Comment: Ensure the import matches your specific variable name 'Api'
    from App.routes import Api as main_bp
    app.register_blueprint(main_bp, url_prefix='/api')

    # 7. Signal Registration (For automated tasks like Skill Sync)
    register_signals(app)

    app.logger.info(f"🚀 {current_config.PROJECT_NAME} Factory started successfully.")

    return app


def setup_app_logging(app, config_obj):
    """
    Configures local file logging to ensure every action is tracked.
    """
    # English Comment: Ensure the log directory exists before creating the file
    if not os.path.exists(config_obj.LOG_DIR):
        os.makedirs(config_obj.LOG_DIR)

    log_file = os.path.join(config_obj.LOG_DIR, 'hussam_dev.log')

    file_handler = logging.FileHandler(log_file)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))

    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)
    app.logger.info("[+] Logging system is active.")


def register_signals(app):
    """
    Handles system signals for real-time automation logic.
    """
    with app.app_context():
        try:
            # English Comment: Placeholder for signals implementation
            # import App.signals
            app.logger.info("[+] System signals synchronized.")
        except Exception as e:
            app.logger.error(f"[-] Signal Synchronization Error: {e}")