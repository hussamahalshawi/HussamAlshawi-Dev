import click                                                          # CLI framework for Flask commands
import re                                                             # Regex for email validation
from flask import Blueprint                                           # Blueprint for command grouping
from auth.models.admin_user import AdminUser                          # Admin user model


# Register CLI commands under this blueprint
cli_bp = Blueprint('cli', __name__)                                   # Blueprint name for grouping


@cli_bp.cli.command('create-admin')
@click.option('--username', prompt='Admin username', help='The admin login username')
@click.option('--email',    prompt='Admin email',    help='The admin email address')
@click.option(
    '--password',
    prompt=True,
    hide_input=True,
    confirmation_prompt=True,
    help='The admin password (hidden input)'
)
@click.option('--super',    is_flag=True, default=False, help='Grant super admin privileges')
def create_admin(username: str, email: str, password: str, super: bool):
    """
    CLI command to create a new admin user.

    Usage:
        flask cli create-admin
        flask cli create-admin --username hussam --email h@dev.com --super

    This command is safe to run multiple times — it rejects duplicate usernames.
    """

    # Step 1: Validate username length
    if len(username.strip()) < 3:
        click.echo('❌ Error: Username must be at least 3 characters.')
        return                                                         # Abort on short username

    # Step 2: Validate email format
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, email.strip()):
        click.echo('❌ Error: Invalid email address format.')
        return                                                         # Abort on invalid email

    # Step 3: Validate password strength
    if len(password) < 8:
        click.echo('❌ Error: Password must be at least 8 characters.')
        return                                                         # Abort on weak password

    # Step 4: Check for duplicate username
    if AdminUser.objects(username=username.strip()).first():
        click.echo(f'❌ Error: Username "{username}" already exists.')
        return                                                         # Abort on duplicate

    # Step 5: Check for duplicate email
    if AdminUser.objects(email=email.strip()).first():
        click.echo(f'❌ Error: Email "{email}" is already registered.')
        return                                                         # Abort on duplicate email

    # Step 6: Create and save the admin user
    try:
        admin = AdminUser(
            username       = username.strip(),                         # Store trimmed username
            email          = email.strip().lower(),                    # Store lowercase email
            is_super_admin = super,                                    # Assign super admin flag
            is_active      = True                                      # Active by default
        )
        admin.set_password(password)                                   # Hash and store password
        admin.save()                                                   # Persist to MongoDB

        role_label = 'Super Admin' if super else 'Admin'               # Human-readable role label
        click.echo(f'✅ {role_label} "{username}" created successfully!')
        click.echo(f'   Email   : {email}')
        click.echo(f'   Role    : {role_label}')
        click.echo(f'   Login at: /admin/login')

    except Exception as e:
        click.echo(f'❌ Critical Error: Failed to create admin — {str(e)}')