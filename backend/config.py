import os
from pathlib import Path
from dotenv import load_dotenv
import cloudinary

# Load environment variables from .env file
load_dotenv()


class Config:
    """
    Base configuration class for HussamAlshawi-Dev.
    Handles environment variables, Cloudinary setup, and Logging paths.
    """
    # 1. Project Metadata
    PROJECT_NAME = "HussamAlshawi-Dev"
    SECRET_KEY = os.getenv('SECRET_KEY')

    # 2. Cloudinary Credentials
    CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME')
    CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY')
    CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET')

    # 3. Database Settings (MongoDB Atlas)
    # Using MONGO_URI as the primary connection variable
    MONGO_URI = os.getenv('MONGO_URI')
    MONGO_DB_NAME = os.getenv('MONGO_DB_NAME', 'HussamDev')

    # 4. Path Management & Logging
    BASE_DIR = Path(__file__).resolve().parent
    LOG_DIR = BASE_DIR / 'logs'
    # Ensure logs directory exists locally
    LOG_DIR.mkdir(parents=True, exist_ok=True)

    @staticmethod
    def validate():
        """
        Ensures all critical environment variables are loaded.
        """
        critical_vars = [
            'SECRET_KEY',
            'MONGO_URI',
            'CLOUDINARY_CLOUD_NAME',
            'CLOUDINARY_API_KEY',
            'CLOUDINARY_API_SECRET'
        ]

        missing = [var for var in critical_vars if not os.getenv(var)]

        if missing:
            raise ValueError(f"[-] Critical Error: Missing environment variables: {', '.join(missing)}")

    @staticmethod
    def init_cloudinary():
        """
        Initializes the Cloudinary SDK for global use.
        """
        cloudinary.config(
            cloud_name=Config.CLOUDINARY_CLOUD_NAME,
            api_key=Config.CLOUDINARY_API_KEY,
            api_secret=Config.CLOUDINARY_API_SECRET,
            secure=True
        )


class DevelopmentConfig(Config):
    """Configuration for local development."""
    DEBUG = True
    ENV = 'development'


class ProductionConfig(Config):
    """Configuration for production deployment."""
    DEBUG = False
    ENV = 'production'


# Mapping configurations
config_map = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}


def get_config():
    """
    Factory function to return the validated configuration class.
    """
    env = os.getenv('FLASK_ENV', 'development').lower()
    selected_config = config_map.get(env, config_map['default'])

    # Validation and Service Initialization
    selected_config.validate()
    selected_config.init_cloudinary()

    return selected_config