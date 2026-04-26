from flask import redirect, url_for, session, flash, request         # Core Flask utilities
from flask_admin import AdminIndexView, expose                        # Flask-Admin base view
from flask_admin.contrib.mongoengine import ModelView                 # MongoEngine model view base
from auth.auth_service import AuthService                             # Centralized auth logic


class SecureAdminIndexView(AdminIndexView):
    """
    Secured Admin Index View:
    Overrides the default Flask-Admin dashboard to enforce authentication.
    Every request to /admin checks session validity before rendering.
    """

    @expose('/')
    def index(self):
        """
        Admin dashboard home.
        Redirects unauthenticated users to the login page.
        """
        if not AuthService.is_authenticated():
            # Store destination URL for post-login redirect
            session['next_url'] = request.url
            flash('Please log in to access the admin panel.', 'warning')
            return redirect(url_for('auth.login_view'))               # Force login

        return super().index()                                        # Render default admin home


class SecureModelView(ModelView):
    """
    Secured Model View Base:
    All Flask-Admin ModelViews must inherit from this class.
    Injects authentication check into every view method.
    """

    def is_accessible(self) -> bool:
        """
        Called by Flask-Admin before rendering any view.
        Returns True only if the user has a valid session.

        Returns:
            bool: True if authenticated, False otherwise.
        """
        return AuthService.is_authenticated()                         # Delegate to AuthService

    def inaccessible_callback(self, name, **kwargs):
        """
        Called when is_accessible() returns False.
        Stores the requested URL and redirects to login.

        Args:
            name: The view name being accessed.
        """
        session['next_url'] = request.url                             # Remember destination
        flash('Session expired. Please log in again.', 'warning')     # Notify user
        return redirect(url_for('auth.login_view'))                   # Force login