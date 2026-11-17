"""Run with:  python -m unittest test_backend -v

The Gemini API is faked here, so these tests need no API key and make no network calls.
"""
import json
import unittest
from io import BytesIO
from unittest.mock import patch

import pymupdf
from google.genai import errors

import ai_analyzer
import scoring
from app import app

RESUME_LINES = [
    "Jane Doe", "jane.doe@example.com | +1 555 123 4567 | github.com/janedoe",
    "EDUCATION", "B.Tech in Computer Science, Example University, 2022-2026, CGPA 8.4",
    "SKILLS", "Python, Flask, SQL, JavaScript, Git, Communication, Teamwork",
    "PROJECTS", "Library App - built a REST API with Flask and SQLite used by 40 students",
    "Chat Bot - created a Telegram bot in Python that answers FAQs",
    "EXPERIENCE", "Web Development Intern, Acme Pvt Ltd, Summer 2025 - fixed 12 UI bugs",
    "CERTIFICATIONS", "Python for Everybody - Coursera",
]


def make_pdf(lines=None, scanned=False):
    doc = pymupdf.open()
    page = doc.new_page()
    if scanned:
        pixmap = pymupdf.Pixmap(pymupdf.csRGB, pymupdf.IRect(0, 0, 200, 200), False)
        pixmap.clear_with(180)
        page.insert_image(pymupdf.Rect(50, 50, 300, 300), pixmap=pixmap)
    elif lines:
        page.insert_text((72, 72), "\n".join(lines), fontsize=10)
    data = doc.tobytes()
    doc.close()
    return data


def good_ai_reply():
    return json.dumps({
        "overall_summary": "A clear fresher resume with solid projects.",
        "strengths": [{"title": "Clear projects", "detail": "Library App shows a measurable result."}],
        "weaknesses": [{"title": "No summary", "detail": "There is no profile statement at the top."}],
        "missing_elements": [{"element": "Professional summary", "detail": "Add 2 lines at the top.", "importance": "Important"}],
        "suggestions": [{"title": "Add a summary", "detail": "Explain your focus.", "next_step": "Write 2 lines.", "priority": "High"}],
        "category_scores": {
            "content_completeness": 80, "skills_presentation": 70, "projects_achievements": 90,
            "education_experience": 60, "structure_organization": 50, "clarity_readability": 40,
        },
        "category_feedback": [{"category": "Skills presentation", "summary": "Group skills.", "detail": "Split languages and tools."}],
        "sections_to_rewrite": [{"section": "Projects", "issue": "Tools are unclear.", "improvement": "Action + tool + [result]."}],
    })


class FakeClient:
    """Stands in for genai.Client. `reply` is a JSON string or an exception to raise."""

    def __init__(self, reply):
        self.models = self
        self._reply = reply

    def generate_content(self, **kwargs):
        if isinstance(self._reply, Exception):
            raise self._reply
        return type("Response", (), {"text": self._reply})()


