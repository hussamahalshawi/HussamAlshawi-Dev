import logging                                                        # Error tracking
from flask import (                                                   # Core Flask utilities
    Blueprint, render_template, request,
    redirect, url_for, session, flash
)
from auth.auth_service import AuthService                             # Centralized authentication logic


# -------------------------------------------------------------------------
# BLUEPRINT REGISTRATION
# -------------------------------------------------------------------------
auth_bp = Blueprint(
    'auth',                                                           # Blueprint name — used in url_for('auth.xxx')
    __name__,
    template_folder='templates'                                       # Auth-specific templates folder
)


# -------------------------------------------------------------------------
# ROUTES
# -------------------------------------------------------------------------

@auth_bp.route('/admin/login', methods=['GET', 'POST'])
def login_view():
    """
    Admin login page.
    GET  — renders the login form.
    POST — processes credentials and redirects on success.
    """
    # Redirect already-authenticated users directly to admin panel
    if AuthService.is_authenticated():
        return redirect('/admin')                                     # Skip login if already logged in

    error   = None                                                    # Error message to display in template
    success = None                                                    # Success message (unused here, for consistency)

    if request.method == 'POST':
        # Extract form fields from POST body
        username = request.form.get('username', '').strip()           # Get submitted username
        password = request.form.get('password', '').strip()           # Get submitted password

        # Delegate to AuthService for full validation + session creation
        result = AuthService.login(username, password)

        if result['success']:
            # Login successful — redirect to originally requested URL or admin home
            next_url = session.pop('next_url', None)                  # Retrieve stored redirect URL
            return redirect(next_url or '/admin')                     # Go to next URL or admin home

        else:
            # Login failed — display error message
            error = result['message']
            logging.warning(f"[AUTH ROUTE] Failed login attempt for '{username}'")

    return render_template('auth/login.html', error=error)            # Render login form with error


@auth_bp.route('/admin/logout')
def logout_view():
    """
    Logs out the current admin user by clearing the session.
    Always redirects to the login page after logout.
    """
    AuthService.logout()                                              # Clear all session data
    flash('You have been logged out successfully.', 'info')           # Notify user
    return redirect(url_for('auth.login_view'))                       # Return to login page