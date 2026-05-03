from flask_admin import AdminIndexView, expose               # Flask-Admin base index view
from flask import redirect, url_for, session                  # Core Flask utilities
from auth.auth_service import AuthService                     # Authentication service


class DashboardIndexView(AdminIndexView):
    """
    Custom Admin Index View:
    Replaces the default Flask-Admin blank homepage with a full
    analytics dashboard showing profile metrics, skill charts,
    and goal progress visualizations.

    Authentication:
        Every request passes through is_accessible() → AuthService.is_authenticated().
        Unauthenticated users are redirected to /admin/login.
    """

    @expose('/')
    def index(self):
        """
        Renders the analytics dashboard as the /admin/ homepage.
        Redirects to login if the session is not authenticated.
        """
        if not AuthService.is_authenticated():                # Enforce authentication
            session['next_url'] = '/admin/'                   # Store redirect target
            return redirect(url_for('auth.login_view'))       # Send to login page

        return self.render('admin/dashboard.html')            # Render dashboard template