class ScoringTests(unittest.TestCase):
    def test_weighted_formula(self):
        scores = {"content_completeness": 80, "skills_presentation": 70, "projects_achievements": 90,
                  "education_experience": 60, "structure_organization": 50, "clarity_readability": 40}
        # 20 + 14 + 18 + 9 + 5 + 4 = 70
        self.assertEqual(scoring.calculate_overall_score(scores), 70)

    def test_out_of_range_scores_are_clamped(self):
        high = {key: 500 for key in scoring.CATEGORIES}
        low = {key: -20 for key in scoring.CATEGORIES}
        self.assertEqual(scoring.calculate_overall_score(high), 100)
        self.assertEqual(scoring.calculate_overall_score(low), 0)


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def upload(self, data, filename="resume.pdf"):
        return self.client.post("/api/analyze", data={"resume": (BytesIO(data), filename)},
                                content_type="multipart/form-data")

    def with_ai(self, reply):
        return patch.multiple(ai_analyzer, _client=lambda: FakeClient(reply))

    def test_api_allows_github_pages_origin(self):
        response = self.client.get(
            "/api/health",
            headers={"Origin": "https://shriyash-kurud.github.io"},
        )
        self.assertEqual(response.headers.get("Access-Control-Allow-Origin"), "https://shriyash-kurud.github.io")

    # 1. Valid, complete resume
    def test_1_valid_resume(self):
        with self.with_ai(good_ai_reply()):
            response = self.upload(make_pdf(RESUME_LINES))
        body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(body["overall_score"], 70)
        self.assertEqual(len(body["category_scores"]), 6)
        self.assertIn("not a prediction of hiring success", body["disclaimer"])

    # 2. Very little information (long enough to read, so it still gets analysed)
    def test_2_short_resume_still_analysed(self):
        short = ["Jane Doe", "jane.doe@example.com", "B.Tech Computer Science student at Example University",
                 "Skills: Python, SQL", "Interested in web development and learning new tools"]
        with self.with_ai(good_ai_reply()):
            self.assertEqual(self.upload(make_pdf(short)).status_code, 200)

    # 3. Missing sections: the AI reports them, the backend passes them through
    def test_3_missing_sections_reported(self):
        with self.with_ai(good_ai_reply()):
            body = self.upload(make_pdf(RESUME_LINES[:6])).get_json()
        self.assertTrue(body["missing_elements"])

    # 4. Empty PDF (a blank page)
    def test_4_empty_pdf(self):
        response = self.upload(make_pdf())
        self.assertEqual(response.status_code, 422)
        self.assertIn("text-based PDF", response.get_json()["error"])

    def test_4b_zero_byte_file(self):
        self.assertEqual(self.upload(b"").status_code, 400)

    # 5. Corrupted PDF
    def test_5_corrupted_pdf(self):
        response = self.upload(b"%PDF-1.7\nthis is not really a pdf\n" + b"\x00" * 50)
        self.assertEqual(response.status_code, 422)
        self.assertIn("corrupted", response.get_json()["error"])

    # 6. Scanned / image-only PDF
    def test_6_scanned_pdf(self):
        response = self.upload(make_pdf(scanned=True))
        self.assertEqual(response.status_code, 422)
        self.assertIn("scanned", response.get_json()["error"])

    # 7. Unsupported format
    def test_7_unsupported_extension(self):
        self.assertEqual(self.upload(b"hello", "resume.docx").status_code, 415)

    def test_7b_renamed_non_pdf(self):
        self.assertEqual(self.upload(b"just some text, not a pdf", "resume.pdf").status_code, 415)

    # 8. Larger than 10 MB
    def test_8_file_too_large(self):
        big = b"%PDF-1.7\n" + b"0" * (10 * 1024 * 1024 + 10)
        response = self.upload(big)
        self.assertEqual(response.status_code, 413)
        self.assertIn("10 MB", response.get_json()["error"])

    # 9. Gemini failures
    def test_9a_rate_limit(self):
        error = errors.ClientError(429, {"error": {"status": "RESOURCE_EXHAUSTED", "message": "quota"}})
        with self.with_ai(error):
            response = self.upload(make_pdf(RESUME_LINES))
        self.assertEqual(response.status_code, 429)

    def test_9b_server_error(self):
        error = errors.ServerError(503, {"error": {"status": "UNAVAILABLE", "message": "overloaded"}})
        with self.with_ai(error):
            self.assertEqual(self.upload(make_pdf(RESUME_LINES)).status_code, 503)

    def test_9b2_falls_back_to_next_model_when_overloaded(self):
        overloaded = errors.ServerError(503, {"error": {"status": "UNAVAILABLE", "message": "overloaded"}})
        tried = []

        class FirstModelOverloaded(FakeClient):
            def generate_content(self, **kwargs):
                tried.append(kwargs["model"])
                if len(tried) == 1:
                    raise overloaded
                return type("Response", (), {"text": good_ai_reply()})()

        with patch.multiple(ai_analyzer, _client=lambda: FirstModelOverloaded(None)):
            response = self.upload(make_pdf(RESUME_LINES))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(tried), 2)
        self.assertNotEqual(tried[0], tried[1])

    def test_9c_network_failure(self):
        with self.with_ai(ConnectionError("no network")):
            self.assertEqual(self.upload(make_pdf(RESUME_LINES)).status_code, 503)

    def test_9d_missing_api_key(self):
        with patch.dict("os.environ", {"GEMINI_API_KEY": ""}):
            response = self.upload(make_pdf(RESUME_LINES))
        self.assertEqual(response.status_code, 500)
        self.assertIn("GEMINI_API_KEY", response.get_json()["error"])

    # 10. Invalid or incomplete AI response
    def test_10a_not_json(self):
        with self.with_ai("Sorry, I cannot help with that."):
            self.assertEqual(self.upload(make_pdf(RESUME_LINES)).status_code, 502)

    def test_10b_missing_fields(self):
        with self.with_ai('{"overall_summary": "Only a summary"}'):
            self.assertEqual(self.upload(make_pdf(RESUME_LINES)).status_code, 502)

    def test_10c_empty_reply(self):
        with self.with_ai(None):
            self.assertEqual(self.upload(make_pdf(RESUME_LINES)).status_code, 502)

    # Extra: internal field names leaked by the AI are shown as readable labels
    def test_field_names_are_made_readable(self):
        reply = json.loads(good_ai_reply())
        reply["category_feedback"] = [{"category": "content_completeness", "summary": "Fine.",
                                       "detail": "Your skills_presentation is clear but next_step is vague."}]
        with self.with_ai(json.dumps(reply)):
            body = self.upload(make_pdf(RESUME_LINES)).get_json()
        feedback = body["category_feedback"][0]
        self.assertEqual(feedback["category"], "Content and completeness")
        self.assertEqual(feedback["detail"], "Your Skills presentation is clear but next step is vague.")

    # Extra: no file field
    def test_no_file(self):
        self.assertEqual(self.client.post("/api/analyze").status_code, 400)


if __name__ == "__main__":
    unittest.main()
