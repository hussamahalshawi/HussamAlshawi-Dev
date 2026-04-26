import logging
import os
from flask import Flask
from flask_cors import CORS
from flask_admin import Admin

from config import get_config
from App.models.database import init_db

# --- MODEL IMPORTS ---
from App.models.my_media    import MediaVault
from App.models.profile     import Profile
from App.models.education   import Education
from App.models.achievement import Achievement
from App.models.category    import Category
from App.models.course      import Course
from App.models.experience  import Experience
from App.models.skills      import Skill, SkillType, ProfileSkill    # ProfileSkill added
from App.models.self_study  import SelfStudy
from App.models.project     import Project
from App.models.goal        import Goal

# --- ADMIN VIEW IMPORTS ---
from admin_views.my_media_view       import MediaVaultAdminView
from admin_views.profile_view        import ProfileAdminView
from admin_views.education_view      import EducationAdminView
from admin_views.achievement_view    import AchievementAdminView
from admin_views.category_view       import CategoryAdminView
from admin_views.course_view         import CourseAdminView
from admin_views.experience_view     import ExperienceAdminView
from admin_views.self_study_view     import SelfStudyAdminView
from admin_views.project_view        import ProjectAdminView
from admin_views.goal_view           import GoalAdminView
from admin_views.skill_view          import SkillAdminView, SkillTypeAdminView
from admin_views.profile_skill_view  import ProfileSkillAdminView    # New read-only view


def create_app():
    """
    HussamAlshawi-Portfolio Application Factory.
    Configures logging, database, and admin dashboard.
    """
    template_dir = os.path.abspath('App/templates')
    app = Flask(__name__, template_folder=template_dir)

    # 1. CONFIGURATION
    try:
        current_config = get_config()
        app.config.from_object(current_config)
    except Exception as e:
        print(f"[-] Critical Configuration Error: {e}")
        raise

    # 2. CORS
    CORS(app, resources={r'/api/*': {'origins': '*'}})

    # 3. LOGGING
    setup_app_logging(app, current_config)

    # 4. DATABASE
    try:
        init_db(app)
        app.logger.info('[+] MongoDB Atlas connection active.')
    except Exception as db_err:
        app.logger.critical(f'[-] DB Connection Failed: {db_err}')
        raise db_err

    # 5. FLASK-ADMIN
    admin = Admin(app, name='HussamDev Admin')

    # Identity & Profile
    admin.add_view(ProfileAdminView(Profile,     name='Personal Profile', category='Identity'))
    admin.add_view(EducationAdminView(Education, name='Education',        category='Identity'))
    admin.add_view(SelfStudyAdminView(SelfStudy, name='Self Study',       category='Identity'))
    admin.add_view(GoalAdminView(Goal,           name='Roadmap',          category='Identity'))

    # Career & Professional
    admin.add_view(ExperienceAdminView(Experience,   name='Experience',   category='Professional'))
    admin.add_view(AchievementAdminView(Achievement, name='Achievements', category='Professional'))
    admin.add_view(CourseAdminView(Course,           name='Courses',      category='Professional'))

    # Technical Skills
    admin.add_view(SkillTypeAdminView(SkillType,     name='Skill Types',       category='Skills'))
    admin.add_view(SkillAdminView(Skill,             name='Skill Dictionary',  category='Skills'))
    admin.add_view(ProfileSkillAdminView(ProfileSkill, name='Skill Scores',    category='Skills'))  # New

    # Content & System
    admin.add_view(MediaVaultAdminView(MediaVault,  name='Media Vault',        category='System'))
    admin.add_view(CategoryAdminView(Category,      name='Global Categories',  category='System'))
    admin.add_view(ProjectAdminView(Project,        name='Projects',           category='Content'))

    # 6. API ROUTES
    from App.routes import Api as main_bp
    app.register_blueprint(main_bp, url_prefix='/api')

    # 7. SIGNALS
    register_signals(app)

    app.logger.info(f'🚀 {current_config.PROJECT_NAME} is fully operational.')
    return app


def setup_app_logging(app, config_obj):
    """Configures persistent file logging for error tracking and system audits."""
    if not os.path.exists(config_obj.LOG_DIR):
        os.makedirs(config_obj.LOG_DIR)

    log_file     = os.path.join(config_obj.LOG_DIR, 'hussam_dev.log')
    file_handler = logging.FileHandler(log_file)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))

    logging.basicConfig(level=logging.INFO)
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)
    app.logger.info('[+] Logging system initialized successfully.')


def register_signals(app):
    """Registers MongoEngine signals for background automation tasks."""
    with app.app_context():
        try:
            from App.utils.signals import register_signals as start_system_signals
            app.logger.info('[+] System signals synchronized and listeners active.')
        except Exception as e:
            app.logger.error(f'[-] Signal Sync Failed: {e}')