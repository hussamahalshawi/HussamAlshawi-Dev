import os
import sys
from App import create_app

# --- DESIGN PATTERN: SINGLETON-LIKE INSTANTIATION ---
# English Comment: Initialize the app instance once using the Factory Pattern.
try:
    # Ensure lowercase 'app' is used for the import directory
    app = create_app()
except Exception as e:
    # English Comment: Critical Error Handling if the Factory fails to build the app.
    print(f"[-] Critical Error: Failed to initialize HussamAlshawi-Dev: {e}")
    sys.exit(1)

def run_server():
    """
    Orchestrates the server startup with environment validation.
    Ensures the server runs on the correct host and port.
    """
    # English Comment: Extract port from environment or default to 5000.
    try:
        server_port = int(os.environ.get("PORT", 5000))
    except ValueError:
        server_port = 5000

    # English Comment: Fetch debug mode from app configuration.
    is_debug = app.config.get('DEBUG', True)

    try:
        # English Comment: Start the Flask server.
        # Host '0.0.0.0' is essential for Docker compatibility.
        app.run(
            host='0.0.0.0',
            port=server_port,
            debug=is_debug,
            use_reloader=is_debug
        )
    except Exception as startup_error:
        app.logger.critical(f"[-] Runtime Error: Server crashed during startup: {startup_error}")
        print(f"[-] Runtime Error: {startup_error}")

if __name__ == '__main__':
    # English Comment: Execution entry point.
    print(f"🚀 [{app.config.get('PROJECT_NAME')}] Starting server on port {5000}...")
    app.logger.info("Server startup sequence initiated via run.py")
    run_server()