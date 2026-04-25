from admin_views.admin_view import ProfessionalModelView       # Base view for consistent UI


class ProfileSkillAdminView(ProfessionalModelView):
    """
    ProfileSkill Read-Only View:
    Displays the automatically calculated skill scores per profile.
    Scores are never edited manually — they are always recalculated
    by SkillService.recalculate_profile_scores() from source records.

    This view is intentionally read-only to prevent manual score manipulation.
    """

    # --- TEMPLATE CONFIGURATION ---
    create_template = 'admin/model/create.html'
    edit_template   = 'admin/model/create.html'

    create_modal = False
    edit_modal   = False

    # --- PERMISSIONS ---
    # Read-only: scores are auto-calculated, manual editing is disabled
    can_create = False                                         # Scores are auto-generated
    can_edit   = False                                         # Scores are auto-calculated
    can_delete = True                                          # Allow cleanup of stale entries

    # --- LIST VIEW DISPLAY ---
    column_list = ('profile', 'skill', 'score', 'last_updated')

    column_labels = {
        'profile'     : 'Owner',                              # Which profile owns this score
        'skill'       : 'Skill',                              # Which skill from the global dictionary
        'score'       : 'Score %',                            # Calculated proficiency percentage
        'last_updated': 'Last Sync'                           # When this score was last recalculated
    }

    # --- UI INTERACTION ---
    column_filters         = ['profile', 'score']             # Filter by profile or score range
    column_searchable_list = ['skill']                        # Search by skill name
    column_default_sort    = ('score', True)                  # Show highest scores first