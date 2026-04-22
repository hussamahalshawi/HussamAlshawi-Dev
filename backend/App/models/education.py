from mongoengine import Document, StringField, DateTimeField, ListField, ReferenceField
from datetime import datetime, timezone                        # Standard utilities for time management


class Education(Document):
    """
    Represents academic qualifications and formal schooling.
    Linked to a Profile to scope records to a single portfolio owner.
    Contributes to the weighted experience calculation within the Profile model.
    """

    # --- OWNERSHIP ---
    # Every education record belongs to exactly one portfolio profile
    profile = ReferenceField('Profile', required=False)        # FK → Profile (lazy string ref avoids circular import)

    # --- ACADEMIC IDENTITY ---
    institution = StringField(required=True)                   # University, College, or School name
    degree      = StringField(required=True)                   # e.g., Bachelor's, Master's, PhD
    major       = StringField(required=True)                   # Field of study (e.g., Computer Science)

    # --- ACADEMIC PERFORMANCE ---
    grade       = StringField()                                # e.g., GPA 3.9/4.0 or Excellent
    description = StringField()                                # Summary of academic achievements or thesis

    # --- TIMELINE MANAGEMENT ---
    # Crucial for calculating duration in the Profile's experience logic
    start_date = DateTimeField(required=True)                  # Enrollment start date
    end_date   = DateTimeField(required=True)                  # Graduation or expected end date

    # --- CERTIFICATES ---
    certificates = ListField(StringField())                    # Cloudinary URLs for uploaded certificates

    # --- SKILLS & GROWTH ---
    # Theoretical or practical skills acquired during the degree
    skills_learned = ListField(StringField())                  # Tags processed by the master sync signal

    meta = {
        'collection': 'education',                             # Database collection name
        'ordering'  : ['-start_date'],                         # Displays highest/latest education first
        'indexes'   : [
            'profile',                                         # Optimized for per-profile queries
            'institution',
            'degree',
            'major',
            '-start_date'                                      # Optimized for chronological academic timeline sorting
        ]
    }

    def __str__(self):
        """Returns a standardized string representing the academic milestone."""
        return f"{self.institution} | {self.degree} in {self.major}"