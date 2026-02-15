import random
from typing import List
from app.models.policy import RequiredDocument

class AIService:
    @staticmethod
    def analyze_policy_pdf(file_path: str) -> List[RequiredDocument]:
        """
        Dummy AI service that simulates policy analysis and returns 
        suggested required documents.
        """
        possible_docs = [
            ("Discharge Summary", "Summary of the patient's hospital stay and treatment."),
            ("Final Bill", "The itemized final bill provided by the hospital."),
            ("Diagnosis Report", "Official document confirming the medical diagnosis."),
            ("ID Card", "Patient's national ID or insurance card."),
            ("Lab Results", "Reports for laboratory tests performed during stay."),
            ("Pharmacy Invoices", "Bills for medications purchased separately."),
            ("Operation Theater Notes", "Detailed notes from any surgical procedures.")
        ]
        
        # Select 3-5 random documents as suggestions
        count = random.randint(3, 5)
        suggestions = random.sample(possible_docs, count)
        
        return [
            RequiredDocument(
                document_name=name,
                description=desc,
                notes="AI suggested based on policy analysis",
                mandatory=True
            ) for name, desc in suggestions
        ]
