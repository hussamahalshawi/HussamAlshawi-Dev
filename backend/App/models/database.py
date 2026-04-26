import os
import certifi
from mongoengine import connect, disconnect
from flask import current_app

def init_db(app):
    """
    Initializes the MongoDB connection for HussamAlshawi-Dev.
    Directly pulls the database name and URI from the environment config.
    """
    try:
        # English Comment: Retrieve values from the central Config object (loaded from .env)
        db_uri = app.config.get('MONGO_URI')
        # English Comment: This will now correctly pull 'HussamDev' if set in your .env
        target_db = app.config.get('MONGO_DB_NAME')

        # English Comment: Ensure a fresh connection by clearing existing ones
        disconnect(alias='default')

        if db_uri and "mongodb+srv" in db_uri:
            # English Comment: Cloud Connection (Atlas)
            connect(
                host=db_uri,
                db=target_db,
                alias='default',
                tlsCAFile=certifi.where(),
                serverSelectionTimeoutMS=10000
            )
            app.logger.info(f"[+] Database: Successfully connected to Atlas [{target_db}]")
        else:
            # English Comment: Local Connection
            connect(
                db=target_db,
                host=app.config.get('MONGO_HOST', 'localhost'),
                port=int(app.config.get('MONGO_PORT', 27017)),
                alias='default'
            )
            app.logger.info(f"[+] Database: Connected to Local instance [{target_db}]")

    except Exception as e:
        # English Comment: Detailed logging of connection failures
        error_msg = f"[-] Database Connection Error: {str(e)}"
        if hasattr(app, 'logger'):
            app.logger.error(error_msg)
        raise e