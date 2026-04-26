import logging                                                        # Error tracking
import secrets                                                        # Cryptographically secure tokens
from datetime import datetime, timezone, timedelta                    # Time utilities
from functools import wraps                                           # Decorator utility
from flask import session, redirect, url_for, request, flash          # Core Flask utilities
from auth.models.admin_user import AdminUser                          # Admin user model


# -------------------------------------------------------------------------
# CONSTANTS
# -------------------------------------------------------------------------
SESSION_KEY        = 'admin_authenticated'                            # Key stored in Flask session
SESSION_USER_KEY   = 'admin_username'                                 # Admin username in session
SESSION_EXPIRY_KEY = 'admin_session_expiry'                           # Session expiry timestamp key
SESSION_DURATION   = timedelta(hours=8)                               # Session valid for 8 hours
MAX_FAILED         = 5                                                # Max failed attempts before lockout
LOCKOUT_MINUTES    = 15                                               # Lockout duration in minutes


class AuthService:
    """
    Authentication Service:
    Centralizes all login, logout, and session validation logic.
    Implements brute force protection with account lockout.
    """

    # -------------------------------------------------------------------------
    # LOGIN
    # -------------------------------------------------------------------------

    @staticmethod
    def login(username: str, password: str) -> dict:
        """
        Validates admin credentials and creates an authenticated session.
        Implements brute force protection with progressive lockout.

        Args:
            username (str): The submitted username.
            password (str): The submitted plain text password.

        Returns:
            dict: {'success': bool, 'message': str}
        """
        # Step 1: Input sanitization — strip whitespace
        username = username.strip() if username else ''                # Sanitize username input
        password = password.strip() if password else ''                # Sanitize password input

        # Step 2: Reject empty inputs immediately
        if not username or not password:
            logging.warning(f"[AUTH] Login attempt with empty credentials from {request.remote_addr}")
            return {'success': False, 'message': 'Username and password are required.'}

        # Step 3: Fetch the admin user from database
        try:
            admin = AdminUser.objects(username=username).first()       # Query by username
        except Exception as e:
            logging.error(f"[AUTH] Database error during login lookup: {str(e)}")
            return {'success': False, 'message': 'Authentication service error. Please try again.'}

        # Step 4: Guard — user not found (use generic message to prevent enumeration)
        if not admin:
            logging.warning(f"[AUTH] Failed login — unknown username '{username}' from {request.remote_addr}")
            return {'success': False, 'message': 'Invalid username or password.'}

        # Step 5: Check if account is disabled
        if not admin.is_active:
            logging.warning(f"[AUTH] Login attempt on disabled account '{username}'")
            return {'success': False, 'message': 'This account has been deactivated.'}

        # Step 6: Check lockout status from too many failed attempts
        if admin.is_locked():
            # Calculate remaining lockout time
            if admin.last_failed:
                unlock_time = admin.last_failed + timedelta(minutes=LOCKOUT_MINUTES)  # Calculate unlock time
                now         = datetime.now(timezone.utc)              # Current UTC time

                # Ensure timezone awareness for comparison
                last_failed_aware = (
                    admin.last_failed.replace(tzinfo=timezone.utc)
                    if not admin.last_failed.tzinfo
                    else admin.last_failed
                )
                unlock_time = last_failed_aware + timedelta(minutes=LOCKOUT_MINUTES)

                if now < unlock_time:
                    # Still locked — calculate remaining minutes
                    remaining = int((unlock_time - now).total_seconds() / 60) + 1
                    logging.warning(f"[AUTH] Locked account '{username}' login attempt.")
                    return {
                        'success': False,
                        'message': f'Account locked. Try again in {remaining} minute(s).'
                    }
                else:
                    # Lockout expired — reset and allow attempt
                    admin.failed_attempts = '0'                        # Reset counter after lockout expires
                    admin.save()

        # Step 7: Verify password
        if not admin.check_password(password):
            admin.increment_failed_attempts()                          # Record failed attempt
            remaining_attempts = MAX_FAILED - int(admin.failed_attempts)
            logging.warning(
                f"[AUTH] Wrong password for '{username}' — "
                f"attempt {admin.failed_attempts}/{MAX_FAILED} from {request.remote_addr}"
            )

            if remaining_attempts <= 0:
                return {'success': False, 'message': f'Account locked for {LOCKOUT_MINUTES} minutes.'}

            return {
                'success': False,
                'message': f'Invalid username or password. {remaining_attempts} attempt(s) remaining.'
            }

        # Step 8: Successful login — create session
        admin.reset_failed_attempts()                                  # Clear failed counter

        session[SESSION_KEY]        = True                             # Mark session as authenticated
        session[SESSION_USER_KEY]   = admin.username                   # Store username in session
        session['admin_is_super']   = admin.is_super_admin             # Store super admin flag
        session.permanent           = True                             # Enable session expiry

        # Calculate expiry timestamp as ISO string
        expiry = datetime.now(timezone.utc) + SESSION_DURATION
        session[SESSION_EXPIRY_KEY] = expiry.isoformat()               # Store expiry as string

        logging.info(f"[AUTH] Successful login: '{username}' from {request.remote_addr}")
        return {'success': True, 'message': f'Welcome back, {admin.username}!'}

    # -------------------------------------------------------------------------
    # LOGOUT
    # -------------------------------------------------------------------------

    @staticmethod
    def logout() -> None:
        """
        Clears all authentication data from the current session.
        """
        username = session.get(SESSION_USER_KEY, 'unknown')            # Capture before clearing
        session.pop(SESSION_KEY,        None)                          # Remove auth flag
        session.pop(SESSION_USER_KEY,   None)                          # Remove username
        session.pop(SESSION_EXPIRY_KEY, None)                          # Remove expiry
        session.pop('admin_is_super',   None)                          # Remove super flag
        session.clear()                                                # Full session clear
        logging.info(f"[AUTH] Logout: '{username}' from {request.remote_addr}")

    # -------------------------------------------------------------------------
    # SESSION VALIDATION
    # -------------------------------------------------------------------------

    @staticmethod
    def is_authenticated() -> bool:
        """
        Checks if the current request has a valid, non-expired admin session.

        Returns:
            bool: True if authenticated and session is still valid.
        """
        # Check basic authentication flag
        if not session.get(SESSION_KEY):
            return False                                               # Not authenticated at all

        # Check session expiry
        expiry_str = session.get(SESSION_EXPIRY_KEY)
        if not expiry_str:
            return False                                               # No expiry set — invalid session

        try:
            expiry = datetime.fromisoformat(expiry_str)                # Parse stored ISO string
            now    = datetime.now(timezone.utc)                        # Current UTC time

            # Ensure expiry is timezone-aware for comparison
            if not expiry.tzinfo:
                expiry = expiry.replace(tzinfo=timezone.utc)           # Force UTC if naive

            if now > expiry:
                AuthService.logout()                                   # Expired — force logout
                return False

        except (ValueError, TypeError):
            AuthService.logout()                                       # Corrupt expiry — force logout
            return False

        return True                                                    # Valid, non-expired session

    # -------------------------------------------------------------------------
    # DECORATOR
    # -------------------------------------------------------------------------

    @staticmethod
    def login_required(f):
        """
        Decorator that protects any route requiring admin authentication.
        Redirects unauthenticated users to the login page.

        Usage:
            @AuthService.login_required
            def my_protected_view():
                ...
        """
        @wraps(f)                                                      # Preserve original function metadata
        def decorated(*args, **kwargs):
            if not AuthService.is_authenticated():
                # Store the originally requested URL for post-login redirect
                session['next_url'] = request.url
                flash('Please log in to access the admin panel.', 'warning')
                return redirect(url_for('auth.login_view'))            # Redirect to login page
            return f(*args, **kwargs)                                  # Proceed if authenticated
        return decorated