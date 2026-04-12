from flask import Blueprint, current_app, request

# English Comment: Use your specific variable name 'Api' as requested
Api = Blueprint('main', __name__)


@Api.route('/')
def index():
    """
    Main API entry point.
    Logs the access request to the local log file.
    """
    # English Comment: Log each successful hit to this route
    current_app.logger.info(f"Index route accessed by {request.remote_addr}")

    return {"Hello": "Hussam"}