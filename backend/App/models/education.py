from mongoengine import Document, StringField, DateTimeField, ListField
from datetime import datetime, timezone


class Education(Document):
    """
    Represents academic qualifications and formal schooling.
    Contributes to the weighted experience calculation within the Profile model.
    """

    # --- ACADEMIC IDENTITY ---
    institution = StringField(required=True)  # University, College, or School name
    degree = StringField(required=True)  # e.g., Bachelor's, Master's, PhD
    major = StringField(required=True)  # Field of study (e.g., Computer Science)

    # --- ACADEMIC PERFORMANCE ---
    grade = StringField()  # e.g., GPA 3.9/4.0 or Excellent
    description = StringField()  # Summary of academic achievements or thesis

    # --- TIMELINE MANAGEMENT ---
    # Crucial for calculating duration in the Profile's experience logic
    start_date = DateTimeField(required=True)
    end_date = DateTimeField(required=True)

    certificates = ListField(StringField())

    # --- SKILLS & GROWTH ---
    # Theoretical or practical skills acquired during the degree
    skills_learned = ListField(StringField())

    meta = {
        'collection': 'education',
        'ordering': ['-start_date'],  # Displays highest/latest education first
        'indexes': [
            'institution',
            'degree',
            'major',
            '-start_date'  # Optimized for chronological academic timeline sorting
        ]
    }

    def __str__(self):
        """Returns a standardized string representing the academic milestone."""
        return f"{self.institution} | {self.degree} in {self.major}"