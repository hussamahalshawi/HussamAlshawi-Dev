from mongoengine import Document, StringField, BooleanField, DateTimeField  # MongoDB field types
from datetime import datetime, timezone                                       # Timezone-aware timestamps
from werkzeug.security import generate_password_hash, check_password_hash    # Secure password hashing


class AdminUser(Document):
    """
    Admin User model for secure Flask-Admin authentication.
    Stores hashed passwords — never plain text.
    Supports role-based access control (is_super_admin flag).
    """

    # --- IDENTITY ---
    username = StringField(required=True, unique=True, max_length=50)  # Unique login identifier
    email    = StringField(required=True, unique=True)                 # Contact email for the admin

    # --- SECURITY ---
    password_hash = StringField(required=True)                         # bcrypt-hashed password — never plain

    # --- ACCESS CONTROL ---
    is_active      = BooleanField(default=True)                        # Disable account without deleting
    is_super_admin = BooleanField(default=False)                       # Full access flag

    # --- AUDIT ---
    created_at  = DateTimeField(default=lambda: datetime.now(timezone.utc))  # Account creation timestamp
    last_login  = DateTimeField()                                            # Last successful login timestamp
    last_failed = DateTimeField()                                            # Last failed attempt timestamp

    # --- BRUTE FORCE PROTECTION ---
    failed_attempts = StringField(default='0')                         # Count of consecutive failed logins

    meta = {
        'collection': 'admin_users',                                   # MongoDB collection name
        'indexes'   : ['username', 'email']                            # Optimized for fast login lookup
    }

    # -------------------------------------------------------------------------
    # PASSWORD MANAGEMENT
    # -------------------------------------------------------------------------

    def set_password(self, raw_password: str) -> None:
        """
        Hashes the raw password using Werkzeug's PBKDF2 and stores the hash.
        Never stores the plain text password.

        Args:
            raw_password (str): The plain text password entered by the admin.
        """
        self.password_hash = generate_password_hash(raw_password)      # Hash and store securely

    def check_password(self, raw_password: str) -> bool:
        """
        Verifies a plain text password against the stored hash.

        Args:
            raw_password (str): The password attempt to verify.

        Returns:
            bool: True if the password matches, False otherwise.
        """
        return check_password_hash(self.password_hash, raw_password)   # Compare hash safely

    # -------------------------------------------------------------------------
    # BRUTE FORCE HELPERS
    # -------------------------------------------------------------------------

    def increment_failed_attempts(self) -> None:
        """Increments the failed login counter and records the timestamp."""
        current = int(self.failed_attempts or '0')                     # Parse current count safely
        self.failed_attempts = str(current + 1)                        # Increment as string field
        self.last_failed     = datetime.now(timezone.utc)              # Record failure timestamp
        self.save()                                                     # Persist immediately

    def reset_failed_attempts(self) -> None:
        """Resets the failed counter on successful login."""
        self.failed_attempts = '0'                                     # Reset counter to zero
        self.last_login      = datetime.now(timezone.utc)              # Record successful login time
        self.save()                                                     # Persist immediately

    def is_locked(self) -> bool:
        """
        Checks if the account is temporarily locked due to too many failed attempts.
        Lock triggers after 5 consecutive failures.

        Returns:
            bool: True if the account is locked.
        """
        return int(self.failed_attempts or '0') >= 5                   # Lock after 5 failed attempts

    def __str__(self):
        """Returns username for admin dropdowns and log output."""
        return self.username