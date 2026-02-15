"""
Prototype AI service for claim analysis.
Receives policy, uploaded documents metadata, and patient data; returns score, amount, readiness, notes, per-document feedback.
"""
from typing import Dict, Any, List
import random


class AIService:
    @staticmethod
    def analyze_claim(
        patient_data: Dict[str, Any],
        policy: Dict[str, Any],
        uploaded_documents: List[Dict[str, str]],
    ) -> Dict[str, Any]:
        """
        Returns:
            score: int 0-100
            estimated_amount: float
            readiness_flag: bool
            notes: str
            document_feedback: [{ document_name, feedback_note }, ...]
        """
        required_docs = policy.get("required_documents") or []
        doc_names = [d.get("document_name", "") for d in required_docs]
        uploaded_names = [d.get("document_name", "") for d in uploaded_documents]

        base_score = 50
        notes_parts = []
        document_feedback: List[Dict[str, str]] = []

        for req in required_docs:
            name = req.get("document_name", "")
            if name in uploaded_names:
                base_score += 10
                document_feedback.append({"document_name": name, "feedback_note": "Document received and accepted."})
            else:
                document_feedback.append({"document_name": name, "feedback_note": "Missing or not uploaded."})

        if len(uploaded_names) >= len(doc_names) and doc_names:
            notes_parts.append("Required documents appear complete.")
        else:
            notes_parts.append("Some required documents may be missing.")

        variance = random.randint(-5, 10)
        final_score = min(100, max(0, base_score + variance))
        estimated_amount = 10000.0 + (final_score * 100) + random.randint(0, 5000)
        readiness_threshold = 75
        is_ready = final_score >= readiness_threshold
        if is_ready:
            notes_parts.append("High confidence; suitable for review.")
        else:
            notes_parts.append("Recommend manual review.")

        return {
            "score": final_score,
            "estimated_amount": estimated_amount,
            "readiness_flag": is_ready,
            "notes": " ".join(notes_parts),
            "document_feedback": document_feedback,
        }
