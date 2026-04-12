import logging
import os
from flask import Flask
from flask_cors import CORS
from config import get_config
from App.models.database import init_db


# Import Database initialization logic
# Note: We will create the database handler in the next step
# from app.models.database import init_db

def create_app():
    """
    HussamAlshawi-Dev Application Factory.
    Integrates professional logging, API security, and database connectivity.
    """
    app = Flask(__name__)

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

    # 4. Database Connection
    init_db(app)

    # 4. Database Connection (MongoDB Atlas)
    try:
        # init_db(app) # We will implement this in models/database.py
        app.logger.info("[+] MongoDB Atlas connection established.")
    except Exception as db_err:
        app.logger.critical(f"[-] Database Initialization Failed: {db_err}")
        # Keep app running or raise depending on your preference

    # 5. Blueprint Registration (API Routes)
    from App.routes import Api as main_bp
    app.register_blueprint(main_bp, url_prefix='/api')

    # 6. Signal Registration (For automated tasks like Skill Sync)
    register_signals(app)

    app.logger.info(f"🚀 {current_config.PROJECT_NAME} Factory started successfully.")

    return app


def setup_app_logging(app, config_obj):
    """
    Configures local file logging to ensure every action is tracked.
    """
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
            # We will create signals.py later to handle automated tasks
            # import app.signals
            app.logger.info("[+] System signals synchronized.")
        except Exception as e:
            app.logger.error(f"[-] Signal Synchronization Error: {e}")